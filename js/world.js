"use strict";

const TILE = 32;
// # muur, T fakkel, P ridder, D draak, S slime, K sleutel, E uitgang, C kist, V potion.
const ROOM_ONE = [
  "###T#######T###",
  "#.............#",
  "#.....T.....K.#",
  "#..C..#.......#",
  "T.....#...##..T",
  "#.........#...#",
  "#...T.....T...#",
  "#.........S...#",
  "#.DP..........E",
  "###T#######T###",
];

const ROOM_TWO = [
  "###T#######T###",
  "#.....#.......E",
  "#.##..#..###..#",
  "#.S...#.......#",
  "####.T#..##...#",
  "##V#.....C....#",
  "##.#.####.....#",
  "##.#......S...#",
  "#P............#",
  "###T#######T###",
];
// Elk gebied gebruikt hetzelfde tegelraster en dezelfde botsingen.
const FOREST = [
  "###############",
  "#.Y..Y....Y.Y.#",
  "#.HHHH.....QGQ#",
  "#.HHHH....==R.#",
  "#.HHUH..===...#",
  "#...P====.....#",
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

function markers(symbol) {
  const positions = [];
  room.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      if (tile === symbol) positions.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
    });
  });
  return positions;
}

const FOLLOW_DELAY = 0.28;
const FOLLOW_DISTANCE = 23;
let area, room, key, exit, potion;
let player, dragon, slimes, trail, elapsed, hasKey, protection, phase;
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

function enterArea(nextArea, health, arrival = "P") {
  area = nextArea;
  room = AREAS[area];
  groundLoot = area === "forest" ? forestLoot() : [];
  harvestEffects = [];
  swing = undefined;
  const [spawn] = markers(arrival);
  facingTile = { x: 0, y: 1 };
  player = { ...spawn, radius: 8, facing: 1, hearts: health, walkTime: 0 };
  dragon = { x: spawn.x - FOLLOW_DISTANCE, y: spawn.y, facing: 1 };
  if (blocked(dragon.x, dragon.y, 8, false)) dragon.x = spawn.x + FOLLOW_DISTANCE;
  slimes = markers("S").map(position => ({
    ...position, radius: 8, name: "slime", health: SLIME_HITS, flash: 0,
  }));
  fireballs = [];
  [key] = markers("K");
  [potion] = markers("V");
  [exit] = markers("E");
  trail = [{ ...dragon, time: 0 }, { ...spawn, time: 0 }];
  elapsed = 0;
  hasKey = false;
  updateHud();
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Test de vier hoeken van het botsingsvak. Beweeg per as zodat je langs muren kunt glijden.
function blocked(x, y, radius, doorOpen) {
  for (const edgeY of [y - radius, y + radius]) {
    for (const edgeX of [x - radius, x + radius]) {
      const column = Math.floor(edgeX / TILE);
      const row = Math.floor(edgeY / TILE);
      const tile = room[row]?.[column];
      const resource = area === "forest" && RESOURCES[tile];
      if (area === "forest" && ((resource && !exhausted(resource, column, row)) ||
          progress.buildings[tileId(column, row)] === "fence")) return true;
      if (!tile || "#TCHUGBQWO".includes(tile) || (tile === "E" && !doorOpen)) return true;
    }
  }
  return false;
}

function move(actor, dx, dy, doorOpen = false) {
  if (!blocked(actor.x + dx, actor.y, actor.radius, doorOpen)) actor.x += dx;
  if (!blocked(actor.x, actor.y + dy, actor.radius, doorOpen)) actor.y += dy;
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
    showFeedback(ITEMS[resource.item].label + " gevallen · pak op met E.");
  } else {
    showFeedback(remaining === 1 ? "1 slag over" : remaining + " slagen over");
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
  return { ...tile, id, allowed: free && itemCount(buildItem) > 0 };
}

function build() {
  if (!buildItem || area !== "forest") return;
  const site = buildSite();
  if (!site.allowed) {
    showFeedback(itemCount(buildItem) ? "Hier kun je niet bouwen." : "Maak eerst dit bouwitem.");
    return;
  }
  progress.buildings[site.id] = buildItem;
  changeItem(buildItem, -1);
  storeProgress();
  updateInventory();
  showFeedback(ITEMS[buildItem].label + " geplaatst.");
}

function nearby(symbol) {
  return markers(symbol).some(position => distance(position, player) < 40);
}

function getAction() {
  if (phase !== "playing" || inventoryOpen()) return "";
  if (nearbyLoot()) return "pickup";
  if (area === "forest") {
    if (nearby("G")) return "dungeon";
    if (nearby("U")) {
      if (progress.repaired) return "enter";
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
    if (nearby("U")) return "leave";
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
    case "dungeon":
      enterArea("dungeon1", player.hearts);
      break;
    case "chop":
    case "mine": {
      const { x, y } = targetTile();
      harvest(x, y);
      break;
    }
    case "inspect":
      showFeedback("Kapotte deur · 6 hout nodig.");
      break;
    case "repair":
      changeItem("wood", -6);
      progress.repaired = true;
      storeProgress();
      updateInventory();
      showFeedback("De deur is gerepareerd.");
      break;
    case "enter":
      enterArea("house", player.hearts);
      break;
    case "leave":
      enterArea("forest", player.hearts);
      break;
    case "workbench":
    case "chest":
      openHousePanel(action);
      break;
    case "rest":
      player.hearts = 3;
      updateHud();
      showFeedback("Uitgerust · 3 hartjes");
      break;
  }
}

function nearbyLoot() {
  return groundLoot.filter(drop => distance(drop, player) < 22 &&
    clearAttackPath(player, drop)).sort((a, b) => distance(a, player) - distance(b, player))[0];
}

function pickUp(drop) {
  if (!addItem(drop.item, drop.count)) {
    showFeedback("Rugzak vol.");
    return;
  }
  groundLoot = groundLoot.filter(other => other !== drop);
  if (drop.id) progress.collected[drop.id] = true;
  storeProgress();
  updateInventory();
  showFeedback(ITEMS[drop.item].label + " opgepakt.");
}

function updateAction() {
  const action = getAction();
  const hint = {
    pickup: "E — Pak op", dungeon: "E — Ga de grot in", chop: "E — Hak boom", mine: "E — Delf erts of steen",
    inspect: "E — Bekijk kapotte deur", repair: "E — Repareer de deur (6 hout)",
    enter: "E — Ga naar binnen",
    leave: "E — Ga naar buiten", rest: "E — Rust uit",
    workbench: "E — Open werkbank", chest: "E — Open opbergkist",
  }[action];
  const text = hint || "";
  if (actionLabel.textContent !== text) actionLabel.textContent = text;
  actionLabel.hidden = !hint;
  actionLabel.style.left = Math.min(81, Math.max(19, player.x / 4.8)) + "%";
  actionLabel.style.top = Math.max(13, (player.y - 22) / 3.2) + "%";
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
  showFeedback("Dungeon voltooid");
}

function updateDungeon() {
  if (key && !hasKey && distance(player, key) < 16) {
    hasKey = true;
    updateHud();
    status.textContent = "Sleutel gevonden. De deur naar kamer 2 is open.";
  }
  if (exit && (!key || hasKey) && distance(player, exit) < 13) {
    if (area === "dungeon1") {
      enterArea("dungeon2", player.hearts);
    } else {
      enterArea("forest", player.hearts, "R");
      completeDungeon();
    }
    return true;
  }

  if (potion && player.hearts < 3 && distance(player, potion) < 16) {
    potion = undefined;
    player.hearts = Math.min(3, player.hearts + 1);
    updateHud();
    status.textContent = "Potion gebruikt. " + player.hearts + " van 3 hartjes.";
  }

  return false;
}
