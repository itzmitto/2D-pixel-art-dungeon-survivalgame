"use strict";

const VIEW_WIDTH = 240;
const VIEW_HEIGHT = 160;
const camera = { x: 0, y: 0, followX: 0, followY: 0 };
const cameraWorld = {
  tileSize: TILE, viewWidth: VIEW_WIDTH, viewHeight: VIEW_HEIGHT,
  worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT, floorAt: towerFloorAt,
};

function snapCamera() {
  services.camera.snapCamera(camera, player, cameraWorld);
}

function updateCamera(dt) {
  services.camera.updateCamera(camera, player, dt, cameraWorld);
}

function visibleTileBounds(padding = 0) {
  return services.camera.visibleTileBounds(camera, player, cameraWorld, padding);
}

function pointInView(x, y, padding = 0) {
  return services.camera.pointInView(camera, { x, y }, cameraWorld, padding);
}
