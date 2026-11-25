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

test('mouse pointer conversion accounts for scaled canvas bounds and camera offset', () => {
  const element = { addEventListener() {}, setAttribute() {} };
  const context = vm.createContext({
    console,
    document: { querySelector: () => element, addEventListener() {} },
    window: { addEventListener() {} },
    canvas: { getBoundingClientRect: () => ({ left: 40, top: 20, width: 480, height: 320 }) },
    camera: { x: 120, y: 60 }, VIEW_WIDTH: 240, VIEW_HEIGHT: 160,
  });
  vm.runInContext(source('js/input.js'), context);
  const point = vm.runInContext('worldPoint({ clientX: 280, clientY: 180 })', context);
  assert.deepEqual({ x: point.x, y: point.y }, { x: 240, y: 140 });
  assert.equal(vm.runInContext('worldPoint({ clientX: 10, clientY: 20 })', context), null);
});

test('defeating a wolf records one persisted Fang drop at its position', () => {
  const context = worldContext();
  context.progress.dungeonEnemies = {};
  context.MOB_LOOT = { wolf: { item: 'wolfFang', count: 1 } };
  context.storeProgress = () => {};
  vm.runInContext(`recordEnemyDamage({ id: 'forest:wolf:1', kind: 'wolf', x: 300, y: 400, health: 0 })`, context);
  const result = vm.runInContext(`({ saved: progress.dungeonEnemies['forest:wolf:1'], drops: groundLoot })`, context);
  assert.equal(result.saved.health, 0);
  assert.equal(result.saved.drop.item, 'wolfFang');
  assert.equal(result.drops.length, 1);
  assert.equal(result.drops[0].x, 300);
});

test('right-click slot interaction splits a stack while preserving its total count', () => {
  const element = { addEventListener() {}, setAttribute() {}, textContent: '' };
  const context = vm.createContext({ console, document: { querySelector: () => element } });
  vm.runInContext(source('js/inventory.js'), context);
  context.progress = {
    bag: [{ item: 'wood', count: 5 }], hotbar: [], chest: [], dungeonChests: {},
    bagCraft: [], benchCraft: [], hands: { left: null, right: null }, armor: {}, pet: {},
    held: null, chestId: null, panelMode: 'bag', overflow: { bag: {}, chest: {} },
  };
  context.updateInventory = () => {};
  context.updateFireballStatus = () => {};
  context.storeProgress = () => {};
  vm.runInContext(`slotAction({ area: 'bag', index: 0 }, true)`, context);
  const result = vm.runInContext('({ remaining: progress.bag[0].count, held: progress.held.count })', context);
  assert.equal(result.remaining, 2);
  assert.equal(result.held, 3);
});
