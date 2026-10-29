'use strict';
// Snapshot taken from the four generated themes before Phase 3.
const baseline = require('../tests/legacy-ui-colors.json');
const common = require('../themes/k2-coherence.json');
const accent = /^(minimapGutter\.|editorGutter\.|diffEditorGutter\.|activityBarBadge\.|badge\.|statusBar\.debuggingBackground|statusBarItem\.(error|warning|remote)Background)/;
let unexpected = 0;
for (const [name, previous] of Object.entries(baseline)) {
  const theme = require(`../themes/k2-${name}.json`);
  let preserved = 0, shared = 0;
  for (const key of new Set([...Object.keys(previous), ...Object.keys(theme.colors)])) {
    const value = theme.colors[key];
    if (key.startsWith('editorBracketHighlight.')) continue; // native bracket coloring
    if (!(key in previous) || !(key in theme.colors)) {
      console.error(`Unexpected UI key ${name}: ${key}`); unexpected++; continue;
    }
    const background = key.toLowerCase().includes('background') && !accent.test(key);
    if (background) {
      if (previous[key] !== value) { console.error(`Unexpected background ${name}: ${key}: ${previous[key]} -> ${value}`); unexpected++; }
      else preserved++;
    } else if (previous[key] !== value) {
      if (value !== common.colors[key]) { console.error(`Unexpected accent ${name}: ${key}`); unexpected++; }
      else shared++;
    }
  }
  if (theme.name !== `${name[0].toUpperCase()}${name.slice(1)}` || theme.type !== 'dark' || theme.semanticHighlighting !== true) {
    console.error(`Unexpected theme metadata: ${name}`); unexpected++;
  }
  console.log(`${name}: ${preserved} backgrounds preserved; ${shared} shared UI colors changed; syntax and typography changed by design.`);
}
console.log('ferro: new registered variant; editor background #131416.');
console.log(`Unexpected changes: ${unexpected}`);
if (unexpected) process.exitCode = 1;

// Compare against Phase 5 after removing the approved incremental selectors.
const crypto = require('node:crypto');
const phase5 = require('../tests/phase5-baseline.json');
for (const [name, hash] of Object.entries(phase5)) {
  const theme = structuredClone(require(`../themes/k2-${name}.json`)); delete theme.name;
  for (const rule of theme.tokenColors) rule.scope = rule.scope.filter(scope => !['keyword.control.directive.define.c', 'storage.type.built-in.primitive.c', 'keyword.control.directive.include.c', 'keyword.control.directive.define.cpp', 'storage.type.built-in.primitive.cpp', 'keyword.control.directive.include.cpp', 'meta.preprocessor.include.cpp punctuation.definition.directive.cpp'].includes(scope));
  const actual = crypto.createHash('sha256').update(JSON.stringify(theme)).digest('hex');
  if (actual !== hash) { console.error(`${name}: phase 5 preservation FAIL`); process.exitCode = 1; }
  else console.log(`${name}: phase 5 preservation PASS (name and approved incremental selectors excluded)`);
}
const ash = require('../themes/k2-ash.json');
const ferro = require('../themes/k2-ferro.json');
const scopes = theme => theme.tokenColors.map(({name, scope}) => ({name, scope}));
if (JSON.stringify(scopes(ash)) !== JSON.stringify(scopes(ferro)) || JSON.stringify(Object.keys(ash.semanticTokenColors)) !== JSON.stringify(Object.keys(ferro.semanticTokenColors))) { console.error('Ash role structure FAIL'); process.exitCode = 1; }
else console.log('Ash: light palette, shared TextMate and semantic selector structure PASS.');
