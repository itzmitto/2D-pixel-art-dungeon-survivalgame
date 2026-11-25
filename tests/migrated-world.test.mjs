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

test('typed tower graph preserves both tower doors, stairs, and saved chest loot', async () => {
  const { TOWER_CONNECTIONS, TOWER_CHESTS, TOWER_FLOORS, towerFloorAt } = await import('../src/game/world/towers.ts');
  assert.equal(TOWER_FLOORS.length, 3);
  assert.equal(TOWER_CONNECTIONS.length, 6);
  assert.equal(towerFloorAt(TOWER_CONNECTIONS[0][1])?.id, 'watch');
  assert.equal(towerFloorAt(TOWER_CONNECTIONS[2][1])?.id, 'watchTop');
  assert.equal(towerFloorAt(TOWER_CONNECTIONS[4][1])?.id, 'fen');
  assert.deepEqual(TOWER_CHESTS.watchTop.loot, []);
  assert.equal(TOWER_CHESTS.watch.loot[0][0], 'wolfFang');
});

test('typed sprite manifest points only to local PNGs with the declared sheet dimensions', async () => {
  const fs = await import('node:fs');
  const { SPRITE_SHEETS, SPRITE_IDS } = await import('../src/game/rendering/sprites.ts');
  for (const id of SPRITE_IDS) {
    const definition = SPRITE_SHEETS[id];
    const path = new URL(`../public${definition.path}`, import.meta.url);
    assert.equal(fs.existsSync(path), true, `Missing sprite sheet for ${id}`);
    const bytes = fs.readFileSync(path);
    assert.equal(bytes.readUInt32BE(16), definition.frameWidth * definition.columns, `${id} width mismatch`);
    assert.equal(bytes.readUInt32BE(20), definition.frameHeight * definition.rows, `${id} height mismatch`);
  }
});

test('typed party placement and companion trail keep Vonkje behind the player', async () => {
  const { createParty, updateCompanionFollow } = await import('../src/game/entities/party.ts');
  const openWorld = {
    tileSize: 10, mapRows: Array.from({ length: 40 }, () => '.'.repeat(40)), solidTiles: new Set(), fallbackSpawn: { x: 205, y: 205 },
    tileAt: (x, y) => (x < 0 || y < 0 || x >= 40 || y >= 40 ? undefined : '.'),
    floorAt: () => undefined, regionAt: () => 'woods', gateUnlocked: () => true, fenceAt: () => false,
    worldCenter: (x, y) => ({ x: (x + 0.5) * 10, y: (y + 0.5) * 10 }),
    distance: (left, right) => Math.hypot(left.x - right.x, left.y - right.y),
  };
  const party = createParty({ x: 205, y: 205 }, 3, 0, {}, openWorld);
  const prior = { ...party.companion };
  updateCompanionFollow({ x: 280, y: 280 }, party.companion, party.trail, 1, 0.2, false);
  assert.notDeepEqual(party.companion, prior);
  assert.equal(party.player.hearts, 3);
  assert.ok(party.trail.some((node) => node.time === 1));
});

test('typed inventory preserves splitting, isolated chest transfers, and take-only crafting costs', async () => {
  const { clickSlot, shiftTransfer, takeCraftOutput } = await import('../src/game/items/inventoryModel.ts');
  const { recipeFor } = await import('../src/game/items/recipes.ts');
  const state = {
    bag: Array(27).fill(null), hotbar: Array(9).fill(null), chest: Array(27).fill(null),
    dungeonChests: { supply: Array(27).fill(null) }, bagCraft: Array(4).fill(null), benchCraft: Array(9).fill(null),
    hands: { left: null, right: null }, armor: { helmet: null, chestplate: null, boots: null }, pet: { pet: null },
    held: null, panelMode: 'bag', chestId: null,
  };
  state.bag[0] = { item: 'wood', count: 5 };
  clickSlot(state, { area: 'bag', index: 0 }, true);
  assert.equal(state.held.count, 3);
  assert.equal(state.bag[0].count, 2);
  state.held = null;
  state.bag[1] = { item: 'wolfFang', count: 2 };
  state.panelMode = 'chest';
  state.chestId = 'supply';
  assert.equal(shiftTransfer(state, { area: 'bag', index: 1 }), 2);
  assert.equal(state.dungeonChests.supply[0].item, 'wolfFang');
  assert.equal(state.chest[0], null);

  const recipe = recipeFor('benchCraft', 'scaleArmor');
  assert.ok(recipe);
  for (const [index, cell] of recipe.pattern.entries()) {
    if (cell) state.benchCraft[index] = { item: cell.item, count: cell.count };
  }
  state.held = { item: 'scaleArmor', count: 1, source: null };
  const before = JSON.stringify(state.benchCraft);
  assert.equal(takeCraftOutput(state, 'benchCraft', recipe), false);
  assert.equal(JSON.stringify(state.benchCraft), before);
  state.held = null;
  assert.equal(takeCraftOutput(state, 'benchCraft', recipe), true);
  assert.equal(state.held.item, 'scaleArmor');
  assert.ok(state.benchCraft.every((stack) => stack === null));
});
