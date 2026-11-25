import type { ItemId, RecipeDefinition } from '../types/items.ts';

export type CraftingArea = 'bagCraft' | 'benchCraft';
type RecipeCatalog = Readonly<Record<CraftingArea, Readonly<Partial<Record<ItemId, RecipeDefinition>>>>>;

function ingredient(item: ItemId, count: number) {
  return { item, count } as const;
}

export const RECIPES: RecipeCatalog = {
  bagCraft: {
    fence: { output: 'fence', width: 2, pattern: [ingredient('wood', 1), ingredient('wood', 1), ingredient('wood', 1), ingredient('wood', 1)] },
    floor: { output: 'floor', width: 2, pattern: [ingredient('wood', 1), ingredient('wood', 1), null, null] },
    torch: { output: 'torch', width: 2, pattern: [ingredient('wood', 2), null, null, null] },
  },
  benchCraft: {
    torch: { output: 'torch', width: 3, pattern: [null, ingredient('wood', 2), null, null, null, null, null, null, null] },
    pickaxe: { output: 'pickaxe', width: 3, pattern: [ingredient('wood', 1), ingredient('wood', 1), ingredient('wood', 1), null, ingredient('wood', 1), null, null, null, null] },
    stoneSword: { output: 'stoneSword', width: 3, pattern: [null, ingredient('stone', 1), null, null, ingredient('stone', 1), null, null, ingredient('wood', 1), null] },
    copperSword: { output: 'copperSword', width: 3, pattern: [null, ingredient('copper', 1), null, null, ingredient('copper', 2), null, null, ingredient('wood', 1), null] },
    copperSpear: { output: 'copperSpear', width: 3, pattern: [null, ingredient('copper', 2), null, null, ingredient('wood', 1), null, null, ingredient('wood', 1), null] },
    copperHelmet: { output: 'copperHelmet', width: 3, pattern: [null, ingredient('copper', 1), null, null, null, null, null, null, null] },
    copperChestplate: { output: 'copperChestplate', width: 3, pattern: [ingredient('copper', 1), null, ingredient('copper', 1), null, null, null, null, null, null] },
    copperBoots: { output: 'copperBoots', width: 3, pattern: [null, null, null, null, null, null, null, ingredient('copper', 1), null] },
    copperPendant: { output: 'copperPendant', width: 3, pattern: [null, ingredient('wood', 1), null, null, ingredient('copper', 1), null, null, null, null] },
    fangBlade: { output: 'fangBlade', width: 3, pattern: [null, ingredient('wolfFang', 2), null, null, ingredient('copper', 1), null, null, ingredient('wood', 1), null] },
    scaleArmor: { output: 'scaleArmor', width: 3, pattern: [ingredient('serpentScale', 1), ingredient('copper', 1), ingredient('serpentScale', 1), null, ingredient('serpentScale', 1), null, null, null, null] },
    emberCharm: { output: 'emberCharm', width: 3, pattern: [null, ingredient('emberCore', 1), null, ingredient('wolfFang', 1), ingredient('copper', 1), ingredient('serpentScale', 1), null, null, null] },
  },
};

export function recipeFor(area: CraftingArea, output: ItemId): RecipeDefinition | undefined {
  return RECIPES[area][output];
}

export function ingredientsFor(recipe: RecipeDefinition): ReadonlyMap<ItemId, number> {
  const totals = new Map<ItemId, number>();
  for (const cell of recipe.pattern) {
    if (cell) totals.set(cell.item, (totals.get(cell.item) ?? 0) + cell.count);
  }
  return totals;
}
