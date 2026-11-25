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

function drawEnemy(enemy, time) {
  const { kind, x, y, walkTime, facing, flash, attackPose } = enemy;
  const actionFrame = PNG_SPRITES[kind].columns - 1;
  const frame = attackPose ? actionFrame : Math.floor(walkTime * 8) % actionFrame;
  ctx.save();
  if (flash > 0) ctx.filter = "brightness(1.8) saturate(0.5)";
  const paintedWolf = kind === "wolf" && drawWolf(enemy, time);
  if (!paintedWolf && !drawPng(kind, x, y - 4, frame, 0, facing, 34, 26)) {
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

function drawDungeonChest(id, x, y) {
  const unlocked = chestUnlocked(id);
  const open = unlocked && (progress.chestId === id || !chestSlots(progress, id).some(Boolean));
  const spriteName = CHEST_STATIONS[id].boss ? (open ? "rewardOpen" : "rewardClosed") :
    (open ? "supplyOpen" : "supplyClosed");
  const { width, height } = PNG_SPRITES[spriteName];
  if (!drawPng(spriteName, x + 16, y + 26 - height, 0, 0, 1, width * 2, height * 2)) drawFurniture("chest", x, y);
  if (!unlocked) {
    rect("#33232d", x + 12, y + 15, 8, 9);
    rect("#ffe090", x + 13, y + 18, 6, 5);
    rect("#92654b", x + 15, y + 19, 2, 3);
  }
}

function drawRuinGate(tile, x, y) {
  const open = gateOpen(tile);
  const stone = tile === "G" ? "#736e57" : "#6b6860";
  rect("#262b2b", x, y + 4, TILE, 24);
  rect("#3d4240", x, y + 8, TILE, 16);
  for (const offset of [0, 25]) {
    rect("#323832", x, y + offset, TILE, 7);
    rect(stone, x + 1, y + offset, TILE - 2, 4);
    rect("#879172", x + 5, y + offset + 1, 9, 1);
    rect("#4b5842", x + 22, y + offset + 3, 7, 2);
  }
  if (open) {
    rect("#525546", x + 12, y + 8, 8, 16);
    rect("#74715d", x + 13, y + 9, 1, 13);
    return;
  }
  rect("#222328", x + 10, y + 5, 12, 23);
  for (let bar = 0; bar < 4; bar++) rect("#746d61", x + 11 + bar * 3, y + 4, 1, 23);
  for (const offset of [8, 22]) rect("#453c3c", x + 9, y + offset, 14, 3);
  rect("#c89255", x + 14, y + 13, 5, 6);
  rect("#533944", x + 16, y + 15, 1, 2);
}

function drawHouseDoor(x, y, frame) {
  if (drawPng("houseDoor", x, y, frame)) return;
  rect("#8e563b", x - 14, y - 14, 28, 30);
  rect("#30262a", x - 9, y - 9, 18, 21);
  rect("#c48a58", x - 10, y + 12, 20, 4);
}

function buildingInView({ left, top, right, bottom }) {
  return left * TILE < camera.x + VIEW_WIDTH && (right + 1) * TILE > camera.x &&
    top * TILE < camera.y + VIEW_HEIGHT && (bottom + 1) * TILE > camera.y;
}

function drawBuildingExterior({ left, top, right, bottom }, cottage = false) {
  const x = left * TILE;
  const y = top * TILE;
  const width = (right - left + 1) * TILE;
  const height = (bottom - top + 1) * TILE;
  rect("#1d27279c", x + 7, y + height - 19, width + 3, 24);
  ctx.save();
  if (!cottage) {
    ctx.filter = (left + top) % 3 === 0 ? "saturate(0.6) brightness(0.79)" : "saturate(0.72) brightness(0.88)";
  }
  const image = PNG_SPRITES.cottage.image;
  if (cottage && image) {
    // Align the source facade's off-center awning with the doorway tile.
    const half = width / 2;
    ctx.drawImage(image, 0, 0, 80, 96, x, y, half, height);
    ctx.drawImage(image, 80, 0, 48, 96, x + half, y, half, height);
  } else if (!drawPng("cottage", x + width / 2, y + height / 2, 0, 0, 1, width, height)) {
    rect("#523b34", x + 3, y + 40, width - 6, height - 42);
    rect("#422e37", x, y + 19, width, 34);
    rect("#6f493d", x + 12, y + 9, width - 24, 15);
    rect("#c1915c", x + 20, y + height - 39, 12, 16);
    rect("#c1915c", x + width - 33, y + height - 39, 12, 16);
  }
  ctx.restore();
  if (cottage) drawHouseDoor(COTTAGE.door.x, COTTAGE.door.y + 2, 0);
}

function drawCottageCutaway(time) {
  const { left, top, right, bottom, door } = COTTAGE;
  const floorTop = (top + 1) * TILE;
  const floorWidth = (right - left - 1) * TILE;
  const centerX = (left + right + 1) * TILE / 2;
  rect("#403631", left * TILE, top * TILE + 8, (right - left + 1) * TILE, (bottom - top + 1) * TILE - 8);
  rect("#262623", left * TILE + 3, top * TILE + 11, (right - left + 1) * TILE - 6, (bottom - top + 1) * TILE - 14);
  for (let row = top + 1; row <= bottom; row++) {
    for (let col = left + 1; col < right; col++) {
      if (worldTile(col, row) === "H") continue;
      const x = col * TILE;
      const y = row * TILE;
      const variant = terrainVariant(col, row, 4);
      if (!drawPng("houseFloor", x + TILE / 2, y + TILE / 2, variant)) drawPlanks(x, y, variant);
    }
  }
  if (!drawPng("houseWall", centerX, floorTop - 11, 0, 0, 1, floorWidth, 22)) {
    rect("#815039", centerX - floorWidth / 2, floorTop - 23, floorWidth, 21);
    rect("#d48655", centerX - 9, floorTop - 14, 18, 9);
  }
  drawPng("rug", centerX, floorTop + TILE * 1.45, 0, 0, 1, 55, 30);
  drawHouseDoor(door.x, door.y, 1);
  drawLight(centerX, floorTop + 1, 47 + Math.sin(time * 6) * 2, "#eac68e45");
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

function drawLight(x, y, radius, color) {
  const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
  light.addColorStop(0, color);
  light.addColorStop(1, "#f5aa5000");
  rect(light, x - radius, y - radius, radius * 2, radius * 2);
}

function drawWorldLantern(x, y, isRuin, time) {
  const stem = isRuin ? "#5a5750" : "#675041";
  const rim = "#332e30";
  const pulse = Math.sin(time * 7 + x / 9) > 0.4;
  rect("#222b2b77", x - 5, y + 1, 14, 3);
  rect(stem, x - 2, y - 11, 4, 15);
  rect("#a57d54", x - 2, y - 7, 1, 9);
  rect(rim, x - 5, y - 21, 10, 11);
  rect("#8f5d4b", x - 4, y - 20, 8, 1);
  rect(pulse ? "#ffc978" : "#e6a96a", x - 3, y - 18, 6, 6);
  rect("#fff0af", x - 2, y - 17, 3, 3);
  rect(rim, x - 6, y - 10, 12, 2);
}

function drawWorldTree(col, row, x, y, zone) {
  const spent = exhausted(LEGACY_RESOURCES.Y, col, row);
  const frame = terrainVariant(col, row, 3);
  const size = zone === "forest" ? 1.17 : 1;
  ctx.save();
  if (!spent && zone === "forest") ctx.globalAlpha = 0.83;
  const drawn = spent ? drawPng("stump", x + 16, y + 24, 0, 0, 1, 18, 8) :
    drawPng("trees", x + 16, y + 12, frame, 0, frame === 2 ? -1 : 1, 38 * size, 34 * size);
  if (!drawn) sprite(spent ? "stump" : "tree", x + 16, y + 21);
  ctx.restore();
}

function collectWorldScenery(time, add) {
  const { left, right, top, bottom } = visibleTileBounds(50);
  const cutaway = insideCottage(player);
  for (let row = top; row < bottom; row++) {
    for (let col = left; col < right; col++) {
      const tile = worldTile(col, row);
      const x = col * TILE;
      const y = row * TILE;
      const variant = terrainVariant(col, row, 4);
      const building = progress.buildings[tileId(col, row)];
      if (building === "floor" && pointInView(x + 16, y + 16, 16)) drawPlanks(x, y, variant);
      if (tile === "Y") {
        const zone = regionAt({ x: x + 16, y: y + 16 });
        add(y + 27, () => drawWorldTree(col, row, x, y, zone));
      }
      if (tile === "D" || tile === "S") add(y + 12, () => {
        for (let i = 0; i < 5; i++) {
          rect("#392f2e", x + 6, y + 4 + i * 5, 20, 4);
          rect("#ad8c62", x + 6, y + 4 + i * 5, 20, 1);
        }
      });
      if (tile === "Q") add(y + 28, () => drawRock(x, y, variant));
      if (tile === "G" || tile === "X") add(y + 16, () => drawRuinGate(tile, x, y));
      if (tile === "L" || tile === "T") {
        drawLight(x + 16, y + 8, 39 + Math.sin(time * 6 + col) * 2, "#e9a96645");
        add(y + 26, () => drawWorldLantern(x + 16, y + 26, tile === "T", time));
      }
      if (building === "fence") add(y + 25, () => sprite("fence", x + 16, y + 19));
      if (building === "torch") add(y + 25, () => drawBuiltTorch(x + 16, y + 16));
    }
  }

  for (const hut of [...VILLAGE_HUTS, ...TOWER_LANDMARKS]) {
    if (buildingInView(hut)) add((hut.bottom + 1) * TILE, () => {
      drawBuildingExterior(hut);
      if (hut.door) {
        drawHouseDoor(hut.door.x, hut.door.y, 0);
        ctx.fillStyle = "#efca92";
        ctx.font = "8px Georgia";
        ctx.textAlign = "center";
        ctx.fillText(hut.name, hut.door.x, hut.top * TILE + 5);
      }
    });
  }
  if (buildingInView(COTTAGE)) {
    const { door, workbench, chest, bed } = COTTAGE;
    drawPng("porch", door.x - 15, door.y + 25);
    if (cutaway) {
      drawCottageCutaway(time);
      for (const [point, name] of [[workbench, "workbench"], [chest, "chest"], [bed, "bed"]]) {
        add(point.y + 8, () => drawFurniture(name, point.x - 16, point.y - 16));
      }
    } else {
      drawLight(door.x, door.y + 22, 48, "#e1ae6555");
      add((COTTAGE.bottom + 1) * TILE, () => drawBuildingExterior(COTTAGE, true));
    }
  }

  for (const [id, { position }] of Object.entries(CHEST_STATIONS)) {
    if (id !== "house" && pointInView(position.x, position.y, TILE)) {
      add(position.y + 10, () => drawDungeonChest(id, position.x - 16, position.y - 16));
    }
  }
}

function drawBuildPreview() {
  if (inventoryOpen() || !selectedBuildItem() || regionAt(player) !== "village") return;
  const site = buildSite();
  const x = site.x * TILE;
  const y = site.y * TILE;
  rect(site.allowed ? "#89df8d66" : "#f4777466", x + 1, y + 1, 30, 30);
  ctx.strokeStyle = site.allowed ? "#a2f5a5" : "#ff9390";
  ctx.strokeRect(x + 1.5, y + 1.5, 29, 29);
}

function drawWorldActor(actor, time) {
  rect("#1d1926aa", Math.round(actor.x - 9), Math.round(actor.y + 4), 18, 4);
  if (actor === player) {
    if (protection > 0 && Math.floor(time * 18) % 2) return;
    const { row, column } = knightFrame();
    drawKnight(actor.x, actor.y, row, column);
  } else if (actor === dragon) {
    drawDragon(actor.x, actor.y, actor.facing, time);
  } else if (actor.kind === "warden") {
    drawWarden(actor);
  } else {
    drawEnemy(actor, time);
  }
}

function draw(time) {
  drawKnightPreview();
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  drawTerrain(time);
  const entries = [];
  const add = (y, paint) => entries.push({ y, paint });
  collectWorldScenery(time, add);
  drawBuildPreview();
  const warden = enemies.find(enemy => enemy.kind === "warden" && enemy.zone === region && enemy.health > 0);
  if (warden && pointInView(warden.x, warden.y, TILE * 5)) drawWardenTelegraph(warden);
  const bob = Math.round(Math.sin(time * 4) * 2);
  if (key && !hasKey && pointInView(key.x, key.y, TILE)) sprite("key", key.x, key.y + bob);
  if (potion && pointInView(potion.x, potion.y, TILE)) sprite("potion", potion.x, potion.y);
  for (const drop of groundLoot) {
    if (pointInView(drop.x, drop.y, TILE)) sprite(drop.item, drop.x, drop.y + bob);
  }
  for (const actor of [player, dragon, ...enemies]) {
    if (pointInView(actor.x, actor.y, TILE)) add(actor.y, () => drawWorldActor(actor, time));
  }
  entries.sort((a, b) => a.y - b.y);
  for (const entry of entries) entry.paint();
  if (swing) drawSwing();
  for (const ball of fireballs) {
    if (pointInView(ball.x, ball.y, TILE)) sprite("fireball", ball.x, ball.y - 2);
  }
  ctx.restore();
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
