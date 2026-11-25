import { ITEMS } from './catalog.ts';
import type { CraftingArea } from './recipes.ts';
import type { ItemId, RecipeDefinition } from '../types/items.ts';

export interface ItemStack {
  readonly item: ItemId;
  readonly count: number;
}

export type EquipmentKey = 'left' | 'right' | 'helmet' | 'chestplate' | 'boots' | 'pet';
export type InventoryArea = 'bag' | 'hotbar' | 'chest' | 'bagCraft' | 'benchCraft' | 'equipment';
export interface SlotRef {
  readonly area: InventoryArea;
  readonly index: number | EquipmentKey;
  readonly chestId?: string;
}
export interface HeldStack extends ItemStack {
  readonly source: SlotRef | null;
}

export interface InventoryState {
  readonly bag: (ItemStack | null)[];
  readonly hotbar: (ItemStack | null)[];
  readonly chest: (ItemStack | null)[];
  readonly dungeonChests: Record<string, (ItemStack | null)[]>;
  readonly bagCraft: (ItemStack | null)[];
  readonly benchCraft: (ItemStack | null)[];
  readonly hands: Record<'left' | 'right', ItemId | null>;
  readonly armor: Record<'helmet' | 'chestplate' | 'boots', ItemId | null>;
  readonly pet: { pet: ItemId | null };
  held: HeldStack | null;
  panelMode: 'bag' | 'chest' | 'workbench' | null;
  chestId: string | null;
}

export function stackLimit(item: ItemId): number {
  return ITEMS[item].maxStack;
}

export function insertStack(grids: (ItemStack | null)[][], stack: ItemStack): number {
  let remaining = stack.count;
  for (const fillEmpty of [false, true]) {
    for (const grid of grids) {
      for (let index = 0; index < grid.length && remaining > 0; index++) {
        const current = grid[index];
        if (fillEmpty ? current !== null : current?.item !== stack.item) continue;
        const added = Math.min(remaining, stackLimit(stack.item) - (current?.count ?? 0));
        if (added <= 0) continue;
        grid[index] = { item: stack.item, count: (current?.count ?? 0) + added };
        remaining -= added;
      }
    }
  }
  return remaining;
}

function chestSlots(state: InventoryState, chestId?: string): (ItemStack | null)[] {
  if (!chestId || chestId === 'house') return state.chest;
  const slots = state.dungeonChests[chestId];
  if (!slots) throw new Error(`Unknown chest: ${chestId}`);
  return slots;
}

function equipmentValue(state: InventoryState, key: EquipmentKey): ItemId | null {
  if (key === 'left' || key === 'right') return state.hands[key];
  if (key === 'pet') return state.pet.pet;
  return state.armor[key];
}

function setEquipment(state: InventoryState, key: EquipmentKey, item: ItemId | null): void {
  if (key === 'left' || key === 'right') state.hands[key] = item;
  else if (key === 'pet') state.pet.pet = item;
  else state.armor[key] = item;
}

function container(state: InventoryState, ref: SlotRef): (ItemStack | null)[] | null {
  if (ref.area === 'equipment') return null;
  if (!Number.isInteger(ref.index) || Number(ref.index) < 0) throw new Error('Invalid inventory slot');
  if (ref.area === 'chest') return chestSlots(state, ref.chestId ?? state.chestId ?? 'house');
  return state[ref.area];
}

function getSlot(state: InventoryState, ref: SlotRef): ItemStack | null {
  if (ref.area === 'equipment') {
    if (typeof ref.index !== 'string') throw new Error('Equipment slot needs a slot name');
    const item = equipmentValue(state, ref.index);
    return item ? { item, count: 1 } : null;
  }
  const slots = container(state, ref);
  const item = slots?.[Number(ref.index)];
  return item ?? null;
}

function setSlot(state: InventoryState, ref: SlotRef, stack: ItemStack | null): void {
  if (ref.area === 'equipment') {
    if (typeof ref.index !== 'string') throw new Error('Equipment slot needs a slot name');
    setEquipment(state, ref.index, stack?.item ?? null);
    return;
  }
  const slots = container(state, ref);
  if (!slots || Number(ref.index) >= slots.length) throw new Error('Inventory slot is out of range');
  slots[Number(ref.index)] = stack;
}

function accepts(ref: SlotRef, item: ItemId): boolean {
  if (ref.area !== 'equipment') return true;
  if (ref.index === 'left' || ref.index === 'right') return Boolean(ITEMS[item].weapon);
  return ITEMS[item].equipmentSlot === ref.index;
}

export function clickSlot(state: InventoryState, ref: SlotRef, single = false): void {
  const destination = ref.area === 'chest' ? { ...ref, chestId: ref.chestId ?? state.chestId ?? 'house' } : ref;
  const current = getSlot(state, destination);
  const held = state.held;
  if (!held) {
    if (!current) return;
    const taken = single ? Math.ceil(current.count / 2) : current.count;
    setSlot(state, destination, current.count > taken ? { item: current.item, count: current.count - taken } : null);
    state.held = { item: current.item, count: taken, source: destination };
    return;
  }
  if (!accepts(destination, held.item)) return;
  if (current && current.item !== held.item) {
    if (single || (held.source && !accepts(held.source, current.item))) return;
    setSlot(state, destination, { item: held.item, count: held.count });
    state.held = { ...current, source: destination };
    return;
  }
  const accepted = Math.min(single ? 1 : held.count, stackLimit(held.item) - (current?.count ?? 0));
  if (accepted <= 0) return;
  setSlot(state, destination, { item: held.item, count: (current?.count ?? 0) + accepted });
  state.held = held.count > accepted ? { ...held, count: held.count - accepted } : null;
}

export function shiftTransfer(state: InventoryState, source: SlotRef): number {
  if (state.panelMode !== 'chest' || !['bag', 'hotbar', 'chest'].includes(source.area)) return 0;
  const stack = getSlot(state, source);
  if (!stack) return 0;
  const sourceIsChest = source.area === 'chest';
  const targets = sourceIsChest
    ? [state.bag, state.hotbar]
    : [chestSlots(state, state.chestId ?? 'house')];
  const remaining = insertStack(targets, stack);
  const moved = stack.count - remaining;
  if (moved > 0) setSlot(state, source, remaining > 0 ? { item: stack.item, count: remaining } : null);
  return moved;
}

export function takeCraftOutput(
  state: InventoryState,
  area: CraftingArea,
  recipe: RecipeDefinition,
): boolean {
  const slots = state[area];
  const held = state.held;
  if (recipe.pattern.length !== slots.length) return false;
  const matches = recipe.pattern.every((ingredient, index) => {
    const stack = slots[index];
    return ingredient
      ? stack?.item === ingredient.item && stack.count >= ingredient.count
      : !stack;
  });
  if (!matches || (held && (held.item !== recipe.output || held.count >= stackLimit(recipe.output)))) return false;
  for (const [index, ingredient] of recipe.pattern.entries()) {
    if (ingredient) {
      const stack = slots[index];
      if (stack && stack.count === ingredient.count) slots[index] = null;
      else if (stack) slots[index] = { item: stack.item, count: stack.count - ingredient.count };
    }
  }
  state.held = { item: recipe.output, count: (held?.count ?? 0) + 1, source: held?.source ?? null };
  return true;
}
