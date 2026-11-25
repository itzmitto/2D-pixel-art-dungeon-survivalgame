"use strict";

const SOLID_TILES = new Set("#~YQHBWOC");

function worldTile(x, y) {
  return WORLD_MAP[y]?.[x];
}

function gateOpen(tile, state = progress) {
  if (tile === "G") return state?.collected[DUNGEON_KEY] === true;
  if (tile === "X") return wardenDefeated(state);
  return true;
}

function blocked(x, y, radius, canUseGates = true, state = progress) {
  for (const edgeY of [y - radius, y + radius]) {
    for (const edgeX of [x - radius, x + radius]) {
      const col = Math.floor(edgeX / TILE);
      const row = Math.floor(edgeY / TILE);
      const tile = worldTile(col, row);
      if (!tile || SOLID_TILES.has(tile) || state?.buildings?.[tileId(col, row)] === "fence") return true;
      if ((tile === "G" || tile === "X") && (!canUseGates || !gateOpen(tile, state))) return true;
    }
  }
  return false;
}

function move(actor, dx, dy, canUseGates = true) {
  const walkable = (x, y) => (!actor.zone || regionAt({ x, y }) === actor.zone) &&
    !blocked(x, y, actor.radius, canUseGates);
  if (walkable(actor.x + dx, actor.y)) actor.x += dx;
  if (walkable(actor.x, actor.y + dy)) actor.y += dy;
}

function safeWorldPoint(point, state, zone) {
  const valid = point && Number.isFinite(point.x) && Number.isFinite(point.y);
  if (!valid) return { ...COTTAGE.spawn };
  if ((!zone || regionAt(point) === zone) && !blocked(point.x, point.y, 8, true, state)) return { x: point.x, y: point.y };
  let closest;
  let nearest = Infinity;
  for (let y = 1; y < WORLD_MAP.length - 1; y++) {
    for (let x = 1; x < WORLD_MAP[y].length - 1; x++) {
      const position = worldCenter(x, y);
      const gap = distance(point, position);
      if (gap >= nearest || (zone && regionAt(position) !== zone) || blocked(position.x, position.y, 8, true, state)) continue;
      nearest = gap;
      closest = position;
    }
  }
  return closest || { ...COTTAGE.spawn };
}
