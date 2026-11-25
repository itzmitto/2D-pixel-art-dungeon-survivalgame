export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export type RegionId = 'village' | 'cottage' | 'river' | 'forest' | 'ruins' | 'undercroft' | 'arena' | 'watch' | 'watchTop' | 'fen';
export type EnemyKind = 'wolf' | 'snake' | 'warden';

export interface EnemySpawn extends Vec2 {
  readonly id: string;
  readonly kind: EnemyKind;
  readonly zone: RegionId;
  readonly veteran: boolean;
}

export interface CameraState {
  x: number;
  y: number;
  followX: number;
  followY: number;
}

export interface TowerFloorGeometry {
  readonly top: number;
  readonly rows: readonly string[];
}

export interface CameraWorld {
  readonly tileSize: number;
  readonly viewWidth: number;
  readonly viewHeight: number;
  readonly worldWidth: number;
  readonly worldHeight: number;
  floorAt(position: Vec2): TowerFloorGeometry | undefined;
}

export interface TileBounds {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}
