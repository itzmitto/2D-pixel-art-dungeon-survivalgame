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
  "#.HHHH......G.#",
  "#.HHHH......=.#",
  "#.HHUH......=.#",
  "#...P=======R.#",
  "#..Y.Y..Y.Y...#",
  "#.Y...Y.......#",
  "#...Y....Y.Y..#",
  "###############",
];
const HOUSE = [
  "###############",
  "###############",
  "##...........##",
  "##.....B.....##",
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

function enterArea(nextArea, health, arrival = "P") {
  area = nextArea;
  room = AREAS[area];
  const [spawn] = markers(arrival);
  facingTile = { x: 0, y: 1 };
  player = { ...spawn, radius: 8, facing: 1, hearts: health };
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
  axeTime = 0;
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
      if (area === "forest" && ((tile === "Y" && !treeCut(column, row)) ||
          progress.buildings[tileId(column, row)] === "fence")) return true;
      if (!tile || "#TCHUGB".includes(tile) || (tile === "E" && !doorOpen)) return true;
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

function treeCut(x, y) {
  return progress.trees[tileId(x, y)] === 3;
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
  const occupied = [player, dragon].some(actor =>
    Math.abs(actor.x - x) < TILE / 2 + 8 && Math.abs(actor.y - y) < TILE / 2 + 8);
  const free = room[tile.y]?.[tile.x] === "." && !progress.buildings[id] && !occupied;
  return { ...tile, id, allowed: free && progress.items[buildItem] > 0 };
}

function build() {
  if (!buildItem || area !== "forest") return;
  const site = buildSite();
  if (!site.allowed) {
    showFeedback(progress.items[buildItem] ? "Hier kun je niet bouwen." : "Maak eerst dit bouwitem.");
    return;
  }
  progress.buildings[site.id] = buildItem;
  progress.items[buildItem]--;
  storeProgress();
  updateInventory();
  showFeedback(RECIPES[buildItem].label + " geplaatst.");
}

function nearby(symbol) {
  return markers(symbol).some(position => distance(position, player) < 40);
}

function getAction() {
  if (phase !== "playing") return "";
  if (area === "forest") {
    if (nearby("G")) return "dungeon";
    if (nearby("U")) {
      if (progress.repaired) return "enter";
      if (progress.wood >= 6) return "repair";
    }
    const { x, y } = targetTile();
    if (room[y]?.[x] === "Y" && !treeCut(x, y) &&
        distance(player, centerOf({ x, y })) < 42) return "chop";
  }
  if (area === "house") {
    if (nearby("U")) return "leave";
    if (nearby("B") && player.hearts < 3) return "rest";
  }
  return "";
}

function interact() {
  switch (getAction()) {
    case "dungeon":
      enterArea("dungeon1", player.hearts);
      break;
    case "chop": {
      const { x, y } = targetTile();
      const id = tileId(x, y);
      const hits = (progress.trees[id] || 0) + 1;
      progress.trees[id] = hits;
      axeTime = 0.2;
      if (hits === 3) progress.wood += 3;
      const remaining = 3 - hits;
      if (remaining === 0) showFeedback("Boom geveld · 0 slagen over · +3 hout");
      else showFeedback(remaining === 1 ? "1 slag over" : "2 slagen over");
      storeProgress();
      updateInventory();
      break;
    }
    case "repair":
      progress.wood -= 6;
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
    case "rest":
      player.hearts = 3;
      updateHud();
      showFeedback("Uitgerust · 3 hartjes");
      break;
  }
}

function updateAction() {
  const action = getAction();
  const hint = {
    dungeon: "E — Ga de dungeon in", chop: "E — Hak boom",
    repair: "E — Repareer de deur (6 hout)", enter: "E — Ga naar binnen",
    leave: "E — Ga naar buiten", rest: "E — Rust uit",
  }[action];
  const needsWood = area === "forest" && !progress.repaired && progress.wood < 6 && nearby("U");
  const text = hint || (needsWood ? "Kapotte deur · 6 hout nodig" : "");
  if (actionLabel.textContent !== text) actionLabel.textContent = text;
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
