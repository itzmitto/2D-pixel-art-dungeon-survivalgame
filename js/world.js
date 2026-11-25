"use strict";

const TILE = 32;
// # wall, T torch, P spawn, K key, A entrance, E exit, C chest, V potion.
const ROOM_ONE = [
  "###T#######T###",
  "#.............#",
  "#.....T.....K.#",
  "#..C..#.......#",
  "T.....#...##..T",
  "#.........#...#",
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
const AREAS = { forest: FOREST, house: HOUSE, dungeon1: ROOM_ONE, dungeon2: ROOM_TWO };
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

const stationResume = {
  chest: arrivalAt(10, 4, 0, -1),
  workbench: arrivalAt(4, 4, 0, -1),
};
const houseApproach = arrivalAt(4, 5, 0, 1);
const caveApproach = arrivalAt(12, 3, 0, 1);
const PORTALS = {
  forest: {
    U: { to: "house", arrival: arrivalAt(7, 7, 0, -1), back: "U", dy: -1, ready: () => progress.repaired },
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
    E: { to: "forest", arrival: caveApproach, back: "G", dx: 1, completesDungeon: true },
  },
};
const DUNGEON_KEY = "dungeon1:key";
const DUNGEON_POTION = "dungeon2:potion";
// Preserve the original encounter order so saved defeats and drops keep their IDs.
const DUNGEON_SPAWNS = {
  dungeon1: [["wolf", 10, 7], ["snake", 10, 2]],
  dungeon2: [["snake", 2, 3], ["wolf", 10, 7], ["snake", 12, 3]],
};
const FOLLOW_DELAY = 0.28;
const FOLLOW_DISTANCE = 23;
let area, room, key, potion;
let areaPortals, arrivalGuard;
let player, dragon, enemies, trail, elapsed, hasKey, protection, phase;
let groundLoot = [];
let harvestEffects = [];
const RESOURCES = {
  Y: { action: "chop", tool: "axe", state: "trees", hits: 3, item: "wood", count: 3 },
  M: { action: "mine", tool: "pickaxe", state: "mines", hits: 2, item: "stone", count: 3 },
  N: { action: "mine", tool: "pickaxe", state: "mines", hits: 3, item: "copper", count: 3 },
};

function resourceDrop(resource, x, y) {
  return {
    id: "resource:" + tileId(x, y),
    item: resource.item, count: resource.count, ...centerOf({ x, y }),
  };
}

function forestLoot() {
  const drops = [...FOREST_LOOT];
  FOREST.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      const resource = RESOURCES[tile];
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
  area = nextArea;
  room = AREAS[area];
  areaPortals = Object.entries(PORTALS[area]).map(([tile, portal]) => ({
    tile, ...portal, position: markers(tile)[0],
  }));
  arrivalGuard = back ? { tile: back, keys: new Set(pressed) } : null;
  groundLoot = area === "forest" ? forestLoot() : [];
  harvestEffects = [];
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
  return (DUNGEON_SPAWNS[mapArea] || []).map(([kind, x, y], index) => ({
    id: mapArea + ":slime:" + index, kind, ...centerOf({ x, y }),
  }));
}

function enemyDrop(id, { x, y }) {
  return { id, x, y, item: "gel", count: 1 };
}

function loadEnemies() {
  return dungeonSpawns(area).flatMap(spawn => {
    const { id, kind } = spawn;
    const saved = progress.dungeonEnemies[id];
    if (saved?.health === 0) {
      if (!progress.collected[id]) groundLoot.push(enemyDrop(id, saved));
      return [];
    }
    return [{ ...spawn, radius: 8, health: saved?.health ?? ENEMIES[kind].health, facing: 1, flash: 0, walkTime: 0 }];
  });
}

function recordEnemyDamage({ id, x, y, health }) {
  progress.dungeonEnemies[id] = health === 0 ? { health, x, y } : { health };
  if (health === 0) groundLoot.push(enemyDrop(id, { x, y }));
  storeProgress();
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
      const resource = area === "forest" && RESOURCES[tile];
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

function updatePlayer(dt) {
  const arrowsMove = !inventoryOpen();
  const down = (letter, arrow) => Number(pressed.has(letter) || (arrowsMove && pressed.has(arrow)));
  const dx = down("d", "arrowright") - down("a", "arrowleft");
  const dy = down("s", "arrowdown") - down("w", "arrowup");
  if (dx || dy) {
    if (dx && (!dy || facingTile.x)) facingTile = { x: dx, y: 0 };
    else facingTile = { x: 0, y: dy };
  }
  if (dx) player.facing = Math.sign(dx);
  const step = 104 * dt / (Math.hypot(dx, dy) || 1);
  const { x, y } = player;
  move(player, dx * step, dy * step);
  const traveled = Math.hypot(player.x - x, player.y - y);
  player.walking = traveled > 0;
  player.walkTime = player.walking ? player.walkTime + dt : 0;
  if (player.walking) aim = { x: (player.x - x) / traveled, y: (player.y - y) / traveled };
  return { dx, dy };
}

function tileId(x, y) {
  return x + "," + y;
}

function exhausted(resource, x, y) {
  return progress[resource.state][tileId(x, y)] === resource.hits;
}

function harvest(x, y) {
  const resource = RESOURCES[room[y][x]];
  const id = tileId(x, y);
  const counts = progress[resource.state];
  counts[id] = (counts[id] || 0) + 1;
  const center = centerOf({ x, y });
  harvestEffects.push({ ...center, tool: resource.tool, started: elapsed });
  const remaining = resource.hits - counts[id];
  if (remaining === 0) {
    groundLoot.push(resourceDrop(resource, x, y));
    showFeedback(ITEMS[resource.item].label + " dropped · press E to pick up.");
  } else {
    showFeedback(remaining === 1 ? "1 hit left" : remaining + " hits left");
  }
  storeProgress();
}

function updateHarvestEffects() {
  harvestEffects = harvestEffects.filter(effect => elapsed - effect.started < 0.32);
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
  if (area === "forest") {
    if (nearby("U") && !progress.repaired) {
      return itemCount("wood") >= 6 ? "repair" : "inspect";
    }
    const { x, y } = targetTile();
    const resource = RESOURCES[room[y]?.[x]];
    if (resource && !exhausted(resource, x, y) && distance(player, centerOf({ x, y })) < 42 &&
        (itemCount(resource.tool) || Object.values(progress.hands).includes(resource.tool))) {
      return resource.action;
    }
  }
  if (area === "house") {
    if (nearby("W")) return "workbench";
    if (nearby("O")) return "chest";
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
    case "chop":
    case "mine": {
      const { x, y } = targetTile();
      harvest(x, y);
      break;
    }
    case "inspect":
      showFeedback("Broken door · needs 6 wood.");
      break;
    case "repair":
      removeItem("wood", 6);
      progress.repaired = true;
      storeProgress();
      updateInventory();
      showFeedback("Door repaired.");
      break;
    case "workbench":
    case "chest":
      openHousePanel(action);
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
    chop: "E — Chop tree",
    inspect: "E — Inspect broken door", repair: "E — Repair door (6 wood)",
    rest: "E — Rest",
    workbench: "E — Open workbench", chest: "E — Open house chest",
  }[action];
  let text = hint || "";
  if (action === "pickup") {
    const { item, count } = nearbyLoot();
    text = "E — Pick up · " + ITEMS[item].label + " × " + count;
  }
  if (action === "mine") {
    const { x, y } = targetTile();
    text = "E — Mine " + ITEMS[RESOURCES[room[y][x]].item].label.toLowerCase();
  }
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
  let remaining = 125 * dt;
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

function completeDungeon() {
  if (progress.dungeonCompleted) return;
  progress.dungeonCompleted = true;
  storeProgress();
  showFeedback("Dungeon cleared");
}

function releaseArrivalKey(key) {
  arrivalGuard?.keys.delete(key);
}

function updateArea({ dx, dy }) {
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
    dx * (portal.dx || 0) + dy * (portal.dy || 0) > 0 &&
    distance(player, portal.position) < 13 && portalOpen(portal));
  if (!portal) return false;
  enterArea(portal.to, player.hearts, portal.arrival, portal.back);
  if (portal.completesDungeon) completeDungeon();
  return true;
}
