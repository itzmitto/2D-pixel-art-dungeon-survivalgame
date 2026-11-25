import type { EnemyDefinition, EnemyDropDefinition } from '../types/combat';
import type { ItemDefinition, ItemId, WeaponDefinition } from '../types/items';
import type { EnemyKind } from '../types/world';

const STACKABLE = 64;
const SINGLE = 1;

export const ITEMS: Record<ItemId, ItemDefinition> = {
  wood: { label: 'Wood', maxStack: STACKABLE },
  stone: { label: 'Stone', maxStack: STACKABLE },
  copper: { label: 'Copper ore', maxStack: STACKABLE },
  potion: { label: 'Potion', maxStack: STACKABLE },
  gel: { label: 'Monster essence', maxStack: STACKABLE },
  wolfFang: { label: 'Wolf Fang', maxStack: STACKABLE },
  serpentScale: { label: 'Serpent Scale', maxStack: STACKABLE },
  emberCore: { label: 'Ember Core', maxStack: STACKABLE },
  axe: { label: 'Axe', maxStack: SINGLE, weapon: true },
  sword: { label: 'Wooden sword', maxStack: SINGLE, weapon: true },
  stoneSword: { label: 'Stone sword', maxStack: SINGLE, weapon: true },
  copperSword: { label: 'Copper sword', maxStack: SINGLE, weapon: true },
  copperSpear: { label: 'Copper spear', maxStack: SINGLE, weapon: true },
  fangBlade: { label: 'Fang Blade', maxStack: SINGLE, weapon: true },
  copperHelmet: { label: 'Copper helmet', maxStack: SINGLE, equipmentSlot: 'helmet' },
  copperChestplate: { label: 'Copper chestplate', maxStack: SINGLE, equipmentSlot: 'chestplate' },
  scaleArmor: { label: 'Scale Armor', maxStack: SINGLE, equipmentSlot: 'chestplate' },
  copperBoots: { label: 'Copper boots', maxStack: SINGLE, equipmentSlot: 'boots' },
  copperPendant: { label: 'Copper dragon charm', maxStack: SINGLE, equipmentSlot: 'pet' },
  emberCharm: { label: 'Ember Charm', maxStack: SINGLE, equipmentSlot: 'pet' },
  pickaxe: { label: 'Wooden pickaxe', maxStack: SINGLE, tool: true },
  fence: { label: 'Fence', maxStack: STACKABLE },
  floor: { label: 'Floor tile', maxStack: STACKABLE },
  torch: { label: 'Wooden torch', maxStack: STACKABLE },
};

export const WEAPONS = {
  axe: { damage: 2, range: 26, cooldown: 0.38, sprite: 'axe' },
  sword: { damage: 2, range: 30, cooldown: 0.38, sprite: 'sword' },
  stoneSword: { damage: 3, range: 30, cooldown: 0.38, sprite: 'stoneSword' },
  copperSword: { damage: 4, range: 32, cooldown: 0.38, sprite: 'copperSword' },
  copperSpear: { damage: 3, range: 47, cooldown: 0.65, sprite: 'copperSpear' },
  fangBlade: { damage: 3, range: 30, cooldown: 0.25, swingDuration: 0.12, sprite: 'fangBlade' },
} satisfies Partial<Record<ItemId, WeaponDefinition>>;

export const ARMOR = {
  copperHelmet: 1,
  copperChestplate: 2,
  copperBoots: 1,
  scaleArmor: 3,
} satisfies Partial<Record<ItemId, number>>;

export const PET_RECHARGE_BONUS = {
  copperPendant: 0.2,
  emberCharm: 0.4,
} satisfies Partial<Record<ItemId, number>>;

export const ENEMIES = {
  wolf: { health: 4, speed: 68, reach: 16, sight: 152, damage: 1 },
  snake: { health: 4, speed: 38, rushSpeed: 96, reach: 15, sight: 104, damage: 0.75 },
  warden: { health: 24, speed: 0, reach: 0, sight: 0, damage: 0, radius: 14 },
} satisfies Record<EnemyKind, EnemyDefinition>;

export const MOB_LOOT: Record<Exclude<EnemyKind, 'warden'>, EnemyDropDefinition> = {
  wolf: { item: 'wolfFang', count: 2 },
  snake: { item: 'serpentScale', count: 2 },
};
