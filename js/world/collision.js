"use strict";

const SOLID_TILES = new Set("#~YQHBWOC");

function worldTile(x, y) {
  const floor = towerFloorAt({ y: y * TILE });
  if (y === 36 && (x === 27 || x === 28)) return "=";
  if (!floor && TOWER_CONNECTIONS.some(([from, arrival]) => towerFloorAt(from) &&
      arrival.x === (x + 0.5) * TILE && arrival.y === (y + 0.5) * TILE)) return "=";
  if (floor) return floor.rows[y - floor.top]?.[x];
  if (TOWER_LANDMARKS.some(hut => inTileBounds(x, y, hut))) {
    return TOWER_LANDMARKS.some(hut => hut.door.x === worldCenter(x,y).x && hut.door.y === worldCenter(x,y).y) ? "D" : "H";
  }
  return towerTrail(x, y) ? "=" : WORLD_MAP[y]?.[x];
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
  const floor = towerFloorAt(point);
  const rows = floor?.rows ?? WORLD_MAP;
  const top = floor?.top ?? 0;
  let closest;
  let nearest = Infinity;
  for (let y = top + 1; y < top + rows.length - 1; y++) {
    for (let x = 1; x < rows[0].length - 1; x++) {
      const position = worldCenter(x, y);
      const gap = distance(point, position);
      if (gap >= nearest || (zone && regionAt(position) !== zone) || blocked(position.x, position.y, 8, true, state)) continue;
      nearest = gap;
      closest = position;
    }
  }
  return closest || { ...COTTAGE.spawn };
}
