import type { EnemyKind, Vec2 } from './world';
import type { ItemId } from './items';

export interface EnemyDefinition {
  readonly health: number;
  readonly speed: number;
  readonly reach: number;
  readonly sight: number;
  readonly damage: number;
  readonly rushSpeed?: number;
  readonly radius?: number;
}

export interface EnemyDropDefinition {
  readonly item: ItemId;
  readonly count: number;
}

export interface Combatant extends Vec2 {
  readonly id: string;
  readonly kind: EnemyKind;
  health: number;
  readonly radius: number;
  flash: number;
}

export interface Projectile extends Vec2 {
  vx: number;
  vy: number;
  life: number;
  readonly damage: number;
}
