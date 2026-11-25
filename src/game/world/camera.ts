import type { CameraState, CameraWorld, TileBounds, Vec2 } from '../types/world.ts';

const FOLLOW_RATE = 12;
const LOWER_THIRD_ANCHOR = 0.69;

export function createCamera(position: Vec2, world: CameraWorld): CameraState {
  const target = cameraTarget(position, world);
  return { ...target, followX: target.x, followY: target.y };
}

export function cameraTarget(position: Vec2, world: CameraWorld): Vec2 {
  const floor = world.floorAt(position);
  if (floor) {
    const width = floor.rows[0]?.length ?? 0;
    const height = floor.rows.length;
    return {
      x: clamp(position.x - world.viewWidth / 2, 0, Math.max(0, width * world.tileSize - world.viewWidth)),
      y: clamp(
        position.y - world.viewHeight * LOWER_THIRD_ANCHOR,
        floor.top * world.tileSize,
        Math.max(floor.top * world.tileSize, (floor.top + height) * world.tileSize - world.viewHeight),
      ),
    };
  }
  return {
    x: clamp(position.x - world.viewWidth / 2, 0, Math.max(0, world.worldWidth - world.viewWidth)),
    y: clamp(
      position.y - world.viewHeight * LOWER_THIRD_ANCHOR,
      0,
      Math.max(0, world.worldHeight - world.viewHeight),
    ),
  };
}

export function snapCamera(state: CameraState, position: Vec2, world: CameraWorld): void {
  const target = cameraTarget(position, world);
  state.followX = target.x;
  state.followY = target.y;
  state.x = Math.round(target.x);
  state.y = Math.round(target.y);
}

export function updateCamera(state: CameraState, position: Vec2, elapsedSeconds: number, world: CameraWorld): void {
  const target = cameraTarget(position, world);
  const dt = Math.max(0, Math.min(elapsedSeconds, 0.25));
  const amount = 1 - Math.exp(-FOLLOW_RATE * dt);
  state.followX += (target.x - state.followX) * amount;
  state.followY += (target.y - state.followY) * amount;
  state.x = Math.round(state.followX);
  state.y = Math.round(state.followY);
}

export function visibleTileBounds(
  state: CameraState,
  position: Vec2,
  world: CameraWorld,
  padding = 0,
): TileBounds {
  const floor = world.floorAt(position);
  const columns = floor?.rows[0]?.length ?? Math.ceil(world.worldWidth / world.tileSize);
  const rows = floor?.rows.length ?? Math.ceil(world.worldHeight / world.tileSize);
  const topEdge = floor?.top ?? 0;
  const bottomEdge = topEdge + rows;
  return {
    left: Math.max(0, Math.floor((state.x - padding) / world.tileSize)),
    right: Math.min(columns, Math.ceil((state.x + world.viewWidth + padding) / world.tileSize)),
    top: Math.max(topEdge, Math.floor((state.y - padding) / world.tileSize)),
    bottom: Math.min(bottomEdge, Math.ceil((state.y + world.viewHeight + padding) / world.tileSize)),
  };
}

export function pointInView(state: CameraState, point: Vec2, world: CameraWorld, padding = 0): boolean {
  return point.x >= state.x - padding && point.x < state.x + world.viewWidth + padding &&
    point.y >= state.y - padding && point.y < state.y + world.viewHeight + padding;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
