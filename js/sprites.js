"use strict";

const PNG_SPRITES = {
  knight: { path: "./images/characters/knight-walk.png", width: 40, height: 40, columns: 6, rows: 4 },
  dragon: { path: "./images/pets/vonkje-fly.png", width: 40, height: 32, columns: 4, rows: 1 },
  workbench: { path: "./images/objects/workbench.png", width: 32, height: 32, columns: 1, rows: 1 },
  chest: { path: "./images/objects/chest.png", width: 32, height: 32, columns: 1, rows: 1 },
  torch: { path: "./images/objects/torch.png", width: 32, height: 32, columns: 1, rows: 1 },
};

for (const sheet of Object.values(PNG_SPRITES)) {
  const image = new Image();
  image.onload = () => {
    if (image.naturalWidth === sheet.width * sheet.columns &&
        image.naturalHeight === sheet.height * sheet.rows) sheet.image = image;
  };
  image.src = sheet.path;
}

function drawPng(name, x, y, frame = 0, row = 0, facing = 1, drawWidth, drawHeight) {
  const { image, width, height } = PNG_SPRITES[name];
  if (!image) return false;
  const w = drawWidth ?? width;
  const h = drawHeight ?? height;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x - w / 2) + (facing < 0 ? w : 0), Math.round(y - h / 2));
  ctx.scale(facing, 1);
  ctx.drawImage(image, frame * width, row * height, width, height, 0, 0, w, h);
  ctx.restore();
  return true;
}

function knightFrame() {
  const row = facingTile.y > 0 ? 0 : facingTile.x < 0 ? 1 : facingTile.x > 0 ? 2 : 3;
  const walking = player.walking && !inventoryOpen() && phase === "playing";
  const column = walking ? Math.floor(player.walkTime * 10) % PNG_SPRITES.knight.columns : 0;
  return { row, column };
}

function dragonFrame(time) {
  return Math.floor(time * 8) % PNG_SPRITES.dragon.columns;
}
