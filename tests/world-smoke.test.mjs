import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function worldContext() {
  const context = vm.createContext({ console });
  for (const file of ['js/world/regions.js', 'js/world/towers.js', 'js/world.js', 'js/world/camera.js', 'js/world/collision.js']) {
    vm.runInContext(source(file), context, { filename: file });
  }
  context.progress = { collected: {}, buildings: {}, dungeonEnemies: {} };
  return context;
}

test('map collision blocks locked gates and allows them after the key is collected', () => {
  const context = worldContext();
  context.gate = vm.runInContext(`(() => {
    const y = WORLD_MAP.findIndex(row => row.includes('G'));
    const x = WORLD_MAP[y].indexOf('G');
    return worldCenter(x, y);
  })()`, context);
  assert.equal(vm.runInContext('blocked(gate.x, gate.y, 8, true, progress)', context), true);
  context.progress.collected['dungeon1:key'] = true;
  assert.equal(vm.runInContext('blocked(gate.x, gate.y, 8, true, progress)', context), false);
});

test('tower stairs connect floors and camera coordinates clamp to map bounds', () => {
  const context = worldContext();
  const result = vm.runInContext(`(() => {
    const stairLinks = TOWER_CONNECTIONS.filter(([from, to]) => Boolean(towerFloorAt(to)));
    player = { x: WORLD_WIDTH * 2, y: WORLD_HEIGHT * 2 };
    updateCamera(1 / 60);
    return { links: stairLinks.length, camera: { ...camera } };
  })()`, context);
  assert.ok(result.links >= 4);
  assert.ok(result.camera.x <= 96 * 32 - 240);
  assert.ok(result.camera.y <= 64 * 32 - 160);
  assert.ok(result.camera.x >= 0 && result.camera.y >= 0);
});

test('safe-world placement relocates a blocked point onto walkable terrain', () => {
  const context = worldContext();
  const result = vm.runInContext(`(() => {
    const blockedPoint = worldCenter(0, 0);
    const safe = safeWorldPoint(blockedPoint, progress, 'forest');
    return { safe, isBlocked: blocked(safe.x, safe.y, 8, true, progress), zone: regionAt(safe) };
  })()`, context);
  assert.equal(result.isBlocked, false);
  assert.equal(result.zone, 'forest');
});
