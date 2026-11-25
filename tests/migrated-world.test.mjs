import test from 'node:test';
import assert from 'node:assert/strict';
import { createCamera, pointInView, updateCamera } from '../src/game/world/camera.ts';
import { isBlocked, moveActor, nearestWalkablePoint } from '../src/game/world/collision.ts';
import { COTTAGE, LEGACY_ARRIVALS, WORLD_COLUMNS, WORLD_MAP, WORLD_ROWS, legacyWorldPoint, regionAt, worldCenter } from '../src/game/world/regions.ts';

const cameraWorld = {
  tileSize: 32, viewWidth: 240, viewHeight: 160, worldWidth: 3072, worldHeight: 2048,
  floorAt: () => undefined,
};

const rows = ['#####', '#..G#', '#.#.#', '#...#', '#####'];
const collisionWorld = {
  tileSize: 10, mapRows: rows, solidTiles: new Set(['#']), fallbackSpawn: { x: 15, y: 15 },
  tileAt: (x, y) => rows[y]?.[x],
  floorAt: () => undefined,
  regionAt: () => 'woods',
  gateUnlocked: (_tile, state) => state.key,
  fenceAt: () => false,
  worldCenter: (x, y) => ({ x: (x + 0.5) * 10, y: (y + 0.5) * 10 }),
  distance: (left, right) => Math.hypot(left.x - right.x, left.y - right.y),
};

test('typed camera follows smoothly, clamps at map edges, and supports view culling', () => {
  const camera = createCamera({ x: 60, y: 60 }, cameraWorld);
  updateCamera(camera, { x: 500, y: 600 }, 0.1, cameraWorld);
  assert.ok(camera.x > 0 && camera.y > 0);
  assert.equal(pointInView(camera, { x: camera.x + 10, y: camera.y + 10 }, cameraWorld), true);
  updateCamera(camera, { x: 9999, y: 9999 }, 1, cameraWorld);
  assert.ok(camera.x <= cameraWorld.worldWidth - cameraWorld.viewWidth);
  assert.ok(camera.y <= cameraWorld.worldHeight - cameraWorld.viewHeight);
  for (let frame = 0; frame < 40; frame++) updateCamera(camera, { x: 9999, y: 9999 }, 1 / 60, cameraWorld);
  assert.equal(camera.x, cameraWorld.worldWidth - cameraWorld.viewWidth);
  assert.equal(camera.y, cameraWorld.worldHeight - cameraWorld.viewHeight);
});

test('typed collision respects locked gates and safe-position recovery', () => {
  const lockedState = { key: false };
  const gate = { x: 35, y: 15 };
  assert.equal(isBlocked(gate, 1, lockedState, collisionWorld), true);
  assert.equal(isBlocked(gate, 1, { key: true }, collisionWorld), false);
  const safe = nearestWalkablePoint({ x: 5, y: 5 }, lockedState, collisionWorld, 'woods');
  assert.equal(isBlocked(safe, 1, lockedState, collisionWorld), false);
});

test('typed movement slides along collision edges without entering walls', () => {
  const actor = { x: 15, y: 35, radius: 1, zone: 'woods' };
  const moved = moveActor(actor, { x: 20, y: 20 }, { key: false }, collisionWorld);
  assert.equal(moved.x, 35);
  assert.equal(moved.y, 35);
  const blockedMove = moveActor(actor, { x: 20, y: 0 }, { key: false }, collisionWorld);
  assert.equal(blockedMove.x, 35);
});

test('typed map keeps its 96 by 64 footprint, saved-area arrivals and key landmarks', () => {
  assert.equal(WORLD_MAP.length, WORLD_ROWS);
  assert.ok(WORLD_MAP.every((row) => row.length === WORLD_COLUMNS));
  assert.ok(WORLD_MAP.some((row) => row.includes('G')));
  assert.ok(WORLD_MAP.some((row) => row.includes('X')));
  assert.deepEqual(legacyWorldPoint('house', { x: 200, y: 100 }), worldCenter(6, 12));
  assert.equal(regionAt(COTTAGE.spawn), 'cottage');
  assert.equal(LEGACY_ARRIVALS.dungeon1.x, worldCenter(36, 26).x);
});

test('typed encounter rolls stay deterministic and retain established mob and boss rewards', async () => {
  const { bossReward, createEncounterSpawns, dropForEnemy } = await import('../src/game/entities/encounters.ts');
  const first = createEncounterSpawns({ encounterSeed: 123456 });
  const second = createEncounterSpawns({ encounterSeed: 123456 });
  assert.deepEqual(first, second);
  assert.ok(first.some((spawn) => spawn.id === 'watchTop:boss' && spawn.kind === 'warden'));
  assert.deepEqual(dropForEnemy('wolf'), { item: 'wolfFang', count: 2 });
  assert.deepEqual(dropForEnemy('snake'), { item: 'serpentScale', count: 2 });
  assert.deepEqual(bossReward('dungeon3:warden').loot, [{ item: 'emberCore', count: 1 }]);
});

test('typed recipe guide preserves the dungeon upgrade ingredient quantities', async () => {
  const { recipeFor, ingredientsFor } = await import('../src/game/items/recipes.ts');
  const fang = recipeFor('benchCraft', 'fangBlade');
  const scale = recipeFor('benchCraft', 'scaleArmor');
  const ember = recipeFor('benchCraft', 'emberCharm');
  assert.ok(fang && scale && ember);
  assert.deepEqual([...ingredientsFor(fang)], [['wolfFang', 2], ['copper', 1], ['wood', 1]]);
  assert.deepEqual([...ingredientsFor(scale)], [['serpentScale', 3], ['copper', 1]]);
  assert.deepEqual([...ingredientsFor(ember)], [['emberCore', 1], ['wolfFang', 1], ['copper', 1], ['serpentScale', 1]]);
});

test('typed animation loop starts once and cancels its scheduled frame on disposal', async () => {
  const { createGameLoop } = await import('../src/game/core/loop.ts');
  let nextId = 0;
  const pending = new Map();
  const cancelled = [];
  const ticks = [];
  const scheduler = {
    request(callback) { const id = ++nextId; pending.set(id, callback); return id; },
    cancel(id) { cancelled.push(id); pending.delete(id); },
  };
  const loop = createGameLoop({
    scheduler,
    update: (dt) => ticks.push(dt),
    render: () => {},
  });
  loop.start();
  loop.start();
  assert.equal(pending.size, 1);
  const first = pending.get(1);
  pending.delete(1);
  first(1000);
  const second = pending.get(2);
  pending.delete(2);
  second(1200);
  assert.equal(ticks[1], 0.033);
  loop.stop();
  loop.stop();
  assert.deepEqual(cancelled, [3]);
  assert.equal(loop.isRunning(), false);
});
