"use strict";

const VIEW_WIDTH = 240;
const VIEW_HEIGHT = 160;
const camera = { x: 0, y: 0 };
let cameraFollowX = 0;
let cameraFollowY = 0;

function cameraTarget(position) {
  const floor = towerFloorAt(position);
  if (floor) return {
    x: Math.max(0, Math.min(floor.rows[0].length * TILE - VIEW_WIDTH, position.x - VIEW_WIDTH / 2)),
    y: Math.max(floor.top * TILE, Math.min((floor.top + floor.rows.length) * TILE - VIEW_HEIGHT,
      position.y - VIEW_HEIGHT * 0.69)),
  };
  return {
    x: Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, position.x - VIEW_WIDTH / 2)),
    // Keep the knight in the lower third so the view follows from behind and exposes the trail ahead.
    y: Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT, position.y - VIEW_HEIGHT * 0.69)),
  };
}

function snapCamera() {
  const target = cameraTarget(player);
  cameraFollowX = target.x;
  cameraFollowY = target.y;
  camera.x = Math.round(cameraFollowX);
  camera.y = Math.round(cameraFollowY);
}

function updateCamera(dt) {
  const target = cameraTarget(player);
  const follow = 1 - Math.exp(-12 * dt);
  cameraFollowX += (target.x - cameraFollowX) * follow;
  cameraFollowY += (target.y - cameraFollowY) * follow;
  // Keep the world aligned to the pixel grid without discarding the fractional follow state.
  camera.x = Math.round(cameraFollowX);
  camera.y = Math.round(cameraFollowY);
}

function visibleTileBounds(padding = 0) {
  const floor = towerFloorAt(player);
  if (floor) return {
    left: Math.max(0, Math.floor((camera.x - padding) / TILE)),
    right: Math.min(floor.rows[0].length, Math.ceil((camera.x + VIEW_WIDTH + padding) / TILE)),
    top: Math.max(floor.top, Math.floor((camera.y - padding) / TILE)),
    bottom: Math.min(floor.top + floor.rows.length, Math.ceil((camera.y + VIEW_HEIGHT + padding) / TILE)),
  };
  return {
    left: Math.max(0, Math.floor((camera.x - padding) / TILE)),
    right: Math.min(WORLD_MAP[0].length, Math.ceil((camera.x + VIEW_WIDTH + padding) / TILE)),
    top: Math.max(0, Math.floor((camera.y - padding) / TILE)),
    bottom: Math.min(WORLD_MAP.length, Math.ceil((camera.y + VIEW_HEIGHT + padding) / TILE)),
  };
}

function pointInView(x, y, padding = 0) {
  return x >= camera.x - padding && x < camera.x + VIEW_WIDTH + padding &&
    y >= camera.y - padding && y < camera.y + VIEW_HEIGHT + padding;
}
