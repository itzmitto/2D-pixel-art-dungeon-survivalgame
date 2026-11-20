"use strict";

const canvas = document.querySelector("#dungeon");
const ctx = canvas.getContext("2d");
const roomNumber = document.querySelector("#room-number");
const hearts = document.querySelector("#hearts");
const fireballStatus = document.querySelector("#fireball-status");
const keyLabel = document.querySelector("#key");
const ending = document.querySelector("#ending");
const result = document.querySelector("#result");
const respawnButton = document.querySelector("#respawn");
const actionLabel = document.querySelector("#action");
const feedback = document.querySelector("#feedback");
const woodLabel = document.querySelector("#wood");
const buildSelection = document.querySelector("#build-selection");
const status = document.querySelector("#status");

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

const PALETTE = {
  x: "#24202f", s: "#8096ac", l: "#e1e9e1", g: "#f6bc65",
  r: "#b75362", t: "#54bfa2", b: "#2c786d", y: "#f8e59b",
  p: "#a8c85c", d: "#5b803d", w: "#e1ef99",
  m: "#a94fb4", h: "#f39ce3",
  f: "#ed643d", o: "#ff9d44",
  a: "#713e2a", n: "#ab6941", c: "#db9b57",
  i: "#1b4837", j: "#2c6745", k: "#578b4c",
};

const SPRITES = {
  tree: [
    ".....ii.....", "....ikki....", "...ikkjji...", "..ikkjjjji..",
    ".ijjkkjjjji.", "ijjkkjjjkjji", "ijjjjjjjjjji", ".ijjiijjjji.",
    "..iiinniii..", ".....na.....", "....anaa....",
  ],
  stump: ["...cccc...", "..cnnnac..", "..annnaa..", "...aaaa..."],
  axe: ["..lss....", ".llss....", "..lssn...", "....n....", "...n.....",
    "..n......", ".a......."],
  fence: [
    ".na........an.", ".ca........ac.", ".cnnnnnnnnnnc.",
    ".caaaaaaaaaac.", ".ca........ac.", ".cnnnnnnnnnnc.",
    ".caaaaaaaaaac.", ".ca........ac.", ".aa........aa.",
  ],
  floor: [
    "aaaaaaaaaaaaaa", "ncccccncccccnn", "nnnnnannnnnnnn", "aaaaaaaaaaaaaa",
    "nnccccccnccccn", "nnnnnnnnannnnn", "aaaaaaaaaaaaaa",
    "ncccncccccccnn", "nnnannnnnnnnnn", "aaaaaaaaaaaaaa",
  ],
  knight: [
    "..xxxxx...", ".xllllsx..", ".xlslssx..", ".xxxxxxx..",
    "..xggx..l.", ".xrssx..s.", "xrrlsx.xsx", "xrrssgggx.",
    ".xxssxx...", "..x..x....",
  ],
  dragon: [
    ".....g.g..", "....xbxbx.", ".b..xtttx.", ".b..xtxttx",
    "bbybxtttyx", "xbttttyxx.", ".xttttx...", "..xbxbx...",
  ],
  slime: [
    "...xxxx...", "..xwwppx..", ".xwpppppx.", "xppxppxppx",
    "xppppppppx", "xddppppddx", ".xxxxxxxx.",
  ],
  key: ["..gg......", ".gyyg.....", "gy..yg....", "gy..yg....",
    ".gyyggggg.", "..gg..g.g."],
  fireball: [".ff..", "foof.", "foyof", ".oof.", "..f.."],
  potion: [
    "..ggg..", "..xgx..", "..xlx..", ".xlllx.",
    "xlhmmlx", "xhmmmmx", "xmmmmmx", ".xxxxx.",
  ],
};

function markers(symbol) {
  const positions = [];
  room.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      if (tile === symbol) positions.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
    });
  });
  return positions;
}

const pressed = new Set();
const movementKeys = ["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"];
const FOLLOW_DELAY = 0.28;
const FOLLOW_DISTANCE = 23;
const FIREBALL_COOLDOWN = 1;
const FIREBALL_LIFETIME = 1;
const FIREBALL_SPEED = 220;
const FIREBALL_RADIUS = 4;
const SLIME_HITS = 2;
const SLIME_FLASH_TIME = 0.14;
let area, room, key, exit, potion;
let player, dragon, slimes, trail, elapsed, hasKey, protection, phase;

let fireballs, fireballCooldown, aim;
const RECIPES = {
  fence: { label: "Hek", cost: 4, button: document.querySelector("#craft-fence") },
  floor: { label: "Vloer", cost: 2, button: document.querySelector("#craft-floor") },
};
let buildItem, facingTile, feedbackTime, axeTime;
let progress;

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

function reset() {
  fireballCooldown = 0;
  aim = { x: 0, y: 1 };
  updateFireballStatus();
  protection = 0;
  phase = "playing";
  ending.hidden = true;
  respawnButton.hidden = true;
  buildItem = undefined;
  showFeedback("");
  pressed.clear();
  status.textContent = "";
  enterArea("forest", 3);
}

function updateHud() {
  hearts.textContent = Array.from({ length: 3 }, (_, i) => i < player.hearts ? "♥" : "♡").join(" ");
  hearts.setAttribute("aria-label", player.hearts + " van 3 hartjes");
  roomNumber.textContent = {
    forest: "Bos", house: "Huis", dungeon1: "Kamer 1 van 2", dungeon2: "Kamer 2 van 2",
  }[area];
  keyLabel.hidden = !key;
  keyLabel.textContent = hasKey ? "Sleutel gevonden" : "Sleutel ontbreekt";
  updateInventory();
}

function finish(outcome, message) {
  phase = outcome;
  result.textContent = message;
  ending.hidden = false;
  respawnButton.hidden = false;
  status.textContent = message;
  updateInventory();
  updateAction();
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

function updateInventory() {
  woodLabel.textContent = "Hout " + progress.wood;
  for (const [item, { label, cost, button }] of Object.entries(RECIPES)) {
    button.textContent = label + " maken · " + cost + " hout · " + progress.items[item] + " op zak";
    button.disabled = phase !== "playing" || progress.wood < cost;
  }
  buildSelection.textContent = buildItem
    ? RECIPES[buildItem].label + " geselecteerd · F om te plaatsen · Esc om te stoppen"
    : "1 — Hek selecteren · 2 — Vloer selecteren";
  buildSelection.hidden = area !== "forest";
}

function craft(item) {
  const { label, cost } = RECIPES[item];
  if (phase !== "playing" || progress.wood < cost) return;
  progress.wood -= cost;
  progress.items[item]++;
  storeProgress();
  updateInventory();
  showFeedback(label + " gemaakt.");
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

function showFeedback(message) {
  feedback.textContent = message;
  feedbackTime = 3;
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
      showFeedback(hits === 3 ? "Boom geveld · 0 slagen over · +3 hout" : (3 - hits) + " slagen over");
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

function updateFireballStatus() {
  fireballStatus.textContent = fireballCooldown > 0 ? "Vuurbal laadt op" : "Vuurbal klaar";
}

function shootFireball() {
  if (fireballCooldown > 0) return;
  fireballs.push({
    x: dragon.x, y: dragon.y,
    vx: aim.x * FIREBALL_SPEED, vy: aim.y * FIREBALL_SPEED,
    life: FIREBALL_LIFETIME,
  });
  fireballCooldown = FIREBALL_COOLDOWN;
  updateFireballStatus();
}

function updateFireballs(dt) {
  if (fireballCooldown > 0) {
    fireballCooldown = fireballCooldown <= dt + 1e-9 ? 0 : fireballCooldown - dt;
    if (fireballCooldown === 0) updateFireballStatus();
  }

  for (const slime of slimes) slime.flash = Math.max(0, slime.flash - dt);
  slimes = slimes.filter(slime => slime.health > 0 || slime.flash > 0);

  fireballs = fireballs.filter(ball => {
    const travelTime = Math.min(dt, ball.life);
    ball.x += ball.vx * travelTime;
    ball.y += ball.vy * travelTime;
    ball.life -= travelTime;
    if (blocked(ball.x, ball.y, FIREBALL_RADIUS, !key || hasKey)) return false;

    const hit = slimes.find(slime => slime.health > 0 &&
      distance(slime, ball) < slime.radius + FIREBALL_RADIUS);
    if (!hit) return ball.life > 1e-9;
    hit.health--;
    hit.flash = SLIME_FLASH_TIME;
    return false;
  });
}

function update(dt) {
  updateFireballs(dt);
  elapsed += dt;
  protection = Math.max(0, protection - dt);

  const down = (a, b) => Number(pressed.has(a) || pressed.has(b));
  const dx = down("d", "arrowright") - down("a", "arrowleft");
  const dy = down("s", "arrowdown") - down("w", "arrowup");
  if (dx || dy) {
    if (dx && (!dy || facingTile.x)) facingTile = { x: dx, y: 0 };
    else facingTile = { x: 0, y: dy };
  }
  if (dx) player.facing = Math.sign(dx);
  const step = 104 * dt / (Math.hypot(dx, dy) || 1);
  const { x, y } = player;
  move(player, dx * step, dy * step, !key || hasKey);
  const traveled = Math.hypot(player.x - x, player.y - y);
  if (traveled > 0) aim = { x: (player.x - x) / traveled, y: (player.y - y) / traveled };
  followDragon(dt);
  axeTime = Math.max(0, axeTime - dt);
  if (feedbackTime > 0) {
    feedbackTime -= dt;
    if (feedbackTime <= 0) feedback.textContent = "";
  }

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
    return;
  }

  if (potion && player.hearts < 3 && distance(player, potion) < 16) {
    potion = undefined;
    player.hearts++;
    updateHud();
    status.textContent = "Potion gebruikt. " + player.hearts + " van 3 hartjes.";
  }

  for (const slime of slimes) {
    if (slime.health === 0) continue;
    const gap = distance(slime, player);
    if (gap > 0) {
      const chase = Math.min(gap, 53 * dt) / gap;
      move(slime, (player.x - slime.x) * chase, (player.y - slime.y) * chase);
    }
    if (distance(player, slime) < 16 && protection === 0) {
      player.hearts--;
      protection = 1.1;
      updateHud();
      status.textContent = player.hearts + " hartjes over.";
      if (player.hearts === 0) {
        finish("lost", "Je hartjes zijn op");
        break;
      }
    }
  }
}

function rect(color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function sprite(name, x, y, facing = 1, flash = false) {
  const pixels = SPRITES[name];
  const width = pixels[0].length * 2;
  const left = Math.round(x - width / 2);
  const top = Math.round(y - pixels.length * 2 + 7);
  pixels.forEach((row, j) => {
    [...row].forEach((pixel, i) => {
      if (pixel !== ".") {
        const column = facing > 0 ? i : row.length - 1 - i;
        rect(flash && pixel !== "x" ? "#fff2b7" : PALETTE[pixel], left + column * 2, top + j * 2, 2, 2);
      }
    });
  });
}

function drawRoom(time) {
  const torches = [];
  room.forEach((row, j) => {
    [...row].forEach((tile, i) => {
      const x = i * TILE;
      const y = j * TILE;
      const variant = (i * 17 + j * 31) % 5;
      rect("#24232d", x, y, TILE, TILE);
      rect(["#373541", "#3b3845", "#413c46", "#3c3942", "#373643"][variant],
        x + 1, y + 1, 30, 30);
      rect("#4a434d", x + 2, y + 2, 28, 1);
      if (variant === 1) {
        rect("#2b2935", x + 8, y + 12, 8, 2);
        rect("#2b2935", x + 14, y + 14, 3, 5);
      }
      if (tile === "#" || tile === "T") {
        rect("#23212c", x, y, 32, 32);
        rect("#656071", x + 1, y + 1, 30, 5);
        rect("#494452", x + 1, y + 6, 30, 20);
        rect("#322d3c", x, y + 15, 32, 2);
        rect("#322d3c", x + 12, y + 6, 2, 9);
        rect("#322d3c", x + 23, y + 17, 2, 9);
        rect("#302a36", x + 1, y + 26, 30, 5);
      }
      if (tile === "T") torches.push({ x: x + 16, y: y + 14 });
      if (tile === "C") {
        rect("#251d28", x + 3, y + 8, 26, 18);
        rect("#ac6f43", x + 5, y + 9, 22, 8);
        rect("#694035", x + 5, y + 18, 22, 6);
        rect("#f6bc65", x + 14, y + 16, 4, 5);
      }
      if (tile === "E") {
        rect("#767083", x + 5, y + 1, 27, 30);
        const doorOpen = !key || hasKey;
        rect(doorOpen ? "#183932" : "#4b3133", x + 9, y + 5, 23, 22);
        if (doorOpen) {
          rect("#76d4a6", x + 14, y + 15, 11, 3);
          rect("#76d4a6", x + 22, y + 12, 3, 9);
          rect("#76d4a6", x + 25, y + 15, 3, 3);
        } else {
          rect("#a08780", x + 12, y + 5, 2, 22);
          rect("#a08780", x + 19, y + 5, 2, 22);
          rect("#a08780", x + 26, y + 5, 2, 22);
          rect("#f6bc65", x + 18, y + 15, 6, 6);
        }
      }
    });
  });
  for (const { x, y } of torches) {
    const flicker = Math.round(Math.sin(time * 11 + x));
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 42 + flicker * 3);
    glow.addColorStop(0, "#ff933655");
    glow.addColorStop(1, "#ff933600");
    rect(glow, x - 46, y - 46, 92, 92);
    rect("#ac6f43", x - 2, y, 4, 11);
    rect("#e3734d", x - 4, y - 6, 8, 8);
    rect("#ffd386", x - 2, y - 7 + flicker, 4, 7);
  }
}

function draw(time) {
  if (exit) drawRoom(time);
  else drawOverworld();
  if (key && !hasKey) sprite("key", key.x, key.y + Math.round(Math.sin(time * 5) * 2));
  if (potion) sprite("potion", potion.x, potion.y);
  const actors = [
    { ...player, name: "knight" },
    { ...dragon, name: "dragon" },
    ...slimes,
  ];
  actors.sort((a, b) => a.y - b.y);
  for (const actor of actors) {
    rect("#1d1926aa", Math.round(actor.x - 9), Math.round(actor.y + 4), 18, 4);
    if (actor.name === "knight" && protection > 0 && Math.floor(time * 18) % 2) continue;
    sprite(actor.name, actor.x, actor.y, actor.facing, actor.flash > 0);
  }
  if (axeTime > 0) sprite("axe", player.x + facingTile.x * 10 + 6, player.y + facingTile.y * 10);
  for (const ball of fireballs) sprite("fireball", ball.x, ball.y - 2);
}

window.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === " " && phase === "playing") {
    event.preventDefault();
    if (!event.repeat) shootFireball();
    return;
  }
  const key = event.key.toLowerCase();
  if (phase === "playing" && ["e", "f", "1", "2", "escape"].includes(key)) {
    event.preventDefault();
    if (event.repeat) return;
    if (key === "e") interact();
    if (area === "forest") {
      if (key === "f") build();
      if (key === "1") buildItem = "fence";
      if (key === "2") buildItem = "floor";
      if (key === "escape") buildItem = undefined;
      updateInventory();
    }
    return;
  }
  if (!movementKeys.includes(key)) return;
  event.preventDefault();
  pressed.add(key);
});
window.addEventListener("keyup", (event) => pressed.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => pressed.clear());
respawnButton.addEventListener("click", reset);

reset();
let previousTime;
// De game loop begrenst de tijdstap zodat een gepauzeerd tabblad geen sprong veroorzaakt.
function frame(now) {
  const dt = Math.min(0.033, (now - (previousTime ?? now)) / 1000);
  previousTime = now;
  if (phase === "playing") update(dt);
  updateAction();
  draw(now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
