import type { RegionId, TowerFloorGeometry, Vec2 } from '../types/world.ts';
import { TILE, WORLD_ROWS, ZONES, worldCenter } from './regions.ts';

export type TowerFloorId = 'watch' | 'watchTop' | 'fen';
export interface TowerFloor extends TowerFloorGeometry {
  readonly id: TowerFloorId;
  readonly name: string;
}
export interface TowerLandmark {
  readonly name: string;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly door: Vec2;
}
export interface TowerChest {
  readonly name: string;
  readonly position: Vec2;
  readonly arrival: Vec2;
  readonly loot: readonly (readonly [string, number])[];
  readonly boss?: string;
}
export type TowerConnection = readonly [entrance: Vec2, arrival: Vec2];

const FLOOR_LAYOUTS: readonly { id: TowerFloorId; name: string; rows: readonly string[] }[] = [
  { id: 'watch', name: 'Briar Watch · Lower floor', rows: [
    '###############', '#%%%%T%%%%%%%S#', '#%%%%#%%%%%#%%#', '#%%C%#%%%%%%%%#', '#%%%%####%%%%%#',
    '#%%%%%%%%%%%%%#', '#%%%%%#%%%%%%%#', '#%%%%%%%%%%T%%#', '#%D%%%%%%%%%%%#', '###############',
  ] },
  { id: 'watchTop', name: 'Briar Watch · Belfry', rows: [
    '###############', '#%%%%%%%%T%%C%#', '#%%%%%%%%%%%%%#', '#%%%%%%%%%%%%%#', '#%%%%%%%%%%%%%#',
    '#%%%%%%%%%%%%%#', '#%%%%%#%%%%%%%#', '#%%%%%%%%%%%%%#', '#%D%%%%%%%%%%%#', '###############',
  ] },
  { id: 'fen', name: 'Fen Spire · Cistern', rows: [
    '###############', '#%T%%%%%%C%%%%#', '#%##%~~~~~%##%#', '#%%%%~~~~~%%%%#', '#%%%%~~~~~%%%%#',
    '#%%%%%+++%%%%%#', '#%%%%~~~~~%%%%#', '#%##%~~~~~%##%#', '#%%%%%D%%%%%%%#', '###############',
  ] },
];

export const TOWER_FLOORS: readonly TowerFloor[] = FLOOR_LAYOUTS.map((floor, index) => ({
  ...floor,
  top: WORLD_ROWS + 4 + index * 14,
}));

for (const floor of TOWER_FLOORS) ZONES[floor.id] = floor.name;

export function towerFloorAt(position: Vec2): TowerFloor | undefined {
  const row = Math.floor(position.y / TILE);
  return TOWER_FLOORS.find((floor) => row >= floor.top && row < floor.top + floor.rows.length);
}

export function towerPoint(id: TowerFloorId, column: number, row: number): Vec2 {
  const floor = TOWER_FLOORS.find((entry) => entry.id === id);
  if (!floor) throw new Error(`Unknown tower floor: ${id}`);
  return worldCenter(column, floor.top + row);
}

export const TOWER_LANDMARKS: readonly TowerLandmark[] = [
  { name: 'Briar Watch', left: 80, right: 84, top: 4, bottom: 7, door: worldCenter(82, 7) },
  { name: 'Fen Spire', left: 7, right: 11, top: 53, bottom: 57, door: worldCenter(9, 57) },
];

const WATCH_DOOR = TOWER_LANDMARKS[0].door;
const FEN_DOOR = TOWER_LANDMARKS[1].door;
export const TOWER_CONNECTIONS: readonly TowerConnection[] = [
  [WATCH_DOOR, towerPoint('watch', 2, 7)],
  [towerPoint('watch', 2, 8), worldCenter(37, 7)],
  [towerPoint('watch', 13, 1), towerPoint('watchTop', 2, 7)],
  [towerPoint('watchTop', 2, 8), towerPoint('watch', 13, 2)],
  [FEN_DOOR, towerPoint('fen', 5, 8)],
  [towerPoint('fen', 6, 8), worldCenter(26, 36)],
];

export const TOWER_CHESTS: Readonly<Record<string, TowerChest>> = {
  watch: { name: 'Watch provisions', position: towerPoint('watch', 3, 3), arrival: towerPoint('watch', 3, 4),
    loot: [['wolfFang', 2], ['wood', 4], ['copper', 3], ['potion', 2], ['stoneSword', 1]] },
  watchTop: { name: "Bellkeeper's reward", position: towerPoint('watchTop', 12, 1), arrival: towerPoint('watchTop', 12, 2),
    loot: [], boss: 'watchTop:boss' },
  fen: { name: 'Cistern cache', position: towerPoint('fen', 9, 1), arrival: towerPoint('fen', 10, 1),
    loot: [['copperBoots', 1], ['serpentScale', 3], ['copper', 4], ['potion', 2]] },
};

export function towerTrail(column: number, row: number): boolean {
  return (column === 24 && row >= 16 && row <= 32) || (row === 32 && column >= 24 && column <= 26) ||
    (column === 32 && row >= 7 && row <= 16) || (row === 7 && column >= 32 && column <= 37) ||
    (column === 26 && row >= 32 && row <= 36) || (row === 32 && column >= 26 && column <= 28) ||
    (row === 36 && column >= 26 && column <= 29) || (column === 77 && row >= 10 && row <= 44) ||
    (row === 10 && column >= 77 && column <= 82) || (column === 82 && row >= 7 && row <= 10) ||
    (column === 9 && row >= 39 && row <= 52) || (row === 55 && column >= 8 && column <= 34) ||
    (column === 9 && row >= 57 && row <= 60);
}

export function zoneForFloor(floor: TowerFloor): RegionId {
  return floor.id;
}
