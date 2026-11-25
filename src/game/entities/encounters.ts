import type { EnemyDropDefinition } from '../types/combat.ts';
import type { EnemyKind, EnemySpawn, RegionId, Vec2 } from '../types/world.ts';
import { MOB_LOOT } from '../items/catalog.ts';
import { WORLD_ENEMY_SPAWNS, worldCenter } from '../world/regions.ts';
import { towerPoint, type TowerFloorId } from '../world/towers.ts';

export interface EncounterSaveState {
  readonly encounterSeed: number;
}

export interface EncounterSpawn extends EnemySpawn {
  readonly veteran: boolean;
}

export interface BossReward {
  readonly chest: 'dungeon3' | 'watchTop';
  readonly loot: readonly EnemyDropDefinition[];
}

interface PooledSpawn {
  readonly id: string;
  readonly zone: RegionId;
  readonly point: Vec2;
  readonly towerFloor?: TowerFloorId;
}

const ENCOUNTER_POOLS: Partial<Record<RegionId, readonly EnemyKind[]>> = {
  forest: ['wolf', 'wolf', 'snake'],
  undercroft: ['snake', 'snake', 'wolf'],
  watch: ['wolf', 'snake'],
  fen: ['snake', 'snake', 'wolf'],
};

const POOLED_SPAWNS: readonly PooledSpawn[] = [
  { id: 'forest:path', zone: 'forest', point: worldCenter(31, 17) },
  { id: 'undercroft:alcove', zone: 'undercroft', point: worldCenter(54, 5) },
  { id: 'watch:guard', zone: 'watch', point: towerPoint('watch', 7, 5) },
  { id: 'watch:scout', zone: 'watch', point: towerPoint('watch', 11, 6) },
  { id: 'fen:east', zone: 'fen', point: towerPoint('fen', 12, 5) },
  { id: 'fen:north', zone: 'fen', point: towerPoint('fen', 5, 1) },
];

export function createEncounterSpawns(state: EncounterSaveState): readonly EncounterSpawn[] {
  const pooled = POOLED_SPAWNS.map(({ id, zone, point }, index): EncounterSpawn => {
    const pool = ENCOUNTER_POOLS[zone];
    if (!pool?.length) throw new Error(`No encounter pool configured for ${zone}`);
    const shift = (index * 5) % 27;
    const roll = (state.encounterSeed >>> shift) + index;
    return {
      id,
      zone,
      ...point,
      kind: pool[roll % pool.length],
      veteran: zone === 'undercroft',
    };
  });
  return [
    ...WORLD_ENEMY_SPAWNS,
    ...pooled,
    { id: 'watchTop:boss', kind: 'warden', zone: 'watchTop', ...towerPoint('watchTop', 9, 3), veteran: false },
  ];
}

export function bossReward(id: string): BossReward {
  if (id === 'dungeon3:warden') {
    return { chest: 'dungeon3', loot: [{ item: 'emberCore', count: 1 }] };
  }
  return {
    chest: 'watchTop',
    loot: [{ item: 'emberCore', count: 1 }, { item: 'copperSword', count: 1 }],
  };
}

export function dropForEnemy(kind: Exclude<EnemyKind, 'warden'>): EnemyDropDefinition {
  const drop = MOB_LOOT[kind];
  if (!drop) throw new Error(`No loot configured for ${kind}`);
  return drop;
}
