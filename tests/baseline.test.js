'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseline = require('./legacy-ui-colors.json');
const accents = /^(minimapGutter\.|editorGutter\.|diffEditorGutter\.|activityBarBadge\.|badge\.|statusBar\.debuggingBackground|statusBarItem\.(error|warning|remote)Background)/;

test('historical hashes remain documented as a reference', () => {
  const lines = fs.readFileSync(require('node:path').join(__dirname, 'legacy-themes.sha256'), 'utf8').trim().split('\n');
  assert.equal(lines.length, 4);
  for (const line of lines) assert.match(line, /^[a-f0-9]{64}  themes\/k2-[a-z]+\.json$/);
});
test('legacy background surfaces remain unchanged', () => {
  for (const [name, previous] of Object.entries(baseline)) {
    const current = require(`../themes/k2-${name}.json`).colors;
    const keys = Object.keys(previous).filter(key => key.toLowerCase().includes('background') && !accents.test(key));
    assert.ok(keys.length > 50);
    for (const key of keys) assert.equal(current[key], previous[key], `${name}: ${key}`);
  }
});
