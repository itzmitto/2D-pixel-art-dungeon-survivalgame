"use strict";

const PNG_SPRITES = {
  knight: { path: "./images/characters/knight-walk.png", width: 40, height: 40, columns: 6, rows: 4 },
  dragon: { path: "./images/pets/vonkje-fly.png", width: 80, height: 64, columns: 4, rows: 1 },
  wolf: { path: "./images/enemies/shadow-wolf.png", width: 42, height: 32, columns: 4, rows: 1 },
  snake: { path: "./images/enemies/cave-serpent.png", width: 42, height: 32, columns: 4, rows: 1 },
  workbench: { path: "./images/objects/workbench.png", width: 32, height: 32, columns: 1, rows: 1 },
  chest: { path: "./images/objects/chest.png", width: 32, height: 32, columns: 1, rows: 1 },
  bed: { path: "./images/objects/bed.png", width: 32, height: 32, columns: 1, rows: 1 },
  torch: { path: "./images/objects/torch.png", width: 32, height: 32, columns: 1, rows: 1 },
  cottage: { path: "./images/house/cottage.png", width: 128, height: 96, columns: 1, rows: 1 },
  houseDoor: { path: "./images/house/doors.png", width: 32, height: 32, columns: 3, rows: 1 },
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

function knightFrame() {
  const row = facingTile.y > 0 ? 0 : facingTile.x < 0 ? 1 : facingTile.x > 0 ? 2 : 3;
  const walking = player.walking && !inventoryPausesWorld() && phase === "playing";
  const column = walking ? Math.floor(player.walkTime * 10) % PNG_SPRITES.knight.columns : 0;
  return { row, column };
}

function dragonFrame(time) {
  return Math.floor(time * 8) % PNG_SPRITES.dragon.columns;
}
