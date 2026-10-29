'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const build = require('../scripts/build');
const tokens = require('../design/tokens.json');
const manifest = require('../package.json');
const exceptions = require('../design/legacy-textmate-duplicates.json');
const files = fs.readdirSync(path.join(__dirname, '../themes')).filter(x => x.endsWith('.json'));
const clone = value => structuredClone(value);
const incrementalSelectors = ['keyword.control.directive.define.c', 'storage.type.built-in.primitive.c', 'keyword.control.directive.include.c', 'keyword.control.directive.define.cpp', 'storage.type.built-in.primitive.cpp', 'keyword.control.directive.include.cpp', 'meta.preprocessor.include.cpp punctuation.definition.directive.cpp'];

test('references resolve recursively and detect missing references and cycles', () => {
  assert.deepEqual(build.resolveTokens({ a: '#123456', b: '{a}', c: ['{b}'] }), { a: '#123456', b: '#123456', c: ['#123456'] });
  assert.throws(() => build.resolveTokens({ a: '{missing}' }), /Unknown token reference/);
  assert.throws(() => build.resolveTokens({ a: '{b}', b: '{a}' }), /Circular token reference/);
});
test('invalid colors, incomplete configuration and missing variants fail', () => {
  const invalid = clone(tokens); invalid.palette.black = '#oops';
  assert.throws(() => build.validateRawTokens(invalid), /color|hex/i);
  const incomplete = clone(tokens); delete incomplete.components.syntax;
  assert.throws(() => build.validateRawTokens(incomplete));
  const missing = clone(tokens); delete missing.variants.dim;
  assert.throws(() => build.validateRawTokens(missing), /Missing required K2 variant/);
});
test('semantic duplicate selectors are rejected', () => {
  assert.throws(() => build.semanticRulesFromEntries([['variable', '#123456'], ['variable', '#123456']]), /Duplicate semantic selector/);
});
test('duplicate TextMate selectors are rejected', () => {
  const theme = build.buildTheme(build.createVariantTokenTree(tokens, 'coherence'), 'coherence');
  build.validateTextMateDuplicates(theme);
  const extra = clone(theme); extra.tokenColors.push(clone(extra.tokenColors[0]));
  assert.throws(() => build.validateTextMateDuplicates(extra), /duplicate TextMate/);
});
test('registry rejects missing, extra, mismatched and misplaced themes', () => {
  build.validateRegistry(tokens, manifest, build.THEME_OUTPUTS, files);
  const added = clone(tokens); added.variants.extra = clone(added.variants.dim);
  assert.throws(() => build.validateRegistry(added, manifest, build.THEME_OUTPUTS, files), /differ/);
  assert.throws(() => build.validateRegistry(tokens, manifest, build.THEME_OUTPUTS, [...files, 'extra.json']), /differ/);
  for (const field of ['label', 'uiTheme', 'path']) {
    const bad = clone(manifest); bad.contributes.themes[0][field] = 'wrong';
    assert.throws(() => build.validateRegistry(tokens, bad, build.THEME_OUTPUTS, files), /registration/);
  }
  const outputs = { ...build.THEME_OUTPUTS, dim: '/wrong.json' };
  assert.throws(() => build.validateRegistry(tokens, manifest, outputs, files), /Incorrect output path/);
});
test('memory construction is deterministic and matches independent files', () => {
  const first = build.prepareThemes(tokens, manifest, files, exceptions).themes;
  const second = build.prepareThemes(tokens, manifest, files, exceptions).themes;
  for (const key of build.REQUIRED_VARIANTS) {
    assert.equal(build.serializeJson(first[key]), build.serializeJson(second[key]));
    assert.equal(build.serializeJson(first[key]), fs.readFileSync(build.THEME_OUTPUTS[key], 'utf8'));
  }
});
test('an in-memory variant policy can replace syntax, styles and bracket colors', () => {
  const tree = build.createVariantTokenTree(tokens, 'dim');
  const standard = build.buildTheme(tree, 'dim');
  const policy = {
    omitColors: ['editorBracketHighlight.foreground1'],
    textMate: () => [{ name: 'Language override', scope: ['keyword.control.test'], settings: { foreground: '#123456', fontStyle: 'italic' } }],
    semantic: () => [['variable:test', { foreground: '#abcdef', bold: true }]]
  };
  const custom = build.buildTheme(tree, 'dim', policy);
  assert.equal(custom.colors['editorBracketHighlight.foreground1'], undefined);
  assert.equal(custom.tokenColors[0].settings.fontStyle, 'italic');
  assert.deepEqual(custom.semanticTokenColors, { 'variable:test': { foreground: '#abcdef', bold: true } });
  assert.equal(standard.colors['editorBracketHighlight.foreground1'], undefined);
  assert.notDeepEqual(custom.tokenColors, standard.tokenColors);
});

test('five themes share the Ferro palette, selectors and typography', () => {
  const all = build.prepareThemes(tokens, manifest, files, exceptions).themes;
  const reference = all.ferro;
  const expected = { variable: '#CFD5DA', 'variable.readonly': '#CFD5DA', property: '#CFD5DA', 'property.readonly': '#CFD5DA', parameter: '#FF9638', function: '#C25CFF', method: '#C25CFF', type: '#FF5263', class: '#FF5263', macro: '#37D9B2', enumMember: '#37D9B2', number: '#A9E84C', string: '#58C5F2', comment: '#A6B2BD', operator: '#ADB6BE' };
  for (const [selector, color] of Object.entries(expected)) assert.equal(reference.semanticTokenColors[selector], color);
  assert.equal(reference.colors['editor.background'], '#131416');
  for (const theme of Object.entries(all).filter(([name]) => name !== "ash").map(([, theme]) => theme)) {
    assert.deepEqual(theme.tokenColors, reference.tokenColors);
    assert.deepEqual(theme.semanticTokenColors, reference.semanticTokenColors);
    assert.ok(!Object.keys(theme.colors).some(k => k.startsWith('editorBracketHighlight.')));
    assert.ok(theme.tokenColors.every(rule => !('fontStyle' in rule.settings)));
    assert.ok(!JSON.stringify([theme.tokenColors, theme.semanticTokenColors]).toUpperCase().includes('#C88A72'));
  }
  const scope = name => reference.tokenColors.find(rule => rule.scope.includes(name)).settings.foreground;
  for (const [name, color] of Object.entries({ 'constant.language.null': '#FFE84B', 'storage.modifier': '#B6AD2A', 'keyword.control.import': '#0897C7', 'keyword.control.directive.c': '#0DA88D', 'constant.language.boolean': '#A9E84C', 'string.quoted.docstring.multi.python': '#A6B2BD' })) assert.equal(scope(name), color, name);
});
test('every contractual syntax color satisfies 4.5:1 on every editor', () => {
  const resolved = build.resolveVariantTokenTrees(tokens);
  for (const name of build.REQUIRED_VARIANTS) build.validateContrastContracts(resolved[name], name);
  const bad = clone(resolved.ferro); bad.palette.ferroImport = '#131416';
  assert.throws(() => build.validateContrastContracts(bad, 'ferro'), /Critical contrast/);
});

test('generated interface text contrasts with each actual surface', () => {
  const themes = build.prepareThemes(tokens, manifest, files, exceptions).themes;
  for (const [name, theme] of Object.entries(themes)) {
    for (const [foreground, background, minimum] of [
      ['editor.foreground', 'editor.background', 4.5], ['sideBar.foreground', 'sideBar.background', 4.5],
      ['input.foreground', 'input.background', 4.5], ['terminal.foreground', 'panel.background', 4.5],
      ['button.foreground', 'button.background', 3]
    ]) assert.ok(build.contrastRatio(theme.colors[foreground], theme.colors[background]) >= minimum, `${name}: ${foreground} on ${background}`);
  }
});


test('six exact names and phase 5 preservation snapshots', () => {
  const crypto = require('node:crypto');
  const baseline = require('./phase5-baseline.json');
  const names = ['Coherence', 'Vacuum', 'Dim', 'Endurance', 'Ferro', 'Ash'];
  assert.deepEqual(manifest.contributes.themes.map(entry => entry.label), names);
  assert.deepEqual(build.REQUIRED_VARIANTS.map(name => require(`../themes/k2-${name}.json`).name), names);
  for (const [name, hash] of Object.entries(baseline)) {
    const theme = clone(require(`../themes/k2-${name}.json`)); delete theme.name;
    for (const rule of theme.tokenColors) rule.scope = rule.scope.filter(scope => !incrementalSelectors.includes(scope));
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(theme)).digest('hex'), hash, name);
  }
});

test('observed C scopes resolve to their roles without changing imports, macros or variables', () => {
  const all = build.prepareThemes(tokens, manifest, files, exceptions).themes;
  // All selectors involved here are simple scopes; TextMate matches complete dot-separated prefixes.
  const matches = (selector, scope) => scope === selector || scope.startsWith(`${selector}.`);
  const winner = (theme, scope) => {
    const candidates = theme.tokenColors.flatMap(rule => rule.scope.filter(selector => matches(selector, scope)).map(selector => ({ selector, rule })));
    candidates.sort ( (a, b) => b.selector.split('.').length - a.selector.split('.').length );
    assert.ok(candidates.length, scope);
    if (candidates.length > 1) assert.notEqual(candidates[0].selector.split('.').length, candidates[1].selector.split('.').length, `ambiguous ${scope}`);
    return candidates[0];
  };
  for (const [name, type, directive, imported, macro, variable] of [
    ['ferro', '#FF5263', '#0DA88D', '#0897C7', '#37D9B2', '#CFD5DA'],
    ['ash', '#A52239', '#00654F', '#00617A', '#006852', '#323B45']
  ]) {
    const theme = all[name];
    for (const [scope, selector, color] of [
      ['storage.type.built-in.primitive.c', 'storage.type.built-in.primitive.c', type],
      ['keyword.control.directive.define.c', 'keyword.control.directive.define.c', directive],
      ['keyword.control.directive.include.c', 'keyword.control.directive.include.c', imported],
      ['keyword.control.import', 'keyword.control.import', imported],
      ['string.quoted.other.lt-gt.include.c', 'string.quoted.other.lt-gt.include.c', imported],
      ['string.quoted.double.include.c', 'string.quoted.double.include.c', imported],
      ['entity.name.function.preprocessor.c', 'entity.name.function.preprocessor', macro],
      ['variable.other.readwrite.c', 'variable', variable]
    ]) {
      const result = winner(theme, scope);
      assert.equal(result.selector, selector, scope);
      assert.equal(result.rule.settings.foreground, color, scope);
    }
    assert.equal(winner(theme, 'keyword.control.directive.pragma.c').selector, 'keyword');
    assert.equal(theme.semanticTokenColors.macro, macro);
    assert.equal(theme.semanticTokenColors.variable, variable);
    build.validateTextMateDuplicates(theme);
  }
});

test('observed C++ scopes select their roles with include-only punctuation context', () => {
  const all = build.prepareThemes(tokens, manifest, files, exceptions).themes;
  // These selectors contain one scope or an ancestor and a leaf; rank the leaf first,
  // then its ancestor, as TextMate does for the relevant candidates.
  const winner = (theme, stack) => {
    const matches = (prefix, scope) => scope === prefix || scope.startsWith(`${prefix}.`);
    const candidates = theme.tokenColors.flatMap(rule => rule.scope.flatMap(selector => {
      const parts = selector.split(' ');
      if (!matches(parts.at(-1), stack.at(-1))) return [];
      if (parts.length === 2 && !stack.slice(0, -1).some(scope => matches(parts[0], scope))) return [];
      return [{ selector, rule, rank: [parts.at(-1).split('.').length, parts.length === 2 ? parts[0].split('.').length : 0] }];
    }));
    candidates.sort((a, b) => b.rank[0] - a.rank[0] || b.rank[1] - a.rank[1]);
    if (candidates.length > 1) assert.notDeepEqual(candidates[0].rank, candidates[1].rank, `ambiguous ${stack}`);
    return candidates[0];
  };
  for (const [name, type, imported, directive, modifier] of [
    ['ferro', '#FF5263', '#0897C7', '#0DA88D', '#B6AD2A'],
    ['ash', '#A52239', '#00617A', '#00654F', build.createVariantTokenTree(tokens, 'ash').palette.ferroModifier]
  ]) {
    const theme = all[name];
    for (const [stack, selector, color] of [
      [['storage.type.built-in.primitive.cpp'], 'storage.type.built-in.primitive.cpp', type],
      [['keyword.control.directive.include.cpp'], 'keyword.control.directive.include.cpp', imported],
      [['meta.preprocessor.include.cpp', 'punctuation.definition.directive.cpp'], 'meta.preprocessor.include.cpp punctuation.definition.directive.cpp', imported],
      [['keyword.control.directive.define.cpp'], 'keyword.control.directive.define.cpp', directive],
      [['storage.modifier.cpp'], 'storage.modifier', modifier]
    ]) {
      const result = winner(theme, stack);
      assert.equal(result?.selector, selector, stack.join(' '));
      assert.equal(result.rule.settings.foreground, color, selector);
    }
    assert.equal(winner(theme, ['meta.preprocessor.define.cpp', 'punctuation.definition.directive.cpp']), undefined);
    assert.equal(winner(theme, ['keyword.control.directive.pragma.cpp']).selector, 'keyword');
    assert.equal(theme.semanticTokenColors.type, type);
    build.validateTextMateDuplicates(theme);
  }
});

test('Ash preserves semantic roles with its own accessible palette', () => {
  const ash = require('../themes/k2-ash.json');
  const ferro = require('../themes/k2-ferro.json');
  const resolved = build.createVariantTokenTree(tokens, 'ash');
  assert.equal(ash.type, 'light');
  assert.equal(ash.colors['editor.background'], '#D4D9DE');
  assert.deepEqual(ash.tokenColors.map(({name, scope}) => ({name, scope})), ferro.tokenColors.map(({name, scope}) => ({name, scope})));
  assert.deepEqual(Object.keys(ash.semanticTokenColors), Object.keys(ferro.semanticTokenColors));
  const roles = ['Variable','Type','Function','Parameter','Keyword','Import','Decorator','Preprocessor','Macro','Number','Null','String','Modifier','Operator','Comment'];
  for (const role of roles) assert.ok(build.contrastRatio(resolved.palette[`ferro${role}`], ash.colors['editor.background']) >= 4.5, role);
  for (const [selector, role] of Object.entries({variable:'Variable', property:'Variable', parameter:'Parameter', class:'Type', type:'Type', function:'Function', method:'Function', macro:'Macro', enumMember:'Macro'})) assert.equal(ash.semanticTokenColors[selector], resolved.palette[`ferro${role}`]);
  for (let i = 0; i < ash.tokenColors.length; i++) {
    const old = ferro.tokenColors[i].settings.foreground;
    const role = roles.find(role => tokens.palette[`ferro${role}`] === old);
    assert.ok(role); assert.equal(ash.tokenColors[i].settings.foreground, resolved.palette[`ferro${role}`]);
    assert.deepEqual(Object.keys(ash.tokenColors[i].settings), ['foreground']);
  }
  assert.ok(Object.values(ash.semanticTokenColors).every(value => typeof value === 'string'));
  assert.ok(!Object.keys(ash.colors).some(key => key.startsWith('editorBracketHighlight.')));
  build.validateTextMateDuplicates(ash);
});
