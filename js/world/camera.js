"use strict";

const VIEW_WIDTH = 480;
const VIEW_HEIGHT = 320;
const camera = { x: 0, y: 0 };
let cameraFollowX = 0;
let cameraFollowY = 0;

function cameraTarget(position) {
  return {
    x: Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, position.x - VIEW_WIDTH / 2)),
    y: Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT, position.y - VIEW_HEIGHT / 2)),
  };
}

function snapCamera() {
  const target = cameraTarget(player);
  camera.x = cameraFollowX = target.x;
  camera.y = cameraFollowY = target.y;
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
