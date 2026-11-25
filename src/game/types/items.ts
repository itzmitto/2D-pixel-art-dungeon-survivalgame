export type ItemId =
  | 'wood' | 'stone' | 'copper' | 'potion' | 'gel' | 'wolfFang' | 'serpentScale' | 'emberCore'
  | 'axe' | 'sword' | 'stoneSword' | 'copperSword' | 'copperSpear' | 'fangBlade'
  | 'copperHelmet' | 'copperChestplate' | 'scaleArmor' | 'copperBoots' | 'copperPendant' | 'emberCharm'
  | 'pickaxe' | 'fence' | 'floor' | 'torch';

export type EquipmentSlot = 'left' | 'right' | 'helmet' | 'chestplate' | 'boots' | 'pet';

export interface ItemDefinition {
  readonly label: string;
  readonly maxStack: number;
  readonly weapon?: boolean;
  readonly tool?: boolean;
  readonly equipmentSlot?: Exclude<EquipmentSlot, 'left' | 'right'>;
}

export interface WeaponDefinition {
  readonly damage: number;
  readonly range: number;
  readonly cooldown: number;
  readonly swingDuration?: number;
  readonly sprite: ItemId;
}

export interface RecipeIngredient {
  readonly item: ItemId;
  readonly count: number;
}

export interface RecipeDefinition {
  readonly output: ItemId;
  readonly pattern: readonly (RecipeIngredient | null)[];
  readonly width: 2 | 3;
}
