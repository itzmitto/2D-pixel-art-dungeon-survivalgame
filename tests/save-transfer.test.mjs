import test from 'node:test';
import assert from 'node:assert/strict';
import { exportSaveText, parseSaveFile } from '../src/storage/saveTransfer.ts';

test('accepts current and legacy save shapes without rewriting them', () => {
  const current = JSON.stringify({ version: 8, bag: [], position: { x: 1, y: 2 }, buildings: {} });
  const legacy = JSON.stringify({ wood: 4, items: { fence: 2 }, position: { x: 10, y: 20 } });
  assert.equal(parseSaveFile(current).version, 8);
  assert.equal(parseSaveFile(legacy).wood, 4);
});

test('rejects invalid files before they can replace browser storage', () => {
  for (const value of ['not json', '[]', 'null', '{"hello":"world"}', '{"version":"eight"}']) {
    assert.throws(() => parseSaveFile(value));
  }
});

test('export returns the exact validated saved text', () => {
  const text = '{"version":8,"bag":[]}';
  assert.equal(exportSaveText({ getItem: () => text }, 'vonkje-survival-v1'), text);
  assert.throws(() => exportSaveText({ getItem: () => null }, 'vonkje-survival-v1'));
});
