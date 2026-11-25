"use strict";

const TILE = 32;
// # wall, T torch, P spawn, K key, A entrance, E exit, C chest, V potion.
const ROOM_ONE = [
  "###T#######T###",
  "#.............#",
  "#.###.T.....K.#",
  "#..C..#.......#",
  "T.....#...##..T",
  "#.###.....#...#",
  "#...T.....T...#",
  "#.............#",
  "AP............E",
  "###T#######T###",
];

const ROOM_TWO = [
  "###T#######T###",
  "#.....#.......E",
  "#.##..#..###..#",
  "#.....#.......#",
  "####.T#..##...#",
  "##V#.....C....#",
  "##.#.####.....#",
  "##.#..........#",
  "AP............#",
  "###T#######T###",
];
const WARDEN_ROOM = [
  "###T#######T###",
  "#.............#",
  "#....#...#..C.#",
  "#.............#",
  "T.............T",
  "A.............E",
  "#.............#",
  "#....#...#....#",
  "#.............#",
  "###T#######T###",
];
// Each area uses the same tile grid and collision rules.
const FOREST = [
  "###############",
  "#.Y..Y....Y.Y.#",
  "#.HHHH.....QGQ#",
  "#.HHHH....==R.#",
  "#.HHUH..===...#",
  "#..+P====.....#",
  "#..Y.Y..Y.Y.MN#",
  "#.Y...Y...N..N#",
  "#...Y....YMYN.#",
  "###############",
];
const HOUSE = [
  "###############",
  "###############",
  "##...........##",
  "##..W..B..O..##",
  "##...........##",
  "##...........##",
  "##...........##",
  "##.....P.....##",
  "#######U#######",
  "###############",
];
const AREAS = { forest: FOREST, house: HOUSE, dungeon1: ROOM_ONE, dungeon2: ROOM_TWO, dungeon3: WARDEN_ROOM };
const WORLD_WIDTH = FOREST[0].length * TILE;
const WORLD_HEIGHT = FOREST.length * TILE;

function markers(symbol) {
  const positions = [];
  room.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      if (tile === symbol) positions.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
    });
  });
  return positions;
}

function arrivalAt(x, y, dx, dy) {
  return { ...centerOf({ x, y }), direction: { x: dx, y: dy } };
}

const WORKBENCH_ARRIVAL = arrivalAt(4, 4, 0, -1);
const WARDEN_ID = "dungeon3:warden";
const CHEST_STATIONS = {
  house: { name: "House chest", tile: "O", arrival: arrivalAt(10, 4, 0, -1) },
  dungeon1: {
    name: "Supply chest", tile: "C", arrival: arrivalAt(3, 4, 0, -1),
    loot: [["wood", 14], ["stone", 8], ["copper", 8], ["wolfFang", 2], ["serpentScale", 1], ["potion", 2]],
  },
  dungeon2: {
    name: "Reserve chest", tile: "C", arrival: arrivalAt(9, 6, 0, -1),
    loot: [["wood", 10], ["stone", 6], ["copper", 8], ["wolfFang", 1], ["serpentScale", 3], ["potion", 2]],
  },
  dungeon3: { name: "Reward chest", tile: "C", arrival: arrivalAt(12, 3, 0, -1), loot: [] },
};
const houseApproach = arrivalAt(4, 5, 0, 1);
const caveApproach = arrivalAt(12, 3, 0, 1);
const PORTALS = {
  forest: {
    U: { to: "house", arrival: arrivalAt(7, 7, 0, -1), back: "U", dy: -1 },
    G: { to: "dungeon1", arrival: arrivalAt(1, 8, 1, 0), back: "A", dy: -1 },
  },
  house: {
    U: { to: "forest", arrival: houseApproach, back: "U", dy: 1 },
  },
  dungeon1: {
    A: { to: "forest", arrival: caveApproach, back: "G", dx: -1 },
    E: { to: "dungeon2", arrival: arrivalAt(1, 8, 1, 0), back: "A", dx: 1, ready: () => hasKey },
  },
  dungeon2: {
    A: { to: "dungeon1", arrival: arrivalAt(13, 8, -1, 0), back: "E", dx: -1 },
    E: { to: "dungeon3", arrival: arrivalAt(1, 5, 1, 0), back: "A", dx: 1 },
  },
  dungeon3: {
    A: { to: "dungeon2", arrival: arrivalAt(13, 1, -1, 0), back: "E", dx: -1 },
    E: { to: "forest", arrival: caveApproach, back: "G", dx: 1, ready: wardenDefeated },
  },
};
const DUNGEON_KEY = "dungeon1:key";
const DUNGEON_POTION = "dungeon2:potion";
// Preserve the original encounter order so saved defeats and drops keep their IDs.
const DUNGEON_SPAWNS = {
  dungeon1: [["wolf", 10, 7], ["snake", 10, 2]],
  dungeon2: [["snake", 2, 3], ["wolf", 10, 7], ["snake", 12, 3]],
};
const DUNGEON_DROPS = { wolf: { item: "wolfFang", count: 2 }, snake: { item: "serpentScale", count: 2 } };
const FOLLOW_DELAY = 0.28;
const FOLLOW_DISTANCE = 23;
let area, room, key, potion;
let areaPortals, arrivalGuard;
let player, dragon, enemies, trail, elapsed, hasKey, protection, phase;
let groundLoot = [];
// Keep old stumps, depleted nodes, and unclaimed drops from saves that had gathering.
const LEGACY_RESOURCES = {
  Y: { state: "trees", hits: 3, item: "wood", count: 3 },
  M: { state: "mines", hits: 2, item: "stone", count: 3 },
  N: { state: "mines", hits: 3, item: "copper", count: 3 },
};

function resourceDrop(resource, x, y) {
  return {
    id: "resource:" + tileId(x, y),
    item: resource.item, count: resource.count, ...centerOf({ x, y }),
  };
}

function forestLoot() {
  const drops = progress.legacyTrailLoot ? [...FOREST_LOOT] : [];
  FOREST.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      const resource = LEGACY_RESOURCES[tile];
      if (resource && exhausted(resource, x, y)) drops.push(resourceDrop(resource, x, y));
    });
  });
  return drops.filter(drop => !progress.collected[drop.id]);
}
const FOREST_LOOT = [
  { id: "trail-wood", item: "wood", count: 2, ...centerOf({ x: 6, y: 5 }) },
  { id: "trail-potion", item: "potion", count: 1, ...centerOf({ x: 9, y: 4 }) },
];

function enterArea(nextArea, health, arrival = houseApproach, back = "") {
  clearMouseRoute();
  area = nextArea;
  room = AREAS[area];
  areaPortals = Object.entries(PORTALS[area]).map(([tile, portal]) => ({
    tile, ...portal, position: markers(tile)[0],
  }));
  arrivalGuard = back ? { tile: back, keys: new Set(pressed) } : null;
  groundLoot = area === "forest" ? forestLoot() : [];
  swing = undefined;
  const { direction, ...spawn } = arrival;
  facingTile = aim = direction;
  const facing = direction.x || 1;
  player = { ...spawn, radius: 8, facing, hearts: health, walkTime: 0 };
  const offsets = direction.x ? [[0, -1], [0, 1], [1, 0], [-1, 0]] : [[-1, 0], [1, 0], [0, 1], [0, -1]];
  const dragonSpawn = offsets.map(([x, y]) => ({
    x: spawn.x + x * FOLLOW_DISTANCE, y: spawn.y + y * FOLLOW_DISTANCE,
  })).find(position => !blocked(position.x, position.y, 8, false));
  dragon = { ...(dragonSpawn || spawn), facing };
  [key] = markers("K");
  [potion] = markers("V");
  hasKey = Boolean(key && progress.collected[DUNGEON_KEY]);
  if (progress.collected[DUNGEON_POTION]) potion = undefined;
  enemies = loadEnemies();
  fireballs = [];
  trail = [{ ...dragon, time: 0 }, { ...spawn, time: 0 }];
  elapsed = 0;
  status.textContent = "";
  updateHud();
}

function dungeonSpawns(mapArea) {
  if (mapArea === "dungeon3") return [{ id: WARDEN_ID, kind: "warden", ...centerOf({ x: 7, y: 5 }) }];
  return (DUNGEON_SPAWNS[mapArea] || []).map(([kind, x, y], index) => ({
    id: mapArea + ":slime:" + index, kind, ...centerOf({ x, y }),
  }));
}

function enemyDrop(id, { x, y, drop }) {
  return { id, x, y, ...drop };
}

function wardenDefeated() {
  return progress.dungeonEnemies[WARDEN_ID]?.health === 0;
}

function chestUnlocked(id) {
  return id !== "dungeon3" || wardenDefeated();
}

function loadEnemies() {
  return dungeonSpawns(area).flatMap(spawn => {
    const { id, kind } = spawn;
    const saved = progress.dungeonEnemies[id];
    if (saved?.health === 0) {
      if (saved.drop && !progress.collected[id]) groundLoot.push(enemyDrop(id, saved));
      return [];
    }
    const spec = ENEMIES[kind];
    return [{ ...spawn, radius: spec.radius ?? 8, health: saved?.health ?? spec.health, facing: 1, flash: 0, walkTime: 0 }];
  });
}

function recordEnemyDamage({ id, kind, x, y, health }) {
  if (progress.dungeonEnemies[id]?.health === 0) return;
  if (health > 0) {
    progress.dungeonEnemies[id] = { health };
  } else if (id === WARDEN_ID) {
    progress.dungeonEnemies[id] = { health: 0 };
    progress.dungeonCompleted = true;
    progress.dungeonChests.dungeon3[0] = { item: "emberCore", count: 1 };
  } else {
    const defeat = { health: 0, x, y, drop: DUNGEON_DROPS[kind] };
    progress.dungeonEnemies[id] = defeat;
    groundLoot.push(enemyDrop(id, defeat));
  }
  storeProgress();
  if (id === WARDEN_ID) {
    updateWardenHud();
    if (health === 0) showFeedback("Cyclops Warden defeated. The reward chest and cave exit are open.");
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function portalOpen(portal) {
  return !portal.ready || portal.ready();
}

// Test all four corners. Separate the axes so actors can slide along walls.
function blocked(x, y, radius, canUsePortals = true) {
  for (const edgeY of [y - radius, y + radius]) {
    for (const edgeX of [x - radius, x + radius]) {
      const column = Math.floor(edgeX / TILE);
      const row = Math.floor(edgeY / TILE);
      const tile = room[row]?.[column];
      const resource = area === "forest" && LEGACY_RESOURCES[tile];
      if (area === "forest" && ((resource && !exhausted(resource, column, row)) ||
          progress.buildings[tileId(column, row)] === "fence")) return true;
      if (!tile || "#TCHBQWO".includes(tile)) return true;
      const portal = PORTALS[area][tile];
      if (portal && (!canUsePortals || !portalOpen(portal))) return true;
    }
  }
  return false;
}

function move(actor, dx, dy, canUsePortals = true) {
  if (!blocked(actor.x + dx, actor.y, actor.radius, canUsePortals)) actor.x += dx;
  if (!blocked(actor.x, actor.y + dy, actor.radius, canUsePortals)) actor.y += dy;
}

function tileId(x, y) {
  return x + "," + y;
}

function exhausted(resource, x, y) {
  return progress[resource.state][tileId(x, y)] === resource.hits;
}

function targetTile() {
  return {
    x: Math.floor(player.x / TILE) + facingTile.x,
    y: Math.floor(player.y / TILE) + facingTile.y,
  };
}

function centerOf({ x, y }) {
  return { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE };
}

// Alleen lege grastegels zijn bouwgrond. De kaart reserveert het pad, de spawn en de deuren.
function buildSite() {
  const tile = targetTile();
  const id = tileId(tile.x, tile.y);
  const { x, y } = centerOf(tile);
  const occupied = [player, dragon, ...groundLoot].some(actor =>
    Math.abs(actor.x - x) < TILE / 2 + 8 && Math.abs(actor.y - y) < TILE / 2 + 8);
  const free = room[tile.y]?.[tile.x] === "." && !progress.buildings[id] && !occupied;
  return { ...tile, id, allowed: free && Boolean(selectedBuildItem()) };
}

function build() {
  if (phase !== "playing" || inventoryOpen() || area !== "forest") return;
  const item = selectedBuildItem();
  if (!item) {
    showFeedback("Select a fence, floor tile or torch in the hotbar.");
    return;
  }
  const site = buildSite();
  if (!site.allowed) {
    showFeedback("You cannot build here.");
    return;
  }
  progress.buildings[site.id] = item;
  progress.hotbar[progress.selectedHotbar] = smallerStack(selectedStack(), 1);
  storeProgress();
  updateInventory();
  showFeedback(ITEMS[item].label + " placed.");
}

function nearby(symbol) {
  return markers(symbol).some(position => distance(position, player) < 40);
}

function getAction() {
  if (phase !== "playing" || inventoryOpen()) return "";
  if (nearbyLoot()) return "pickup";
  const chest = CHEST_STATIONS[area];
  if (chest && nearby(chest.tile)) return chestUnlocked(area) ? "chest" : "lockedChest";
  if (area === "house") {
    if (nearby("W")) return "workbench";
    if (nearby("B") && player.hearts < 3) return "rest";
  }
  return "";
}

function interact() {
  const action = getAction();
  switch (action) {
    case "pickup":
      pickUp(nearbyLoot());
      break;
    case "lockedChest":
      showFeedback("Defeat the Cyclops Warden to unlock the reward chest.");
      break;
    case "workbench":
      openInventory("workbench");
      break;
    case "chest":
      openInventory("chest", area);
      break;
    case "rest":
      player.hearts = 3;
      updateHud();
      showFeedback("Rested · 3 hearts");
      break;
  }
}

function nearbyLoot() {
  return groundLoot.filter(drop => distance(drop, player) < 22 &&
    clearAttackPath(player, drop)).sort((a, b) => distance(a, player) - distance(b, player))[0];
}

function pickUp(drop) {
  if (!addItem(drop.item, drop.count)) {
    showFeedback("Backpack and hotbar are full.");
    return;
  }
  groundLoot = groundLoot.filter(other => other !== drop);
  if (drop.id) progress.collected[drop.id] = true;
  storeProgress();
  updateInventory();
  showFeedback(ITEMS[drop.item].label + " picked up.");
}

function updateAction() {
  const action = getAction();
  const hint = {
    rest: "E — Rest",
    workbench: "E — Open workbench",
    lockedChest: "Reward chest locked · Defeat the Warden",
  }[action];
  let text = hint || "";
  if (action === "pickup") {
    const { item, count } = nearbyLoot();
    text = "E — Pick up · " + ITEMS[item].label + " × " + count;
  }
  if (action === "chest") text = "E — Open " + CHEST_STATIONS[area].name.toLowerCase();
  if (actionLabel.textContent !== text) actionLabel.textContent = text;
  actionLabel.hidden = !text;
  if (!text) return;
  actionLabel.style.setProperty("--action-x", (player.x / WORLD_WIDTH) * 100 + "%");
  actionLabel.style.setProperty("--action-y", ((player.y - 20) / WORLD_HEIGHT) * 100 + "%");
}

function followDragon(dt) {
  // Volg opgenomen routepunten met vertraging, zodat de draak dezelfde bochten neemt.
  if (distance(player, trail[trail.length - 1]) > 0) {
    trail.push({ x: player.x, y: player.y, time: elapsed });
  }
  let remaining = (sprinting() ? 250 : 125) * dt;
  while (remaining > 0 && trail[0].time <= elapsed - FOLLOW_DELAY) {
    const target = trail[0];
    const gap = distance(dragon, target);
    if (gap < 0.001) {
      if (trail.length === 1) break;
      trail.shift();
      continue;
    }
    const step = Math.min(gap, remaining, distance(player, dragon) - FOLLOW_DISTANCE);
    if (step < 0.001) break;
    const dx = target.x - dragon.x;
    dragon.x += dx * step / gap;
    dragon.y += (target.y - dragon.y) * step / gap;
    if (dx) dragon.facing = Math.sign(dx);
    remaining -= step;
  }
}

function releaseArrivalKey(key) {
  arrivalGuard?.keys.delete(key);
}

function updateArea({ dx, dy, routePortal }) {
  if (key && !hasKey && distance(player, key) < 16) {
    hasKey = true;
    progress.collected[DUNGEON_KEY] = true;
    storeProgress();
    updateHud();
    status.textContent = "Key found. The door to room 2 is open.";
  }
  if (potion && player.hearts < 3 && distance(player, potion) < 16) {
    potion = undefined;
    progress.collected[DUNGEON_POTION] = true;
    player.hearts = Math.min(3, player.hearts + 1);
    storeProgress();
    updateHud();
    status.textContent = "Potion used. " + player.hearts + " of 3 hearts.";
  }

  if (arrivalGuard && arrivalGuard.keys.size === 0) arrivalGuard = null;
  const portal = areaPortals.find(portal => portal.tile !== arrivalGuard?.tile &&
    (portal.tile === routePortal || dx * (portal.dx || 0) + dy * (portal.dy || 0) > 0) &&
    distance(player, portal.position) < 13 && portalOpen(portal));
  if (!portal) return false;
  enterArea(portal.to, player.hearts, portal.arrival, portal.back);
  return true;
}
