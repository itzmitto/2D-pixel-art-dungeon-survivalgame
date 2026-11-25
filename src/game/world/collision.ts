import type { TowerFloorGeometry, Vec2 } from '../types/world.ts';

export interface CollisionActor extends Vec2 {
  x: number;
  y: number;
  readonly radius: number;
  readonly zone?: string;
}

export interface CollisionWorld<State> {
  readonly tileSize: number;
  readonly mapRows: readonly string[];
  readonly solidTiles: ReadonlySet<string>;
  readonly fallbackSpawn: Vec2;
  tileAt(column: number, row: number): string | undefined;
  floorAt(position: Vec2): TowerFloorGeometry | undefined;
  regionAt(position: Vec2): string;
  gateUnlocked(tile: 'G' | 'X', state: State): boolean;
  fenceAt(column: number, row: number, state: State): boolean;
  worldCenter(column: number, row: number): Vec2;
  distance(left: Vec2, right: Vec2): number;
}

export function isBlocked<State>(
  point: Vec2,
  radius: number,
  state: State,
  world: CollisionWorld<State>,
  canUseGates = true,
): boolean {
  const { tileSize, solidTiles } = world;
  for (const edgeY of [point.y - radius, point.y + radius]) {
    for (const edgeX of [point.x - radius, point.x + radius]) {
      const column = Math.floor(edgeX / tileSize);
      const row = Math.floor(edgeY / tileSize);
      const tile = world.tileAt(column, row);
      if (!tile || solidTiles.has(tile) || world.fenceAt(column, row, state)) return true;
      if ((tile === 'G' || tile === 'X') && (!canUseGates || !world.gateUnlocked(tile, state))) return true;
    }
  }
  return false;
}

export function moveActor<State>(
  actor: CollisionActor,
  delta: Vec2,
  state: State,
  world: CollisionWorld<State>,
  canUseGates = true,
): Vec2 {
  const moved = { x: actor.x, y: actor.y };
  const canOccupy = (candidate: Vec2): boolean =>
    (!actor.zone || world.regionAt(candidate) === actor.zone) &&
    !isBlocked(candidate, actor.radius, state, world, canUseGates);
  const horizontal = { x: moved.x + delta.x, y: moved.y };
  if (canOccupy(horizontal)) moved.x = horizontal.x;
  const vertical = { x: moved.x, y: moved.y + delta.y };
  if (canOccupy(vertical)) moved.y = vertical.y;
  actor.x = moved.x;
  actor.y = moved.y;
  return moved;
}

export function nearestWalkablePoint<State>(
  point: Vec2,
  state: State,
  world: CollisionWorld<State>,
  zone?: string,
  radius = 8,
): Vec2 {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return { ...world.fallbackSpawn };
  if ((!zone || world.regionAt(point) === zone) && !isBlocked(point, radius, state, world)) {
    return { x: point.x, y: point.y };
  }

  const floor = world.floorAt(point);
  const rows = floor?.rows ?? world.mapRows;
  const top = floor?.top ?? 0;
  let best: Vec2 | undefined;
  let nearest = Number.POSITIVE_INFINITY;
  for (let row = top + 1; row < top + rows.length - 1; row++) {
    const width = rows[row - top]?.length ?? 0;
    for (let column = 1; column < width - 1; column++) {
      const candidate = world.worldCenter(column, row);
      const gap = world.distance(point, candidate);
      if (gap >= nearest || (zone && world.regionAt(candidate) !== zone) || isBlocked(candidate, radius, state, world)) continue;
      nearest = gap;
      best = candidate;
    }
  }
  return best ?? { ...world.fallbackSpawn };
}
