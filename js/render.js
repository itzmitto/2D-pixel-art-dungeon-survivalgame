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

const DRAGON_COLORS = {
  X: "#392730", D: "#784225", A: "#b8692f", G: "#e59c37", H: "#ffd46c", P: "#fff0b5",
  R: "#a95363", S: "#be6e73", M: "#efab90", L: "#f9c3a5", Q: "#d48a82", C: "#f3b955",
};
const DRAGON_FALLBACK = [
  [
    "...XX....................", "....DCDD.................", ".....XQSHD.D...XD.DA.....", ".....DMQSRPAA...DAADD....",
    "....DDPMQSRDAH.DDDDHGA...", "....AQMMMSRRDHA..DADHGA..", ".......LMMSRRDG.DDADGDH..", ".......DLLQSRRX.DADPCHCC.",
    ".......DMLMQRRHXXDGQD.X..", ".X.......DMMSRDACDCP.....", ".DA......DDQSARGAGAM.....", ".DGA....DADDDAPCACP......",
    "..DGDDDDAAADHDGDDA.......", "....HAAGD..DDXGDX........", "...........XDA.D.........", "...........X.............",
    ".........................", ".........................", ".........................", ".........................",
  ],
  [
    ".........................", ".........................", "...............XA.DA.....", "................DAXDA....",
    ".......DDDD....DDADPCA...", "....DACAGARRDA...DAXHGA..", "..XASDARRRDADDD..DDXGDC..", "...RQLMSSSRRDRD.DADHHHHC.",
    "...XPLMLMQSSDRDXDDCMD.X..", ".D.....QMMLQAAADGAHP.....", ".XA....D.DDDSADHAGAL.....", ".DDA....ADDADAGHACP......",
    "..XADDADDAADGDDDDA.......", "....CADAD..DDDADA........", "...........XXA.D.........", "...........X.............",
    ".........................", ".........................", ".........................", ".........................",
  ],
  [
    ".........................", ".........................", "...............XD.DA.....", "................XADDA....",
    "...............DADDDGX...", ".................DAXCHD..", ".................DDAGAC..", "................DADPCPCG.",
    "..........DDHADXXAGSD.X..", ".X.......DDADDDACDGP.....", ".DA.....DDXASHGPAAPS.....", ".ADA...AADDAXPDCACA......",
    "..DGADDDRGRDCDGDDD.......", "....CDPQQSDGDDGDX........", "....DQQSRQSDDA.D.........", "...DAQSQQQR..............",
    "...XLSQS.................", "...DG....................", "...D.....................", ".........................",
  ],
  [
    ".........................", ".........................", "...............XD.DA.....", "................DDXDA....",
    "...............DDDDCGA...", ".................DADPDD..", ".........DDDD...DDDAXDH..", ".....DADASQSSSA.DDDPGXCG.",
    "....DAASRRDPSRCADAAMD.X..", ".D..RSQRSRQRDPADADHP.....", ".DASDAMPMQQSADDCAHAS.....", ".DDA..XLLDDLDAPGAGL......",
    "..XGDDDDAADDADADDA.......", "....CXDAD..DDDCDX........", "...........DAA.D.........", "...........X.............",
    ".........................", ".........................", ".........................", ".........................",
  ],
];

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
  wood: ["..nnnn...", ".acccnn..", "xnnnaacx.", "xaccnncx.", ".xxxxxx.."],
  gel: ["..bb...", ".bTTb..", "bTttbb.", ".bbbb.."],
  wolfFang: ["..xllx..", ".xlylx..", ".xllsx..", "..xls...", "..xs....", "..x....."],
  serpentScale: ["...xx...", "..xTbx..", ".xTtbbx.", ".xtbbbx.", "..xbDx..", "...xx..."],
  fangBlade: ["......ll.", ".....lyl.", "....lslx.", "...lslx..", ".gxslx...", "..yx.....", ".nxg.....", "xnx......"],
  sword: ["......nn.", ".....ncn.", "....ncn..", ".a.ncn...", "..ncn....", "..na.....", ".a..a...."],
  stone: ["..sss..", ".slzsx.", "xssusux", "xuusuxx", ".xxxxx."],
  copper: ["..ccc..", ".cggnx.", "xnncngx", "xanannx", ".xxxxx."],
  pickaxe: ["..ccn...", ".cc..n..", ".....an.", "....a..n", "...a....", "..a.....", ".a......"],
  stoneSword: ["......zz.", ".....zsz.", "....zsu..", ".a.zsu...", "..zsu....", "..na.....", ".a..a...."],
  copperSword: ["......gc.", ".....gcn.", "....gcn..", ".a.gcn...", "..gcn....", "..na.....", ".a..a...."],
  copperSpear: ["..........ccg", ".........cgn.", "........cgn..", ".......ncn...", "......an.....", ".....an......", "....an.......", "...an........", "..an.........", ".an..........", "an..........."],
  key: ["..gg......", ".gyyg.....", "gy..yg....", "gy..yg....",
    ".gyyggggg.", "..gg..g.g."],
  fireball: [".ff..", "foof.", "foyof", ".oof.", "..f.."],
  potion: [
    "..ggg..", "..xgx..", "..xlx..", ".xlllx.",
    "xlhmmlx", "xhmmmmx", "xmmmmmx", ".xxxxx.",
  ],
};

const KNIGHT_COLORS = {
  a: "#171620", b: "#282b3a", c: "#404959", d: "#451e33", e: "#667a91", f: "#792b49",
  g: "#9baec0", h: "#9d7148", i: "#b04e60", j: "#dce4e5", k: "#ebba74",
};
const KNIGHT_FALLBACK = [
  [
    "............................", "............................", "............................", ".............aaa............",
    "...........aaeeeaa..........", "..........acgjjeeca.........", ".........aeeeeeeeeea........", ".........aeeeeeeeeec........",
    "........acakkbbkkkca........", "........acbbaaaabbba........", ".........abbebbeeba.........", "........a.abbeebbb..........",
    ".......abaaaaabaaaaaa.......", "......ggbgaggeegggbggga.....", "......bbbgceegeeeebbbba.....", "......bbgbceeeeeecabbba.....",
    "......bbbaccceeccaabeba.....", "......bebaaccceccaabbba.....", "......abaabbbhhbbbaaab......", ".......aacddiddfddca.a......",
    "........bccec.acccca........", "........bccec.acccca........", "........bbbbc.abbbca........", "........bgggg.aeeeea........",
    "........bbbbbaabbbbb........", "............................", "............................", "............................",
  ],
  [
    "............................", "............................", "............................", "..........aaaaaa............",
    ".........aeeeeecaa..........", "........aceeggggcc..........", "........aeeeeeeeeea.........", "........beeeeeeeeca.........",
    "......abbbaaabbhcca.........", "......acebbbbbbhcca.........", ".......acbbebbbccc..........", "........acbbbbcccaa.........",
    ".........aaaaaaaaaa.........", ".........aeeeggbbbaa........", "........aceggeebeeaa........", ".........aeeeeaebbba........",
    ".........aceeeebebba........", ".........acccccaebba........", "........cccchhbbbbafa.......", "........ccaccccaaaafa.......",
    "........ceccb.aeccbaia......", "........ceccb.aeccbaaa......", "........cbbbb.abbbbafa......", "........eeeeb.agggbada......",
    ".......abbbbbabbbbbaaa......", "............................", "............................", "............................",
  ],
  [
    "............................", "............................", "............................", "............aaaaaa..........",
    "..........aaceeeeea.........", "..........ccggggeeca........", ".........aeeeeeeeeea........", ".........aceeeeeeeeb........",
    ".........acchbbaaabbba......", ".........acchbbbbbbeca......", "..........cccbbbebbca.......", ".........aacccbbbbca........",
    ".........aaaaaaaaaa.........", "........aabbbggeeea.........", "........aaeebeeggeca........", "........abbbeaeeeea.........",
    "........abbebeeeeca.........", "........abbeaccccca.........", ".......afabbbbhhcccc........", ".......afaaaaccccacc........",
    "......aiabccea.bccec........", "......aaabccea.bccec........", "......afabbbba.bbbbc........", "......adabggga.beeee........",
    "......aaabbbbbabbbbba.......", "............................", "............................", "............................",
  ],
  [
    "............................", "............................", "............................", "............aaaaa...........",
    "..........aaceeeca..........", ".........accebeeec..........", ".........aegebeeeeca........", ".........aeeebeeeeca........",
    "........aceeebeeeecc........", "........aceeebeeeecc........", ".........aceeebeecca........", "........acacchhcccaaaa......",
    "......aaggaaahhaaaeecc......", "......accccaffffffcccca.....", "......ccccafffffffcccca.....", "......aacaifffffffaaaa......",
    "........adiffffffffda.......", ".......adfiffffffffdda......", ".......adfifffffffidda......", ".......adfifffffffifda......",
    "......adfffffffdffifda......", "......adfifffffdffifdd......", "......adfffddaaddddddda.....", ".......addaaa.aaadddaaa.....",
    "........aabbbaabbaaa........", "............................", "............................", "............................",
  ],
];

const ENEMY_COLORS = {
  a: "#162029", b: "#171522", c: "#233a46", d: "#2e2941", e: "#356166", f: "#51405e",
  g: "#5b8c86", h: "#7d608c", i: "#9eb67f", j: "#a7794e", k: "#ad8db1", l: "#efa95f",
  m: "#f5c9ff", n: "#fff6bb",
};
const ENEMY_FALLBACK = {
  wolf: [
    "..................................", "..................................", "..................................", "...................b..............",
    "...................bbb............", "...................bhfb...........", "....................bhhfb.bb......", "..b.................bhhffbffb.....",
    "..fb...............bbhhhfffhb.....", "..dfb......bbbb...bfbffffhhhb.....", "..ddfb....bffhfbbbffbffhhhhhhb....", "..dddfdbbhhkhhhkkhhhbffhhhhhmhfb..",
    "..bdddffbhhhhhhhhhhhhbfhhhhhhfff..", "...bddddbfhhhhhhhhhffbhffffffffbb.", "...bddddbfhhhhhhhhfffbhfdffffbbfb.", ".....bbdbffffffbbfffbfdfffffffk...",
    ".......bbbbfffffbbbfbfbffffffmfb..", "........bddbfbbfb.bbbbffffffffbb..", "........bdddbfffb.bbbffffbbbbb....", ".........bddbbffb..ddbbfbb........",
    "..........bddbbffb.bddbfffb.......", "...........ddbbffbb.bddbffbb......", "...........ddddffff.bddbffff......", "...........bbbbbbbb..bbbbbbb......",
    "..................................", "..................................",
  ],
  snake: [
    "..................................", "..................................", "..................................", "........................a.........",
    "........................aa........", ".......................aea..a.....", ".......................eegggggga..", "......................aegggggggga.",
    ".....................aegggglnlggea", ".....................aeggggggggeea", ".....................aegggeeeeeaa.", "............a.........aeeeeeeeaa..",
    "............caaaaa.....aaaaeea....", "..........aeeccccc.....acceaaa....", ".........aaeeeeeee.a....aceica....", "...ca..aaeegiccceeea....aceeca....",
    "...ecaaaeegeccccieeaa...aceeca....", "..eeeccgggeeeeeeccecaaaacceica....", "..eeeegeeieeeeeeeeecccccceeeca....", ".aceeeeeeececccjjeeeeeeieejj......",
    "...accaaaaeeeeeeecccccjjccca......", ".........aaeeeeecaaaaaaccaa.......", "..........accccca......aa.........", "...........aaaa...................",
    "..................................", "..................................",
  ],
};

function rect(color, x, y, width, height, context = ctx) {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function sprite(name, x, y, facing = 1, flash = false, context = ctx) {
  const pixels = SPRITES[name];
  const scale = 2;
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

function drawDragon(x, y, facing, time) {
  const column = dragonFrame(time);
  const width = 25;
  const height = 20;
  if (drawPng("dragon", x, y - 2, column, 0, facing, width, height)) return;
  drawPixelMap(DRAGON_FALLBACK[column], DRAGON_COLORS, x, y - 2, facing);
}

function drawPixelMap(pixels, colors, x, y, facing = 1, context = ctx) {
  const width = pixels[0].length;
  const left = Math.round(x - width / 2);
  const top = Math.round(y - pixels.length / 2);
  pixels.forEach((row, j) => {
    [...row].forEach((pixel, i) => {
      if (pixel === ".") return;
      rect(colors[pixel], left + (facing < 0 ? width - 1 - i : i), top + j, 1, 1, context);
    });
  });
}

function drawEnemy({ kind, x, y, walkTime, facing, flash, attackPose }) {
  const actionFrame = PNG_SPRITES[kind].columns - 1;
  const frame = attackPose ? actionFrame : Math.floor(walkTime * 8) % actionFrame;
  ctx.save();
  if (flash > 0) ctx.filter = "brightness(1.8) saturate(0.5)";
  if (!drawPng(kind, x, y - 4, frame, 0, facing, 34, 26)) {
    drawPixelMap(ENEMY_FALLBACK[kind], ENEMY_COLORS, x, y - 4, facing);
  }
  ctx.restore();
}

function drawWarden(warden) {
  const { x, y, facing, attack, flash, walkTime } = warden;
  const lift = attack ? Number(attack.phase === "windup") * 2 : Math.floor(walkTime * 6) % 2;
  ctx.save();
  if (flash > 0) ctx.filter = "brightness(1.65)";
  if (!drawPng("warden", x, y - 8 - lift, 0, 0, -facing, 64, 32)) {
    const left = Math.round(x) - 16;
    const top = Math.round(y) - 29;
    rect("#242029", left + 1, top + 6, 30, 32);
    rect("#527455", left + 4, top + 18, 24, 16);
    rect("#638a58", left + 7, top + 3, 19, 18);
    rect("#c2c486", left + 8, top + 4, 15, 3);
    rect("#edd7a3", left + 10, top + 9, 12, 5);
    rect("#3d2732", left + 15 + facing, top + 9, 4, 5);
    rect("#645243", left + 6, top + 26, 21, 7);
    rect("#434036", left + 5, top + 33, 8, 8);
    rect("#434036", left + 21, top + 33, 8, 8);
  }
  ctx.restore();
}

const terrainBackdrops = new Map();

function drawTerrainBackdrop(name, variantFor) {
  const { image, width, height } = PNG_SPRITES[name];
  if (!image) return false;
  let backdrop = terrainBackdrops.get(area);
  if (backdrop?.image !== image) {
    const layer = document.createElement("canvas");
    layer.width = room[0].length * width;
    layer.height = room.length * height;
    const paint = layer.getContext("2d");
    if (!paint) return false;
    room.forEach((row, y) => {
      [...row].forEach((tile, x) => {
        const frame = variantFor(tile, x, y);
        paint.drawImage(image, frame * width, 0, width, height, x * width, y * height, width, height);
      });
    });
    backdrop = { image, layer };
    terrainBackdrops.set(area, backdrop);
  }
  ctx.drawImage(backdrop.layer, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  return true;
}

function dungeonTileFrame(tile, x, y) {
  return (x * 17 + y * 31) % 4 + (tile === "#" || tile === "T" ? 4 : 0);
}

function grassTileFrame(_tile, x, y) {
  return (x * 29 + y * 17 + x * y) % 8;
}

function drawRoom(time) {
  const torches = [];
  const painted = drawTerrainBackdrop("dungeonStone", dungeonTileFrame);
  room.forEach((row, j) => {
    [...row].forEach((tile, i) => {
      const x = i * TILE;
      const y = j * TILE;
      const isWall = tile === "#" || tile === "T";
      if (!painted && isWall) {
        rect("#23212c", x, y, 32, 32);
        rect("#656071", x + 1, y + 1, 30, 5);
        rect("#494452", x + 1, y + 6, 30, 20);
        rect("#322d3c", x, y + 15, 32, 2);
        rect("#322d3c", x + 12, y + 6, 2, 9);
        rect("#322d3c", x + 23, y + 17, 2, 9);
        rect("#302a36", x + 1, y + 26, 30, 5);
      }
      if (!painted && !isWall) {
        const variant = dungeonTileFrame(tile, i, j);
        rect(["#373541", "#3b3845", "#413c46", "#3c3942"][variant], x, y, TILE, TILE);
      }
      if (tile === "T") torches.push({ x: x + 16, y: y + 14 });
      if (tile === "C") drawDungeonChest(x, y);
      if (tile === "A" || tile === "E") drawDungeonDoor(tile, x, y);
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

function drawDungeonChest(x, y) {
  const unlocked = chestUnlocked(area);
  const open = unlocked && (progress.chestId === area || !chestSlots(progress, area).some(Boolean));
  const spriteName = area === "dungeon3" ? (open ? "rewardOpen" : "rewardClosed") :
    (open ? "supplyOpen" : "supplyClosed");
  const { width, height } = PNG_SPRITES[spriteName];
  if (!drawPng(spriteName, x + 16, y + 26 - height, 0, 0, 1, width * 2, height * 2)) drawFurniture("chest", x, y);
  if (!unlocked) {
    rect("#33232d", x + 12, y + 15, 8, 9);
    rect("#ffe090", x + 13, y + 18, 6, 5);
    rect("#92654b", x + 15, y + 19, 2, 3);
  }
}

function drawDungeonDoor(tile, x, y) {
  const returnDoor = tile === "A";
  const open = portalOpen(PORTALS[area][tile]);
  ctx.save();
  ctx.translate(x + (returnDoor ? TILE : 0), y);
  if (returnDoor) ctx.scale(-1, 1);
  rect("#767083", 5, 1, 27, 30);
  rect(open ? "#183932" : "#4b3133", 9, 5, 23, 22);
  if (open) {
    const arrow = returnDoor ? "#abbecc" : "#76d4a6";
    rect(arrow, 14, 15, 11, 3);
    rect(arrow, 22, 12, 3, 9);
    rect(arrow, 25, 15, 3, 3);
  } else {
    for (const bar of [12, 19, 26]) rect("#a08780", bar, 5, 2, 22);
    rect("#f6bc65", 18, 15, 6, 6);
  }
  ctx.restore();
}

function drawCabin() {
  const [door] = markers("U");
  if (!drawPng("cottage", door.x - 16, door.y - 32)) {
    rect("#ae774e", door.x - 80, door.y - 38, 128, 53);
    rect("#773f42", door.x - 80, door.y - 70, 128, 36);
    rect("#ffd18a", door.x - 57, door.y - 22, 16, 14);
    rect("#ffd18a", door.x + 22, door.y - 22, 16, 14);
  }
  if (!drawPng("porch", door.x - 16, door.y + TILE)) {
    rect("#ae774e", door.x - 48, door.y + 16, 64, 20);
    rect("#c48a58", door.x - 12, door.y + 36, 24, 8);
  }
  drawHouseDoor(door.x, door.y, 0);
}

function drawHouseDoor(x, y, frame) {
  if (drawPng("houseDoor", x, y, frame)) return;
  rect("#8e563b", x - 14, y - 14, 28, 30);
  rect("#30262a", x - 9, y - 9, 18, 21);
  rect("#c48a58", x - 10, y + 12, 20, 4);
}

function drawHouse(time) {
  rect("#281f26", 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  rect("#543934", 56, 56, 368, 232);
  rect("#78503c", 60, 60, 360, 208);
  room.forEach((row, j) => {
    [...row].forEach((tile, i) => {
      if (tile === "#") return;
      const x = i * TILE;
      const y = j * TILE;
      const variant = (i * 19 + j * 11) % 4;
      if (!drawPng("houseFloor", x + TILE / 2, y + TILE / 2, variant)) drawPlanks(x, y, variant);
    });
  });
  const center = WORLD_WIDTH / 2;
  drawPng("houseWall", center, 40);
  const glow = ctx.createRadialGradient(center, 60, 5, center, 60, 42 + Math.sin(time * 7) * 3);
  glow.addColorStop(0, "#ffd07e40");
  glow.addColorStop(1, "#ff9d6400");
  rect(glow, center - 46, 64, 92, 42);
  drawPng("rug", center, 178);
  for (const [tile, name] of [["W", "workbench"], ["O", "chest"], ["B", "bed"]]) {
    const [position] = markers(tile);
    drawFurniture(name, position.x - TILE / 2, position.y - TILE / 2);
  }
  const [door] = markers("U");
  drawHouseDoor(door.x, door.y, 1);
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
  if (drawTerrainTile("rocks", x, y, variant % 2)) return;
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
  rect("#252f2d", x + 3, y + 13, 26, 19);
  rect("#131b1b", x + 6, y + 10, 20, 20);
  rect("#101719", x + 9, y + 15, 14, 13);
  rect("#66584a", x + 5, y + 27, 22, 5);
  rect("#9e805c", x + 5, y + 30, 22, 2);
  rect("#b18a5d", x + 5, y + 32, 22, 1);
  rect("#bc9b71", x + 13, y + 31, 6, 1);
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
  } else if (name === "bed") {
    rect("#59352e", x + 5, y + 1, 22, 30);
    rect("#e5cfaa", x + 8, y + 4, 16, 7);
    rect("#38665a", x + 8, y + 12, 16, 15);
    rect("#75a58a", x + 8, y + 12, 16, 3);
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
  if (drawTerrainTile("rocks", x, y, spent ? 4 : tile === "N" ? 3 : 2)) return;
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

const KNIGHT_STRIDE = [0, 1, 2, 0, -1, -2];

function knightFootPositions(x, y, row, column) {
  const stride = KNIGHT_STRIDE[column];
  return [13, 22].map((left, i) => {
    const side = row === 1 || row === 2;
    const sourceX = row === 1 ? 39 - (left + 7) : left - Number(!side);
    return {
      x: Math.round(x - 14) + Math.round(sourceX * 0.7),
      y: Math.round(y - 18) + Math.round((33 + (i ? -stride : stride)) * 0.7),
    };
  });
}

function drawKnight(x, y, row, column, context = ctx) {
  if (!drawPng("knight", x, y - 4, column, row, 1, 28, 28, context)) {
    const bob = [2, 3, 5].includes(column) ? 1 : 0;
    drawPixelMap(KNIGHT_FALLBACK[row], KNIGHT_COLORS, x, y - 4 + bob, 1, context);
  }
  drawArmor(x, y, row, column, context);
}

function drawArmor(x, y, row, column, context = ctx) {
  const { helmet, chestplate, boots } = progress.armor;
  x = Math.round(x);
  y = Math.round(y);
  const bob = [2, 3, 5].includes(column) ? 1 : 0;
  if (chestplate) {
    const offset = [0, -3, 3, 0][row];
    const scale = chestplate === "scaleArmor";
    const shadow = scale ? "#28434f" : "#743e37";
    const plate = scale ? "#498278" : "#bf744a";
    const rim = scale ? "#a3c99a" : "#efaa65";
    if (row === 3) {
      rect(plate, x - 8, y - 3 + bob, 3, 5, context);
      rect(plate, x + 5, y - 3 + bob, 3, 5, context);
    } else {
      rect(shadow, x - 6 + offset, y - 4 + bob, 12, 7, context);
      rect(plate, x - 5 + offset, y - 4 + bob, 10, 5, context);
      rect(rim, x - 4 + offset, y - 3 + bob, 8, 2, context);
      rect(shadow, x - 3 + offset, y + 1 + bob, 6, 1, context);
    }
  }
  if (helmet) {
    const top = y - 15 + bob;
    const offset = [0, -1, 1, 0][row];
    const left = x - 7 + offset;
    rect("#593438", left + 2, top, 10, 2, context);
    rect("#8e4938", left, top + 2, 14, 6, context);
    rect("#db9357", left + 1, top + 1, 12, 4, context);
    rect("#f3c182", left + 3, top + 1, 7, 1, context);
    if (row !== 3) {
      rect("#583038", left + 3, top + 6, 8, 1, context);
      rect("#f3c182", left + 4, top + 6, 2, 1, context);
      rect("#f3c182", left + 8, top + 6, 2, 1, context);
    }
  }
  if (boots) {
    for (const foot of knightFootPositions(x, y, row, column)) {
      rect("#743e37", foot.x, foot.y - 1, 5, 3, context);
      rect("#db9357", foot.x + 1, foot.y - 1, 3, 2, context);
    }
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
  drawKnight(20, 25, 0, 0, previewContext);
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

function drawForest() {
  const builtTorches = [];
  const painted = drawTerrainBackdrop("grass", grassTileFrame);
  room.forEach((row, j) => {
    [...row].forEach((tile, i) => {
      const x = i * TILE;
      const y = j * TILE;
      const variant = (i * 19 + j * 11) % 4;
      if (!painted) drawGrass(i, j, variant);
      if ("=PR".includes(tile)) drawPath(i, j, variant);
      if (tile === "#" || tile === "Y") {
        const spent = tile === "Y" && exhausted(LEGACY_RESOURCES.Y, i, j);
        const drawn = spent ? drawPng("stump", x + 16, y + 24, 0, 0, 1, 18, 8) :
          drawPng("trees", x + 16, y + 17, (i + j * 2) % 3, 0, 1, 24, 22);
        if (!drawn) sprite(spent ? "stump" : "tree", x + 16, y + 21);
      }
      if (tile === "Q") drawRock(x, y, variant);
      if (tile === "M" || tile === "N") drawDeposit(tile, x, y, variant, exhausted(LEGACY_RESOURCES[tile], i, j));

      const building = progress.buildings[tileId(i, j)];
      if (building === "floor") drawPlanks(x, y, variant);
      if (building === "fence") sprite(building, x + 16, y + 19);
      if (building === "torch") builtTorches.push({ x: x + 16, y: y + 16 });
    });
  });
  drawCabin();
  const [cave] = markers("G");
  drawCave(cave.x - 16, cave.y - 16);
  for (const { x, y } of builtTorches) drawBuiltTorch(x, y);
  if (!inventoryOpen() && selectedBuildItem()) {
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
  if (area === "forest") drawForest();
  else if (area === "house") drawHouse(time);
  else drawRoom(time);
  const warden = enemies.find(enemy => enemy.kind === "warden" && enemy.health > 0);
  if (warden) drawWardenTelegraph(warden);
  if (key && !hasKey) sprite("key", key.x, key.y + Math.round(Math.sin(time * 5) * 2));
  if (potion) sprite("potion", potion.x, potion.y);
  for (const drop of groundLoot) {
    sprite(drop.item, drop.x, drop.y + Math.round(Math.sin(time * 4) * 2));
  }
  const actors = [player, dragon, ...enemies].sort((a, b) => a.y - b.y);
  for (const actor of actors) {
    rect("#1d1926aa", Math.round(actor.x - 9), Math.round(actor.y + 4), 18, 4);
    if (actor === player) {
      if (protection > 0 && Math.floor(time * 18) % 2) continue;
      const { row, column } = knightFrame();
      drawKnight(actor.x, actor.y, row, column);
    } else if (actor === dragon) {
      drawDragon(actor.x, actor.y, actor.facing, time);
    } else if (actor.kind === "warden") {
      drawWarden(actor);
    } else {
      drawEnemy(actor);
    }
  }
  if (swing) drawSwing();
  for (const ball of fireballs) sprite("fireball", ball.x, ball.y - 2);
}


function drawSwing() {
  const angle = Math.atan2(swing.y, swing.x);
  const phase = 1 - swing.time / swing.duration;
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
