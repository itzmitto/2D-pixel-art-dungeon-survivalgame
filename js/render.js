"use strict";

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

function drawCabin() {
  rect("#1f352c", 60, 63, 137, 100);
  rect("#683e2d", 64, 83, 128, 77);
  for (let y = 93; y < 160; y += 10) {
    rect("#a96841", 66, y, 124, 8);
    rect("#ce8e56", 66, y, 124, 2);
  }
  for (let row = 0; row < 5; row++) {
    const inset = (4 - row) * 9;
    rect("#4c2e32", 59 + inset, 55 + row * 8, 138 - inset * 2, 11);
    rect(row % 2 ? "#a05a43" : "#b76b4b", 61 + inset, 55 + row * 8, 134 - inset * 2, 5);
  }
  rect("#593732", 59, 94, 138, 6);
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
    rect("#da9862", x + 9, y + 23, 14, 5);
  }
}

function drawOverworld() {
  const outside = area === "forest";
  room.forEach((row, j) => {
    [...row].forEach((tile, i) => {
      const x = i * TILE;
      const y = j * TILE;
      const variant = (i * 19 + j * 11) % 4;
      if (outside) {
        const path = "=PR".includes(tile);
        rect(path ? "#9b7751" : ["#385c40", "#3d6342", "#436846", "#3b6142"][variant], x, y, TILE, TILE);
        if (path) {
          rect("#ac895d", x + 5 + variant * 4, y + 9, 6, 2);
          rect("#806345", x + 12, y + 23 - variant * 3, 4, 2);
        } else {
          rect("#55764a", x + 4 + variant * 4, y + 12, 2, 4);
          rect("#55764a", x + 6 + variant * 4, y + 15, 3, 2);
        }
        if (tile === "#" || tile === "Y") {
          sprite(tile === "Y" && treeCut(i, j) ? "stump" : "tree",
            x + 16, y + 21);
        }
        if (tile === "G") {
          rect("#777c76", x + 2, y + 8, 28, 24);
          rect("#93938a", x + 7, y + 3, 18, 7);
          rect("#3a4140", x + 8, y + 12, 16, 20);
          rect("#f6bc65", x + 3, y + 16, 3, 5);
          rect("#f6bc65", x + 26, y + 16, 3, 5);
        }
        const building = progress.buildings[tileId(i, j)];
        if (building) sprite(building, x + 16, y + 19);
      } else {
        rect(tile === "#" ? "#3c292b" : "#805536", x, y, TILE, TILE);
        if (tile !== "#") {
          rect("#9d6b43", x + 1, y + 1, 30, 14);
          rect("#95613e", x + 1, y + 17, 30, 14);
        }
        if (tile === "U") drawHouseDoor(x, y, true);
        if (tile === "B") {
          rect("#59352e", x + 5, y + 1, 22, 30);
          rect("#e5cfaa", x + 8, y + 4, 16, 7);
          rect("#9f4950", x + 8, y + 12, 16, 15);
          rect("#d0766d", x + 8, y + 12, 16, 3);
        }
      }
    });
  });
  if (outside) drawCabin();
  if (outside && buildItem) {
    const site = buildSite();
    const x = site.x * TILE;
    const y = site.y * TILE;
    rect(site.allowed ? "#89df8d66" : "#f4777466", x + 1, y + 1, 30, 30);
    ctx.strokeStyle = site.allowed ? "#a2f5a5" : "#ff9390";
    ctx.strokeRect(x + 1.5, y + 1.5, 29, 29);
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
