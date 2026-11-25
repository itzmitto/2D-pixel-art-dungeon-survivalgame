"use strict";

function terrainVariant(col, row, variations) {
  return (col * 29 + row * 17 + col * row) % variations;
}

function paintGrass(col, row, x, y, zone) {
  const variant = terrainVariant(col, row, 8);
  if (!drawTerrainTile("grass", x, y, variant)) {
    rect(["#435b3d", "#3f573a", "#405941", "#485d3f"][variant % 4], x, y, TILE, TILE);
    for (let blade = 0; blade < 5; blade++) {
      const dx = 3 + (variant * 7 + blade * 11) % 25;
      const dy = 3 + (col * 3 + row * 7 + blade * 9) % 25;
      rect("#566f44", x + dx, y + dy, 1, 3);
      rect("#334e39", x + dx - 1, y + dy + 2, 4, 1);
    }
  }
  const shade = zone === "village" || zone === "cottage" ? "#38433558" :
    zone === "forest" ? "#142b33a3" : "#24313082";
  rect(shade, x, y, TILE, TILE);
}

function paintDirtPath(col, row, x, y, variant) {
  const joins = (dx, dy) => "=:U+%GX".includes(worldTile(col + dx, row + dy) || " ");
  const earth = "#75654f";
  rect("#4a473a", x + 3, y + 3, 26, 26);
  rect(earth, x + 5, y + 5, 22, 22);
  if (joins(-1, 0)) rect(earth, x, y + 5, 6, 22);
  if (joins(1, 0)) rect(earth, x + 26, y + 5, 6, 22);
  if (joins(0, -1)) rect(earth, x + 5, y, 22, 6);
  if (joins(0, 1)) rect(earth, x + 5, y + 26, 22, 6);
  rect("#96826a", x + 6 + variant * 4, y + 10, 5, 1);
  rect("#625442", x + 11, y + 21 - variant, 6, 2);
  rect("#a19576", x + 19, y + 14, 2, 2);
}

function paintCobble(x, y, variant, bridge = false) {
  rect(bridge ? "#303b3a" : "#45433b", x, y, TILE, TILE);
  const stones = bridge ? ["#5f6b65", "#626d69", "#71817a", "#57716b"] :
    ["#666050", "#736b57", "#6a6758", "#77725f"];
  for (let course = 0; course < 4; course++) {
    for (let column = -1; column < 4; column++) {
      const start = column * 9 + (course % 2) * 4;
      const end = Math.min(start + 8, TILE);
      const left = Math.max(0, start);
      if (end <= left) continue;
      const top = y + course * 8;
      const tone = (variant + course * 3 + column + stones.length) % stones.length;
      rect(stones[tone], x + left, top + 1, end - left, 6);
      rect(bridge ? "#94a093" : "#8f8369", x + left, top + 1, end - left, 1);
    }
  }
  if (variant % 3 === 0) rect(bridge ? "#3d5043" : "#65664b", x + 12, y + 14, 4, 2);
}

function paintRiver(col, row, x, y, time) {
  rect("#1e3840", x, y, TILE, TILE);
  const seed = terrainVariant(col, row, 19);
  for (let ripple = 0; ripple < 4; ripple++) {
    const phase = Math.floor(time * (ripple % 2 ? 5 : 8));
    const offset = (seed * 3 + ripple * 17 + phase) % 28;
    const rowY = y + 3 + (seed + ripple * 7) % 25;
    const width = Math.min(4 + (seed + ripple * 5) % 10, TILE - offset);
    rect(ripple % 3 === 0 ? "#497076" : "#36565e", x + offset, rowY, width, 1);
    if (width > 5) rect("#29474f", x + offset + 1, rowY + 1, width - 2, 1);
  }
  const shoreline = tile => tile && !"~+".includes(tile);
  if (shoreline(worldTile(col - 1, row))) {
    rect("#344943", x, y, 4, TILE);
    rect("#667360", x, y + seed % 13 + 5, 2, 7);
    rect("#83866a", x + 2, y + seed % 9 + 15, 2, 3);
  }
  if (shoreline(worldTile(col + 1, row))) {
    rect("#344943", x + TILE - 4, y, 4, TILE);
    rect("#667360", x + TILE - 3, y + seed % 13 + 6, 3, 7);
    rect("#83866a", x + TILE - 4, y + seed % 9 + 14, 2, 3);
  }
  if (shoreline(worldTile(col, row - 1))) rect("#344943", x, y, TILE, 3);
  if (shoreline(worldTile(col, row + 1))) rect("#344943", x, y + TILE - 3, TILE, 3);
}

function paintBridge(col, row, x, y, variant) {
  paintCobble(x, y, variant, true);
  if (worldTile(col, row - 1) === "~") {
    rect("#354747", x, y, TILE, 5);
    rect("#819184", x, y, TILE, 2);
    rect("#9da294", x + 2, y, 4, 3);
    rect("#9da294", x + 25, y, 4, 3);
  }
  if (worldTile(col, row + 1) === "~") {
    rect("#3b4b4b", x, y + 26, TILE, 6);
    rect("#6b8176", x, y + 26, TILE, 2);
    rect("#91a093", x + 3, y + 25, 4, 4);
    rect("#91a093", x + 25, y + 25, 4, 4);
  }
}

function paintRuinTile(x, y, variant, zone, wall) {
  if (!drawTerrainTile("dungeonStone", x, y, variant + (wall ? 4 : 0))) {
    rect(wall ? "#555750" : "#363d3d", x, y, TILE, TILE);
    for (let course = 0; course < 4; course++) {
      rect(wall ? "#383b37" : "#303635", x, y + course * 8, TILE, 1);
      const offset = 6 + (variant * 7 + course * 9) % 18;
      rect(wall ? "#40443c" : "#303635", x + offset, y + course * 8, 1, 7);
    }
  }
  const tint = zone === "arena" ? "#543a2c61" : zone === "undercroft" ? "#232a334b" : "#303e2d61";
  rect(tint, x, y, TILE, TILE);
  if (zone === "ruins" || wall) {
    rect(wall ? "#566748" : "#44513d", x + 2 + variant * 6, y + 22, 7, 2);
    rect("#526044", x + 4 + variant * 6, y + 20, 4, 2);
    if (wall) {
      rect("#69795a", x + 4 + variant * 6, y + 19, 5, 1);
      rect("#242e29", x, y + 31, TILE, 1);
    }
  }
}

function paintArenaInlay(x, y, variant) {
  rect("#4e463b", x, y, TILE, 1);
  rect("#4e463b", x, y, 1, TILE);
  if (variant % 2 === 0) {
    rect("#514b40", x + 15, y + 12, 2, 8);
    rect("#514b40", x + 12, y + 15, 8, 2);
  }
}

function drawTerrain(time) {
  const { left, right, top, bottom } = visibleTileBounds();
  for (let row = top; row < bottom; row++) {
    for (let col = left; col < right; col++) {
      const tile = worldTile(col, row);
      const x = col * TILE;
      const y = row * TILE;
      const variant = terrainVariant(col, row, 4);
      if (tile === "~") {
        paintRiver(col, row, x, y, time);
      } else if (tile === "+") {
        paintBridge(col, row, x, y, variant);
      } else if (tile === ":") {
        paintCobble(x, y, variant);
      } else {
        const zone = regionAt({ x: x + TILE / 2, y: y + TILE / 2 });
        if ("#%TCKVGXDS".includes(tile)) {
          paintRuinTile(x, y, variant, zone, tile === "#");
          if (zone === "arena" && tile === "%") paintArenaInlay(x, y, variant);
          continue;
        }
        paintGrass(col, row, x, y, zone);
        if (tile === "=") paintDirtPath(col, row, x, y, variant);
      }
    }
  }
}
