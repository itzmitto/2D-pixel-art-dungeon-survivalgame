import type { CollisionWorld } from '../world/collision.ts';
import { isBlocked, nearestWalkablePoint } from '../world/collision.ts';
import type { Vec2 } from '../types/world.ts';

export interface PlayerState extends Vec2 {
  x: number;
  y: number;
  readonly radius: number;
  facing: 1 | -1;
  hearts: number;
  walkTime: number;
  walking: boolean;
}

export interface CompanionState extends Vec2 {
  x: number;
  y: number;
  facing: 1 | -1;
}

export interface TrailNode extends Vec2 {
  readonly time: number;
}

export interface PartyState {
  readonly player: PlayerState;
  readonly companion: CompanionState;
  readonly trail: TrailNode[];
}

export interface PartyConfig {
  readonly playerRadius: number;
  readonly companionRadius: number;
  readonly followDistance: number;
  readonly followDelay: number;
}

export const DEFAULT_PARTY_CONFIG: PartyConfig = {
  playerRadius: 8,
  companionRadius: 8,
  followDistance: 23,
  followDelay: 0.28,
};

const COMPANION_SPAWN_OFFSETS: readonly Vec2[] = [
  { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 },
];

export function createParty<State>(
  requestedSpawn: Vec2,
  health: number,
  time: number,
  savedState: State,
  collisionWorld: CollisionWorld<State>,
  config: PartyConfig = DEFAULT_PARTY_CONFIG,
): PartyState {
  const spawn = nearestWalkablePoint(requestedSpawn, savedState, collisionWorld, undefined, config.playerRadius);
  const companionSpawn = COMPANION_SPAWN_OFFSETS
    .map(({ x, y }) => ({ x: spawn.x + x * config.followDistance, y: spawn.y + y * config.followDistance }))
    .find((point) => !isBlocked(point, config.companionRadius, savedState, collisionWorld)) ?? spawn;
  const player: PlayerState = {
    ...spawn, radius: config.playerRadius, facing: 1, hearts: health, walkTime: 0, walking: false,
  };
  const companion: CompanionState = { ...companionSpawn, facing: 1 };
  return {
    player,
    companion,
    trail: [{ ...companion, time }, { ...spawn, time }],
  };
}

export function updateCompanionFollow(
  player: Vec2,
  companion: CompanionState,
  trail: TrailNode[],
  elapsedSeconds: number,
  deltaSeconds: number,
  sprinting: boolean,
  config: PartyConfig = DEFAULT_PARTY_CONFIG,
): void {
  const lastTrail = trail.at(-1);
  if (!lastTrail || distance(player, lastTrail) > 0) {
    trail.push({ x: player.x, y: player.y, time: elapsedSeconds });
  }
  let remaining = (sprinting ? 250 : 125) * Math.max(0, deltaSeconds);
  while (remaining > 0 && trail[0] && trail[0].time <= elapsedSeconds - config.followDelay) {
    const target = trail[0];
    const gap = distance(companion, target);
    if (gap < 0.001) {
      if (trail.length === 1) break;
      trail.shift();
      continue;
    }
    const step = Math.min(gap, remaining, distance(player, companion) - config.followDistance);
    if (step < 0.001) break;
    const dx = target.x - companion.x;
    companion.x += dx * step / gap;
    companion.y += (target.y - companion.y) * step / gap;
    if (dx) companion.facing = dx < 0 ? -1 : 1;
    remaining -= step;
  }
}

function distance(left: Vec2, right: Vec2): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}
