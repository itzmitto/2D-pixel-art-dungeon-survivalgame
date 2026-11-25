import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const project = new URL('../', import.meta.url);
const root = (path) => new URL(path, project);
const read = (path) => readFileSync(root(path), 'utf8');

function filesBelow(path) {
  return readdirSync(root(path), { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? filesBelow(child) : [child];
  });
}

test('React entrypoint serves every classic game system from the production public tree', () => {
  const entry = read('src/main.tsx');
  const runtimeFiles = new Set(filesBelow('public/legacy-runtime').map((path) => path.replace('public/', '/')));
  const referenced = [...entry.matchAll(/'((?:\/legacy-runtime)[^']+)'/g)].map((match) => match[1]);
  assert.ok(referenced.length >= 18);
  for (const path of referenced) assert.ok(runtimeFiles.has(path), `Missing runtime script ${path}`);
  assert.ok(statSync(root('legacy-index.html')).size > 0, 'Original direct-file startup is retained');
});

test('PNG assets remain local and retain the source dimensions used by sprite sheets', () => {
  const dimensions = (file) => {
    const bytes = readFileSync(root(file));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  };
  assert.deepEqual(dimensions('public/images/characters/knight-walk.png'), [240, 160]);
  assert.deepEqual(dimensions('public/images/pets/vonkje-flight.png'), [1024, 204]);
  assert.deepEqual(dimensions('public/images/third-party/wolf-enemy/wolf-idle-sprite-sheet.png'), [1600, 320]);
  assert.ok(read('public/images/ASSET_CREDITS.md').includes('CC0'));
});

test('legacy runtime exposes a single frame-loop cleanup hook and keeps save migrations', () => {
  const main = read('public/legacy-runtime/main.js');
  const saves = read('public/legacy-runtime/js/save.js');
  assert.match(main, /window\.vonkjeStop = stopGame/);
  assert.match(main, /cancelAnimationFrame\(gameFrame\)/);
  assert.match(saves, /SAVE_VERSION = 8/);
  assert.match(saves, /function loadProgress\(/);
  assert.match(read('public/legacy-runtime/js/world/collision.js'), /function safeWorldPoint\(/);
  assert.match(read('public/legacy-runtime/js/world/camera.js'), /function updateCamera\(/);
});
