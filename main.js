"use strict";

const canvas = document.querySelector("#dungeon");
const ctx = canvas.getContext("2d");
const roomNumber = document.querySelector("#room-number");
const hearts = document.querySelector("#hearts");
const keyLabel = document.querySelector("#key");
const ending = document.querySelector("#ending");
const result = document.querySelector("#result");
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
const ROOMS = [ROOM_ONE, ROOM_TWO];

const PALETTE = {
  x: "#24202f", s: "#8096ac", l: "#e1e9e1", g: "#f6bc65",
  r: "#b75362", t: "#54bfa2", b: "#2c786d", y: "#f8e59b",
  p: "#a8c85c", d: "#5b803d", w: "#e1ef99",
  m: "#a94fb4", h: "#f39ce3",
};

const SPRITES = {
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
let roomIndex, room, key, exit, potion;
let player, dragon, slimes, trail, elapsed, hasKey, protection, phase;

function enterRoom(index, health) {
  roomIndex = index;
  room = ROOMS[index];
  const [spawn] = markers("P");
  const [dragonSpawn = spawn] = markers("D");
  player = { ...spawn, radius: 8, facing: 1, hearts: health };
  dragon = { ...dragonSpawn, facing: 1 };
  slimes = markers("S").map(position => ({ ...position, radius: 8, name: "slime" }));
  [key] = markers("K");
  [potion] = markers("V");
  [exit] = markers("E");
  trail = [{ ...dragonSpawn, time: 0 }, { ...spawn, time: 0 }];
  elapsed = 0;
  hasKey = false;
  updateHud();
}

function reset() {
  protection = 0;
  phase = "playing";
  ending.hidden = true;
  pressed.clear();
  status.textContent = "";
  enterRoom(0, 3);
}

function updateHud() {
  hearts.textContent = Array.from({ length: 3 }, (_, i) => i < player.hearts ? "♥" : "♡").join(" ");
  hearts.setAttribute("aria-label", player.hearts + " van 3 hartjes");
  roomNumber.textContent = "Kamer " + (roomIndex + 1) + " van " + ROOMS.length;
  keyLabel.hidden = roomIndex !== 0;
  keyLabel.textContent = hasKey ? "Sleutel gevonden" : "Sleutel ontbreekt";
}

function finish(outcome, message) {
  phase = outcome;
  result.textContent = message;
  ending.hidden = false;
  status.textContent = message;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Test de vier hoeken van het botsingsvak. Beweeg per as zodat je langs muren kunt glijden.
function blocked(x, y, radius, doorOpen) {
  for (const edgeY of [y - radius, y + radius]) {
    for (const edgeX of [x - radius, x + radius]) {
      const tile = room[Math.floor(edgeY / TILE)]?.[Math.floor(edgeX / TILE)];
      if (!tile || "#TC".includes(tile) || (tile === "E" && !doorOpen)) return true;
    }
  }
  return false;
}

function move(actor, dx, dy, doorOpen = false) {
  if (!blocked(actor.x + dx, actor.y, actor.radius, doorOpen)) actor.x += dx;
  if (!blocked(actor.x, actor.y + dy, actor.radius, doorOpen)) actor.y += dy;
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

function update(dt) {
  elapsed += dt;
  protection = Math.max(0, protection - dt);

  const down = (a, b) => Number(pressed.has(a) || pressed.has(b));
  const dx = down("d", "arrowright") - down("a", "arrowleft");
  const dy = down("s", "arrowdown") - down("w", "arrowup");
  if (dx) player.facing = Math.sign(dx);
  const step = 104 * dt / (Math.hypot(dx, dy) || 1);
  move(player, dx * step, dy * step, !key || hasKey);
  followDragon(dt);

  if (key && !hasKey && distance(player, key) < 16) {
    hasKey = true;
    updateHud();
    status.textContent = "Sleutel gevonden. De deur naar kamer 2 is open.";
  }
  if ((!key || hasKey) && distance(player, exit) < 13) {
    if (roomIndex === ROOMS.length - 1) {
      finish("won", "Jullie zijn ontsnapt!");
    } else {
      enterRoom(roomIndex + 1, player.hearts);
      status.textContent = roomNumber.textContent;
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

function sprite(name, x, y, facing = 1) {
  const pixels = SPRITES[name];
  const width = pixels[0].length * 2;
  const left = Math.round(x - width / 2);
  const top = Math.round(y - pixels.length * 2 + 7);
  pixels.forEach((row, j) => {
    [...row].forEach((pixel, i) => {
      if (pixel !== ".") {
        const column = facing > 0 ? i : row.length - 1 - i;
        rect(PALETTE[pixel], left + column * 2, top + j * 2, 2, 2);
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
  drawRoom(time);
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
    sprite(actor.name, actor.x, actor.y, actor.facing);
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (!movementKeys.includes(key) || event.ctrlKey || event.metaKey || event.altKey) return;
  event.preventDefault();
  pressed.add(key);
});
window.addEventListener("keyup", (event) => pressed.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => pressed.clear());
document.querySelector("#restart").addEventListener("click", reset);

reset();
let previousTime;
// De game loop begrenst de tijdstap zodat een gepauzeerd tabblad geen sprong veroorzaakt.
function frame(now) {
  const dt = Math.min(0.033, (now - (previousTime ?? now)) / 1000);
  previousTime = now;
  if (phase === "playing") update(dt);
  draw(now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
