"use strict";

const PALETTE = {
  x: "#24202f", s: "#8096ac", l: "#e1e9e1", g: "#f6bc65",
  r: "#b75362", t: "#54bfa2", b: "#2c786d", y: "#f8e59b",
  p: "#a8c85c", d: "#5b803d", w: "#e1ef99",
  m: "#a94fb4", h: "#f39ce3",
  f: "#ed643d", o: "#ff9d44",
  a: "#713e2a", n: "#ab6941", c: "#db9b57",
  i: "#1b4837", j: "#2c6745", k: "#578b4c",
  u: "#4b6078", z: "#aebfc7", e: "#608b99", q: "#f6c58b",
  A: "#573846", N: "#d29a65", T: "#a4e8c4", D: "#215457",
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
  knight: [
    "......xxxxxxxx......",
    "....xxzzzzzzzsxx....",
    "...xzzllllllllzsx...",
    "...xsszzzzzlzzssx...",
    "..xuzsxxxxxxzsusux..",
    "..xussxgxxgxsusuux..",
    "...xusxxxxxxuussx...",
    "....xxuzzssuuxxx....",
    "....xAxuzzsuxax.....",
    "...xAnxszzssxgux....",
    "..xAnncxsszuucxsx...",
    "..xAncaxusuzusxsx...",
    "..xAnacxussussxx....",
    "..xAnaxgngngxuuux...",
    "...xxxuzsuusuxux....",
    ".....xussxxusux.....",
    ".....xuxx..xuxx.....",
    ".....xasx..xasx.....",
    "....xaax...xaax.....",
    "....xxxx...xxxx.....",
  ],
  knightStepA: [
    "......xxxxxxxx......",
    "....xxzzzzzzzsxx....",
    "...xzzllllllllzsx...",
    "...xsszzzzzlzzssx...",
    "..xuzsxxxxxxzsusux..",
    "..xussxgxxgxsusuux..",
    "...xusxxxxxxuussx...",
    "....xxuzzssuuxxx....",
    "....xAxuzzsuxax.....",
    "...xAnxszzssxgux....",
    "..xAnncxsszuucxsx...",
    "..xAncaxusuzusxsx...",
    "..xAnacxussussxx....",
    "..xAnaxgngngxuuux...",
    "...xxxuzsuusuxux....",
    ".....xussxxusux.....",
    ".....xuxx..xxxx.....",
    ".....xasx..xaax.....",
    "....xaax....xxx.....",
    "....xxxx............",
  ],
  knightStepB: [
    "......xxxxxxxx......",
    "....xxzzzzzzzsxx....",
    "...xzzllllllllzsx...",
    "...xsszzzzzlzzssx...",
    "..xuzsxxxxxxzsusux..",
    "..xussxgxxgxsusuux..",
    "...xusxxxxxxuussx...",
    "....xxuzzssuuxxx....",
    "....xAxuzzsuxax.....",
    "...xAnxszzssxgux....",
    "..xAnncxsszuucxsx...",
    "..xAncaxusuzusxsx...",
    "..xAnacxussussxx....",
    "..xAnaxgngngxuuux...",
    "...xxxuzsuusuxux....",
    ".....xussxxusux.....",
    ".....xxxx..xuxx.....",
    ".....xaax..xasx.....",
    ".....xxx...xaax.....",
    "...........xxxx.....",
  ],
  dragon: [
    ".............g..g...",
    "............gx.gx...",
    "...........xTTxTx...",
    "..........xTtttttx..",
    "..........xttxtttx..",
    ".....Db...xttxyttxx.",
    "....xjbx..xttxyTTtx.",
    "....xjDbxxbtTTtTTtx.",
    ".Dx..xbDTbbtTtyyyx..",
    ".xbx.xbDbttbbtggx...",
    "..xtxbbDbbtbtbxx....",
    "...xtttbbttttbx.....",
    "....xxbbttttbx......",
    "......xbtbbtxx......",
    ".......xbx.xbx......",
    ".......xxx.xxx......",
  ],
  dragonFlap: [
    ".............g..g...",
    "............gx.gx...",
    "...........xTTxTx...",
    "..........xTtttttx..",
    "..........xttxtttx..",
    "..........xttxyttxx.",
    "..........xttxyTTtx.",
    "......DbxxbtTTtTTtx.",
    ".Dx..xjDTbbtTtyyyx..",
    ".xbx.xjbDttbbtggx...",
    "..xtxbDbbbtbtbxx....",
    "...xtttbbttttbx.....",
    "....xxbbttttbx......",
    "......xbtbbtxx......",
    ".......xbx.xbx......",
    ".......xxx.xxx......",
  ],
  wood: ["..nnnn...", ".acccnn..", "xnnnaacx.", "xaccnncx.", ".xxxxxx.."],
  gel: ["..bb...", ".bTTb..", "bTttbb.", ".bbbb.."],
  sword: ["......nn.", ".....ncn.", "....ncn..", ".a.ncn...", "..ncn....", "..na.....", ".a..a...."],
  stone: ["..sss..", ".slzsx.", "xssusux", "xuusuxx", ".xxxxx."],
  copper: ["..ccc..", ".cggnx.", "xnncngx", "xanannx", ".xxxxx."],
  pickaxe: ["..ccn...", ".cc..n..", ".....an.", "....a..n", "...a....", "..a.....", ".a......"],
  stoneSword: ["......zz.", ".....zsz.", "....zsu..", ".a.zsu...", "..zsu....", "..na.....", ".a..a...."],
  copperSword: ["......gc.", ".....gcn.", "....gcn..", ".a.gcn...", "..gcn....", "..na.....", ".a..a...."],
  copperSpear: ["..........ccg", ".........cgn.", "........cgn..", ".......ncn...", "......an.....", ".....an......", "....an.......", "...an........", "..an.........", ".an..........", "an..........."],
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

function rect(color, x, y, width, height, context = ctx) {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function sprite(name, x, y, facing = 1, flash = false, context = ctx) {
  const pixels = SPRITES[name];
  // De nieuwe acteurs gebruiken één Canvas-pixel per rastercel; de oude sprites gebruiken twee.
  const scale = name.startsWith("knight") || name.startsWith("dragon") ? 1 : 2;
  const width = pixels[0].length * scale;
  const left = Math.round(x - width / 2);
  const top = Math.round(y - pixels.length * scale + 7);
  pixels.forEach((row, j) => {
    [...row].forEach((pixel, i) => {
      if (pixel !== ".") {
        const column = facing > 0 ? i : row.length - 1 - i;
        rect(flash && pixel !== "x" ? "#fff2b7" : PALETTE[pixel], left + column * scale, top + j * scale, scale, scale, context);
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

function drawCabin() {
  rect("#1f352c", 60, 63, 137, 100);
  rect("#683e2d", 64, 83, 128, 77);
  for (let y = 93; y < 160; y += 10) {
    rect("#a96841", 66, y, 124, 8);
    rect("#ce8e56", 66, y, 124, 2);
    rect("#8d5438", 73 + (y * 3) % 24, y + 4, 17, 1);
    rect("#8d5438", 137 + y % 17, y + 6, 22, 1);
    rect("#75452e", 115 + y % 20, y + 2, 1, 6);
  }
  for (let row = 0; row < 5; row++) {
    const inset = (4 - row) * 9;
    rect("#4c2e32", 59 + inset, 55 + row * 8, 138 - inset * 2, 11);
    rect(row % 2 ? "#a05a43" : "#b76b4b", 61 + inset, 55 + row * 8, 134 - inset * 2, 5);
  }
  rect("#593732", 59, 94, 138, 6);
  rect("#402e2e99", 64, 100, 128, 6);
  for (const x of [83, 166]) {
    rect("#5d372b", x - 3, 107, 22, 20);
    rect("#ffd18a", x, 110, 16, 14);
    rect("#8c533b", x + 7, 110, 2, 14);
    rect("#8c533b", x, 116, 16, 2);
  }
  drawHouseDoor(128, 128, progress.repaired);
}

function drawHouseDoor(x, y, intact) {
  rect("#53342b", x + 3, y + 1, 26, 31);
  rect(intact ? "#a96b43" : "#382b2e", x + 7, y + 4, 18, 28);
  if (intact) {
    rect("#76432f", x + 13, y + 4, 2, 28);
    rect("#76432f", x + 20, y + 4, 2, 28);
    rect("#ffd18a", x + 20, y + 19, 3, 3);
  } else {
    rect("#a96b43", x + 7, y + 4, 5, 18);
    rect("#a96b43", x + 20, y + 11, 5, 21);
    rect("#dd9765", x + 6, y + 18, 8, 4);
    rect("#bb7950", x + 13, y + 22, 8, 4);
    rect("#98603d", x + 20, y + 26, 7, 4);
  }
}

// Alle grondversieringen worden door hun tegelcoördinaten bepaald.
function drawGrass(i, j, variant) {
  const x = i * TILE;
  const y = j * TILE;
  const seed = (i * 117 + j * 91 + i * j * 17) % 97;
  rect(["#426843", "#476e46", "#4b7448", "#406342"][variant], x, y, TILE, TILE);
  for (let n = 0; n < 5; n++) {
    const px = x + 3 + (seed + n * 11) % 25;
    const py = y + 4 + (seed * 3 + n * 7) % 23;
    rect("#365b3b", px, py, 5, 2);
    rect("#638650", px + 1, py - 3, 1, 4);
    rect("#769854", px + 3, py - 2, 1, 3);
  }
  if (seed % 3 === 0) {
    rect("#75654a", x + 5, y + 22, 8, 4);
    rect("#88724e", x + 8, y + 20, 6, 3);
  }
  if (seed % 4 === 0) {
    rect("#485745", x + 22, y + 12, 6, 4);
    rect("#9b9f80", x + 23, y + 11, 4, 2);
  }
}

function drawPath(i, j, variant) {
  const x = i * TILE;
  const y = j * TILE;
  const connects = (dx, dy) => "=PRGU".includes(room[j + dy]?.[i + dx] || " ");
  const path = "#b18a5d";
  rect(path, x + 5, y + 5, 22, 22);
  if (connects(-1, 0)) rect(path, x, y + 5, 6, 22);
  if (connects(1, 0)) rect(path, x + 26, y + 5, 6, 22);
  if (connects(0, -1)) rect(path, x + 5, y, 22, 6);
  if (connects(0, 1)) rect(path, x + 5, y + 26, 22, 6);
  rect("#c5a275", x + 7 + variant * 3, y + 10, 6, 2);
  rect("#92704d", x + 12, y + 22 - variant * 2, 4, 2);
  rect("#dac093", x + 20, y + 14, 2, 2);
}

function drawPlanks(x, y, variant) {
  rect("#623f31", x, y, 32, 32);
  for (let row = 0; row < 4; row++) {
    const top = y + row * 8;
    const seam = 7 + (variant * 7 + row * 11) % 19;
    rect(row % 2 ? "#a6734b" : "#ba8557", x, top, 32, 7);
    rect("#cb9862", x, top + 1, 32, 1);
    rect("#7d523a", x + seam, top, 1, 7);
    rect("#986945", x + 3, top + 4, 5 + row, 1);
    rect("#986945", x + 18, top + 5, 7, 1);
  }
}

function drawRock(x, y, variant) {
  rect("#3a403c", x + 2, y + 8, 29, 24);
  rect("#555c52", x + 4, y + 5, 25, 23);
  rect("#777e6c", x + 7, y + 3, 19, 11);
  rect("#4c554a", x + 9, y + 16, 13, 2);
  rect("#354538", x + 3, y + 24, 9 + variant, 5);
  rect("#5d7847", x + 5, y + 23, 7 + variant, 3);
  rect("#859459", x + 7, y + 21, 4, 2);
}

function drawCave(x, y) {
  rect("#363e39", x - 7, y + 1, 46, 31);
  rect("#636b5e", x - 4, y - 3, 40, 9);
  rect("#87907a", x + 2, y - 7, 28, 5);
  rect("#515c50", x - 6, y + 5, 44, 6);
  rect("#252f2d", x + 4, y + 14, 24, 18);
  rect("#131b1b", x + 8, y + 10, 16, 22);
  rect("#101719", x + 11, y + 15, 10, 17);
  rect("#687e4b", x - 5, y + 6, 12, 3);
  rect("#839759", x + 23, y - 5, 9, 3);
  for (const torchX of [x - 8, x + 36]) {
    rect("#563f34", torchX - 1, y + 22, 3, 8);
    rect("#bb6145", torchX - 3, y + 18, 7, 6);
    rect("#ffc581", torchX - 1, y + 16, 3, 6);
  }
}

function drawFurniture(name, x, y) {
  if (drawPng(name, x + 16, y + 16)) return;
  if (name === "chest") {
    rect("#251d28", x + 3, y + 8, 26, 18);
    rect("#ac6f43", x + 5, y + 9, 22, 8);
    rect("#694035", x + 5, y + 18, 22, 6);
    rect("#f6bc65", x + 14, y + 16, 4, 5);
  } else {
    rect("#59352e", x + 5, y + 12, 5, 16);
    rect("#59352e", x + 22, y + 12, 5, 16);
    rect("#ac6f43", x + 2, y + 7, 28, 9);
    rect("#e5b376", x + 3, y + 8, 26, 2);
    rect("#819cb0", x + 17, y + 8, 7, 4);
  }
}

function drawBuiltTorch(x, y) {
  const flameY = y - 6;
  const glow = ctx.createRadialGradient(x, flameY, 1, x, flameY, 24);
  glow.addColorStop(0, "#ffc07a77");
  glow.addColorStop(1, "#ff933600");
  rect(glow, x - 24, flameY - 24, 48, 48);
  if (drawPng("torch", x, y)) return;
  rect("#ac6f43", x - 2, y, 4, 11);
  rect("#e3734d", x - 4, y - 6, 8, 8);
  rect("#ffd386", x - 2, y - 8, 4, 7);
}

function drawDeposit(tile, x, y, variant, spent) {
  if (spent) {
    rect("#3d4c42", x + 6, y + 17, 21, 9);
    rect("#6a6b58", x + 8, y + 18, 5, 3);
    rect("#7d7963", x + 19, y + 22, 6, 3);
    return;
  }
  drawRock(x, y, variant);
  if (tile === "N") {
    rect("#8b4a37", x + 7, y + 12, 16, 6);
    rect("#db9259", x + 9, y + 12, 9, 3);
    rect("#edb477", x + 17, y + 16, 6, 2);
  }
}

function drawHarvestEffects() {
  for (const effect of harvestEffects) {
    const age = elapsed - effect.started;
    const { x, y, tool } = effect;
    sprite(tool, x - 10 + age * 40, y + 2);
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.4;
      const reach = 6 + age * (22 + 3 * i);
      const color = tool === "axe" ? (i % 2 ? "#e3b477" : "#ab6941") : (i % 2 ? "#b9b6a4" : "#e4a56d");
      rect(color, Math.round(x + Math.cos(angle) * reach),
        Math.round(y - 4 + Math.sin(angle) * reach + age * age * 55), 2 + i % 2, 2);
    }
  }
}

function drawArmor(x, y, row, column, context = ctx) {
  const { helmet, chestplate, boots } = progress.armor;
  x = Math.round(x);
  y = Math.round(y);
  const walking = context === ctx && player.walking && !inventoryOpen() && phase === "playing";
  const bob = [2, 3, 5].includes(column) ? 1 : 0;
  if (chestplate) {
    const offset = [0, -3, 3, 0][row];
    if (row === 3) {
      // Het rugzakprofiel blijft zichtbaar tussen de koperen schouderplaten.
      rect("#ba683f", x - 8, y - 3 + bob, 3, 5, context);
      rect("#ba683f", x + 5, y - 3 + bob, 3, 5, context);
    } else {
      rect("#743e37", x - 6 + offset, y - 4 + bob, 12, 7, context);
      rect("#bf744a", x - 5 + offset, y - 4 + bob, 10, 5, context);
      rect("#efaa65", x - 4 + offset, y - 3 + bob, 8, 2, context);
      rect("#975039", x - 3 + offset, y + 1 + bob, 6, 1, context);
    }
  }
  if (helmet) {
    rect("#8e4938", x - 6, y - 13 + bob, 12, 3, context);
    rect("#db9357", x - 5, y - 14 + bob, 10, 3, context);
    rect("#f3c182", x - 4, y - 14 + bob, 6, 1, context);
  }
  if (boots && !walking) {
    rect("#bf744a", x - 5, y + 5, 3, 2, context);
    rect("#bf744a", x + 2, y + 5, 3, 2, context);
  }
}

const knightPreview = document.querySelector("#knight-preview");
const previewContext = knightPreview.getContext("2d");
let lastPreviewEquipment, lastPreviewImage;

function drawKnightPreview() {
  if (!inventoryOpen() || !previewContext) return;
  const signature = [...Object.values(progress.armor), ...Object.values(progress.hands)].join("|");
  if (signature === lastPreviewEquipment && PNG_SPRITES.knight.image === lastPreviewImage) return;
  lastPreviewEquipment = signature;
  lastPreviewImage = PNG_SPRITES.knight.image;
  previewContext.clearRect(0, 0, knightPreview.width, knightPreview.height);
  if (!drawPng("knight", 20, 21, 0, 0, 1, 28, 28, previewContext)) {
    sprite("knight", 20, 25, 1, false, previewContext);
  }
  drawArmor(20, 25, 0, 0, previewContext);
  for (const [hand, x, facing] of [["left", 8, -1], ["right", 32, 1]]) {
    const weapon = WEAPONS[progress.hands[hand]];
    if (!weapon) continue;
    previewContext.save();
    previewContext.translate(x, 26);
    previewContext.scale(0.5, 0.5);
    sprite(weapon.sprite, 0, 0, facing, false, previewContext);
    previewContext.restore();
  }
}

function drawOverworld() {
  const builtTorches = [];
  const outside = area === "forest";
  room.forEach((row, j) => {
    [...row].forEach((tile, i) => {
      const x = i * TILE;
      const y = j * TILE;
      const variant = (i * 19 + j * 11) % 4;
      if (outside) {
        drawGrass(i, j, variant);
        if ("=PR".includes(tile)) drawPath(i, j, variant);
        if (tile === "#" || tile === "Y") {
          sprite(tile === "Y" && exhausted(RESOURCES.Y, i, j) ? "stump" : "tree", x + 16, y + 21);
        }
        if (tile === "Q") drawRock(x, y, variant);
        if (tile === "M" || tile === "N") drawDeposit(tile, x, y, variant, exhausted(RESOURCES[tile], i, j));

        const building = progress.buildings[tileId(i, j)];
        if (building === "floor") drawPlanks(x, y, variant);
        if (building === "fence") sprite(building, x + 16, y + 19);
        if (building === "torch") builtTorches.push({ x: x + 16, y: y + 16 });
      } else {
        rect(tile === "#" ? "#3c292b" : "#805536", x, y, TILE, TILE);
        if (tile !== "#") drawPlanks(x, y, variant);
        if (tile === "U") drawHouseDoor(x, y, true);
        if (tile === "W") drawFurniture("workbench", x, y);
        if (tile === "O") drawFurniture("chest", x, y);
        if (tile === "B") {
          rect("#59352e", x + 5, y + 1, 22, 30);
          rect("#e5cfaa", x + 8, y + 4, 16, 7);
          rect("#9f4950", x + 8, y + 12, 16, 15);
          rect("#d0766d", x + 8, y + 12, 16, 3);
        }
      }
    });
  });
  if (outside) {
    drawCabin();
    const [cave] = markers("G");
    drawCave(cave.x - 16, cave.y - 16);
    for (const { x, y } of builtTorches) drawBuiltTorch(x, y);
  }
  if (outside && !inventoryOpen() && selectedBuildItem()) {
    const site = buildSite();
    const x = site.x * TILE;
    const y = site.y * TILE;
    rect(site.allowed ? "#89df8d66" : "#f4777466", x + 1, y + 1, 30, 30);
    ctx.strokeStyle = site.allowed ? "#a2f5a5" : "#ff9390";
    ctx.strokeRect(x + 1.5, y + 1.5, 29, 29);
  }
}

function draw(time) {
  drawKnightPreview();
  if (exit) drawRoom(time);
  else drawOverworld();
  if (key && !hasKey) sprite("key", key.x, key.y + Math.round(Math.sin(time * 5) * 2));
  if (potion) sprite("potion", potion.x, potion.y);
  for (const drop of groundLoot) {
    sprite(drop.item, drop.x, drop.y + Math.round(Math.sin(time * 4) * 2));
  }
  const actors = [player, dragon, ...slimes].sort((a, b) => a.y - b.y);
  for (const actor of actors) {
    rect("#1d1926aa", Math.round(actor.x - 9), Math.round(actor.y + 4), 18, 4);
    if (actor === player) {
      if (protection > 0 && Math.floor(time * 18) % 2) continue;
      const { row, column } = knightFrame();
      if (!drawPng("knight", actor.x, actor.y - 4, column, row, 1, 28, 28)) {
        const fallback = ["knight", "knightStepA", "knightStepA", "knight", "knightStepB", "knightStepB"];
        sprite(fallback[column % fallback.length], actor.x, actor.y, actor.facing);
      }
      drawArmor(actor.x, actor.y, row, column);
    } else if (actor === dragon) {
      const column = dragonFrame(time);
      if (!drawPng("dragon", actor.x, actor.y - 2, column, 0, actor.facing, 25, 20)) {
        sprite(column === 1 ? "dragonFlap" : "dragon", actor.x, actor.y, actor.facing);
      }
    } else {
      sprite(actor.name, actor.x, actor.y, actor.facing, actor.flash > 0);
    }
  }
  if (swing) drawSwing();
  drawHarvestEffects();
  for (const ball of fireballs) sprite("fireball", ball.x, ball.y - 2);
}


function drawSwing() {
  const angle = Math.atan2(swing.y, swing.x);
  const phase = 1 - swing.time / SWING_TIME;
  const spear = swing.weapon === "copperSpear";
  const start = angle + (spear ? 0.15 : 0.8) * (swing.hand === "left" ? -1 : 1) * (1 - phase * 2);
  const weaponPosition = {
    x: player.x + Math.cos(start) * 15,
    y: player.y + Math.sin(start) * 15,
  };
  if (clearAttackPath(player, weaponPosition)) {
    sprite(WEAPONS[swing.weapon].sprite, weaponPosition.x, weaponPosition.y, swing.x < 0 ? -1 : 1);
  }
  for (let i = 0; i < 5; i++) {
    const offset = i * 0.14 - 0.28;
    const tip = WEAPONS[swing.weapon].range * 0.7;
    const point = {
      x: player.x + Math.cos(start + offset) * tip,
      y: player.y + Math.sin(start + offset) * tip,
    };
    if (clearAttackPath(player, point)) {
      rect(i === 2 ? "#fff0b8" : "#d59c65", Math.round(point.x), Math.round(point.y), 3, 2);
    }
  }
}
