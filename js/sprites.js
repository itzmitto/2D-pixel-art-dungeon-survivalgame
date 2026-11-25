"use strict";

const PNG_SPRITES = {
  knight: { path: "./images/characters/knight-walk.png", width: 40, height: 40, columns: 6, rows: 4 },
  dragon: { path: "./images/pets/vonkje-flight.png", width: 256, height: 204, columns: 4, rows: 1 },
  wolf: { path: "./images/enemies/shadow-wolf.png", width: 134, height: 102, columns: 5, rows: 1 },
  snake: { path: "./images/enemies/cave-serpent.png", width: 134, height: 102, columns: 5, rows: 1 },
  warden: { path: "./images/third-party/superpowers-medieval-fantasy/cyclop.png", width: 32, height: 16, columns: 1, rows: 1 },
  supplyClosed: { path: "./images/third-party/superpowers-medieval-fantasy/wood-chest-close.png", width: 10, height: 8, columns: 1, rows: 1 },
  supplyOpen: { path: "./images/third-party/superpowers-medieval-fantasy/wood-chest-open.png", width: 10, height: 13, columns: 1, rows: 1 },
  rewardClosed: { path: "./images/third-party/superpowers-medieval-fantasy/gold-chest-close.png", width: 12, height: 9, columns: 1, rows: 1 },
  rewardOpen: { path: "./images/third-party/superpowers-medieval-fantasy/gold-chest-open.png", width: 12, height: 14, columns: 1, rows: 1 },
  grass: { path: "./images/terrain/grass.png", width: 102, height: 102, columns: 8, rows: 1 },
  trees: { path: "./images/terrain/trees.png", width: 40, height: 36, columns: 3, rows: 1 },
  stump: { path: "./images/terrain/stump.png", width: 29, height: 13, columns: 1, rows: 1 },
  rocks: { path: "./images/terrain/rocks.png", width: 102, height: 102, columns: 5, rows: 1 },
  dungeonStone: { path: "./images/terrain/dungeon.png", width: 102, height: 102, columns: 8, rows: 1 },
  workbench: { path: "./images/objects/workbench.png", width: 32, height: 32, columns: 1, rows: 1 },
  chest: { path: "./images/objects/chest.png", width: 32, height: 32, columns: 1, rows: 1 },
  bed: { path: "./images/objects/bed.png", width: 32, height: 32, columns: 1, rows: 1 },
  torch: { path: "./images/objects/torch.png", width: 32, height: 32, columns: 1, rows: 1 },
  cottage: { path: "./images/house/cottage.png", width: 128, height: 96, columns: 1, rows: 1 },
  houseDoor: { path: "./images/house/doors.png", width: 32, height: 32, columns: 2, rows: 1 },
  porch: { path: "./images/house/porch.png", width: 64, height: 32, columns: 1, rows: 1 },
  houseWall: { path: "./images/house/interior-wall.png", width: 352, height: 48, columns: 1, rows: 1 },
  houseFloor: { path: "./images/house/interior-floor.png", width: 32, height: 32, columns: 4, rows: 1 },
  rug: { path: "./images/house/rug.png", width: 114, height: 62, columns: 1, rows: 1 },
};

for (const sheet of Object.values(PNG_SPRITES)) {
  const image = new Image();
  image.onload = () => {
    if (image.naturalWidth === sheet.width * sheet.columns &&
        image.naturalHeight === sheet.height * sheet.rows) sheet.image = image;
  };
  image.src = sheet.path;
}

function drawPng(name, x, y, frame = 0, row = 0, facing = 1, drawWidth, drawHeight, context = ctx) {
  const { image, width, height } = PNG_SPRITES[name];
  if (!image) return false;
  const w = drawWidth ?? width;
  const h = drawHeight ?? height;
  context.save();
  context.imageSmoothingEnabled = false;
  context.translate(Math.round(x - w / 2) + (facing < 0 ? w : 0), Math.round(y - h / 2));
  context.scale(facing, 1);
  context.drawImage(image, frame * width, row * height, width, height, 0, 0, w, h);
  context.restore();
  return true;
}

function drawTerrainTile(name, x, y, variant) {
  const { image, width, height } = PNG_SPRITES[name];
  if (!image) return false;
  ctx.drawImage(image, variant * width, 0, width, height, x, y, TILE, TILE);
  return true;
}

function knightFrame() {
  const row = facingTile.y > 0 ? 0 : facingTile.x < 0 ? 1 : facingTile.x > 0 ? 2 : 3;
  const walking = player.walking && !inventoryPausesWorld() && phase === "playing";
  const column = walking ? Math.floor(player.walkTime * 10) % PNG_SPRITES.knight.columns : 0;
  return { row, column };
}

function dragonFrame(time) {
  return Math.floor(time * 8) % PNG_SPRITES.dragon.columns;
}
