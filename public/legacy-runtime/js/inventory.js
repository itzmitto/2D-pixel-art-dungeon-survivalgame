"use strict";

const ITEMS = {
  wood: { label: "Wood" },
  stone: { label: "Stone" },
  copper: { label: "Copper ore" },
  potion: { label: "Potion" },
  gel: { label: "Monster essence" },
  wolfFang: { label: "Wolf Fang" },
  serpentScale: { label: "Serpent Scale" },
  emberCore: { label: "Ember Core" },
  axe: { label: "Axe", weapon: true },
  sword: { label: "Wooden sword", weapon: true },
  stoneSword: { label: "Stone sword", weapon: true },
  copperSword: { label: "Copper sword", weapon: true },
  copperSpear: { label: "Copper spear", weapon: true },
  fangBlade: { label: "Fang Blade", weapon: true },
  copperHelmet: { label: "Copper helmet", slot: "helmet" },
  copperChestplate: { label: "Copper chestplate", slot: "chestplate" },
  scaleArmor: { label: "Scale Armor", slot: "chestplate" },
  copperBoots: { label: "Copper boots", slot: "boots" },
  copperPendant: { label: "Copper dragon charm", slot: "pet" },
  emberCharm: { label: "Ember Charm", slot: "pet" },
  pickaxe: { label: "Wooden pickaxe", tool: true },
  fence: { label: "Fence" },
  floor: { label: "Floor tile" },
  torch: { label: "Wooden torch" },
};

const BAG_SLOTS = 27;
const HOTBAR_SLOTS = 9;
const CHEST_SLOTS = 27;
const EQUIPMENT_SLOTS = {
  left: { group: "hands", label: "Left hand · J" },
  right: { group: "hands", label: "Right hand · K" },
  helmet: { group: "armor", label: "Helmet" },
  chestplate: { group: "armor", label: "Chestplate" },
  boots: { group: "armor", label: "Boots" },
  pet: { group: "pet", label: "Vonkje’s charm" },
};

// Each row lists the exact slots required. An occupied cell may hold more than one batch.
const RECIPES = {
  bagCraft: {
    fence: [[["wood", 1], ["wood", 1]], [["wood", 1], ["wood", 1]]],
    floor: [[["wood", 1], ["wood", 1]], [null, null]],
    torch: [[["wood", 2], null], [null, null]],
  },
  benchCraft: {
    torch: [[null, ["wood", 2], null], [null, null, null], [null, null, null]],
    pickaxe: [[["wood", 1], ["wood", 1], ["wood", 1]], [null, ["wood", 1], null], [null, null, null]],
    stoneSword: [[null, ["stone", 1], null], [null, ["stone", 1], null], [null, ["wood", 1], null]],
    copperSword: [[null, ["copper", 1], null], [null, ["copper", 2], null], [null, ["wood", 1], null]],
    copperSpear: [[null, ["copper", 2], null], [null, ["wood", 1], null], [null, ["wood", 1], null]],
    copperHelmet: [[null, ["copper", 1], null], [null, null, null], [null, null, null]],
    copperChestplate: [[["copper", 1], null, ["copper", 1]], [null, null, null], [null, null, null]],
    copperBoots: [[null, null, null], [null, null, null], [null, ["copper", 1], null]],
    copperPendant: [[null, ["wood", 1], null], [null, ["copper", 1], null], [null, null, null]],
    fangBlade: [[null, ["wolfFang", 2], null], [null, ["copper", 1], null], [null, ["wood", 1], null]],
    scaleArmor: [[["serpentScale", 1], ["copper", 1], ["serpentScale", 1]], [null, ["serpentScale", 1], null], [null, null, null]],
    emberCharm: [[null, ["emberCore", 1], null], [["wolfFang", 1], ["copper", 1], ["serpentScale", 1]], [null, null, null]],
  },
};

let panelFeedbackMessage = "";
let hotbarSelectionMessage = "";

function stackLimit(item) {
  const definition = ITEMS[item];
  return definition.weapon || definition.tool || definition.slot ? 1 : 64;
}

// All target grids are searched for matching stacks before any free slot is used.
function insertStack(grids, { item, count }) {
  for (const fillEmpty of [false, true]) {
    for (const grid of grids) {
      for (let i = 0; count > 0 && i < grid.length; i++) {
        const current = grid[i];
        if (fillEmpty ? current : current?.item !== item) continue;
        const added = Math.min(count, stackLimit(item) - (current?.count || 0));
        if (!added) continue;
        grid[i] = { item, count: (current?.count || 0) + added };
        count -= added;
      }
    }
  }
  return count;
}

function playerGrids(state = progress) {
  return [state.bag, state.hotbar];
}

function itemCount(item) {
  return playerGrids().flat().reduce((total, stack) => total + (stack?.item === item ? stack.count : 0), 0);
}

function removeItem(item, count) {
  if (itemCount(item) < count) return false;
  for (const grid of playerGrids()) {
    for (let i = 0; count && i < grid.length; i++) {
      const stack = grid[i];
      if (stack?.item !== item) continue;
      const taken = Math.min(count, stack.count);
      grid[i] = smallerStack(stack, taken);
      count -= taken;
    }
  }
  return true;
}

function addItem(item, count) {
  const grids = playerGrids().map(grid => grid.slice());
  if (insertStack(grids, { item, count })) return false;
  [progress.bag, progress.hotbar] = grids;
  return true;
}

function chestSlots(state = progress, id = state.chestId ?? "house") {
  return id === "house" ? state.chest : state.dungeonChests[id];
}

function getSlot({ area, index, chestId }, state = progress) {
  if (area === "chest") return chestSlots(state, chestId)[index];
  if (area !== "equipment") return state[area][index];
  const item = state[EQUIPMENT_SLOTS[index].group][index];
  return item ? { item, count: 1 } : null;
}

function setSlot({ area, index, chestId }, stack, state = progress) {
  if (area === "equipment") state[EQUIPMENT_SLOTS[index].group][index] = stack?.item || null;
  else if (area === "chest") chestSlots(state, chestId)[index] = stack;
  else state[area][index] = stack;
}

function acceptsSlot({ area, index }, item) {
  if (area !== "equipment") return true;
  return index === "left" || index === "right" ? Boolean(ITEMS[item].weapon) : ITEMS[item].slot === index;
}

function smallerStack(stack, count) {
  return stack.count > count ? { item: stack.item, count: stack.count - count } : null;
}

function slotAction(target, single = false) {
  if (target.area === "chest") target = { ...target, chestId: progress.chestId ?? "house" };
  const current = getSlot(target);
  const held = progress.held;
  if (!held) {
    if (!current) return;
    const count = single ? Math.ceil(current.count / 2) : current.count;
    progress.held = { item: current.item, count, source: target };
    setSlot(target, smallerStack(current, count));
  } else {
    if (!acceptsSlot(target, held.item)) {
      panelMessage("That item does not fit in this equipment slot.");
      return;
    }
    if (current && current.item !== held.item) {
      if (single) return;
      if (held.source && !acceptsSlot(held.source, current.item)) {
        panelMessage("The other item does not fit in the source slot.");
        return;
      }
      setSlot(target, { item: held.item, count: held.count });
      progress.held = { ...current, source: target };
    } else {
      const added = Math.min(single ? 1 : held.count, stackLimit(held.item) - (current?.count || 0));
      if (!added) return;
      setSlot(target, { item: held.item, count: (current?.count || 0) + added });
      progress.held = held.count > added ? { ...held, count: held.count - added } : null;
    }
  }
  inventoryChanged();
}

function quickTransfer(source) {
  if (progress.panelMode !== "chest" || !["bag", "hotbar", "chest"].includes(source.area)) return;
  const stack = getSlot(source);
  if (!stack) return;
  const grids = source.area === "chest" ? playerGrids() : [chestSlots()];
  const remaining = insertStack(grids, stack);
  if (remaining === stack.count) {
    panelMessage(source.area === "chest" ? "Backpack and hotbar are full." : "The chest is full.");
    return;
  }
  setSlot(source, remaining ? { item: stack.item, count: remaining } : null);
  inventoryChanged();
  if (remaining) panelMessage("Moved " + (stack.count - remaining) + ". The rest stayed in its slot.");
}

function craftingArea() {
  if (progress.panelMode === "workbench") return "benchCraft";
  return progress.panelMode === "bag" ? "bagCraft" : null;
}

function matchingRecipe(area = craftingArea()) {
  if (!area) return null;
  const grid = progress[area];
  for (const [item, rows] of Object.entries(RECIPES[area])) {
    const cells = rows.flat();
    if (cells.every((cell, i) => cell
      ? grid[i]?.item === cell[0] && grid[i].count >= cell[1]
      : !grid[i])) return { item, cells };
  }
  return null;
}

function takeCraftOutput() {
  panelMessage("");
  const area = craftingArea();
  const recipe = matchingRecipe(area);
  if (!recipe) return;
  const held = progress.held;
  if (held && (held.item !== recipe.item || held.count >= stackLimit(recipe.item))) {
    panelMessage("Free your cursor stack before taking this output.");
    return;
  }
  recipe.cells.forEach((cell, i) => {
    if (cell) progress[area][i] = smallerStack(progress[area][i], cell[1]);
  });
  progress.held = { item: recipe.item, count: (held?.count || 0) + 1, source: held?.source || null };
  inventoryChanged();
}

function planReturnedItems(preferSource) {
  const state = { ...progress };
  for (const key of ["bag", "hotbar", "chest", "hands", "armor", "pet"]) {
    state[key] = Array.isArray(progress[key]) ? progress[key].slice() : { ...progress[key] };
  }
  state.dungeonChests = Object.fromEntries(Object.entries(progress.dungeonChests).map(([id, slots]) => [id, slots.slice()]));

  const held = progress.held;
  if (held) {
    let remaining = held.count;
    const source = held.source;
    const storageSource = source && !["bagCraft", "benchCraft"].includes(source.area);
    if (storageSource && (preferSource || source.area === "equipment") && acceptsSlot(source, held.item)) {
      const current = getSlot(source, state);
      if (!current || current.item === held.item) {
        const existing = current?.count || 0;
        const returned = Math.min(remaining, stackLimit(held.item) - existing);
        if (returned) setSlot(source, { item: held.item, count: existing + returned }, state);
        remaining -= returned;
      }
    }
    const grids = playerGrids(state);
    if (progress.panelMode === "chest") grids.push(chestSlots(state));
    if (remaining && insertStack(grids, { item: held.item, count: remaining })) return false;
  }

  for (const key of ["bagCraft", "benchCraft"]) {
    for (const stack of progress[key]) {
      if (stack && insertStack(playerGrids(state), stack)) return false;
    }
    state[key] = Array(progress[key].length).fill(null);
  }
  return state;
}

function returnPendingItems() {
  const state = planReturnedItems(true) || planReturnedItems(false);
  if (!state) return false;
  Object.assign(progress, state, { held: null, panelMode: null, chestId: null });
  return true;
}

function inventoryOpen() {
  return progress.panelMode !== null;
}

function inventoryPausesWorld() {
  return inventoryOpen() && progress.panelMode !== "bag";
}

function openInventory(mode = "bag", chestId = "house") {
  if (mode === "chest" && (!Object.hasOwn(CHEST_STATIONS, chestId) || !chestUnlocked(chestId))) return;
  const openingChest = mode === "chest" ? chestId : null;
  if (inventoryOpen() && (progress.panelMode !== mode || progress.chestId !== openingChest) && !closeInventory(false)) return;
  progress.panelMode = mode;
  progress.chestId = openingChest;
  panelMessage("");
  clearMouseRoute();
  swing = undefined;
  updateInventory();
}

function closeInventory() {
  if (!inventoryOpen()) return true;
  if (!returnPendingItems()) {
    panelMessage("Make space in storage for the held stack and crafting ingredients before closing.");
    return false;
  }
  inventoryChanged();
  return true;
}

function resumeInventory() {
  if (progress.held || progress.bagCraft.some(Boolean) || progress.benchCraft.some(Boolean)) {
    const mode = progress.panelMode || (progress.benchCraft.some(Boolean) ? "workbench" : "bag");
    const chestId = progress.chestId ?? "house";
    if (mode === "chest" && chestUnlocked(chestId)) {
      const station = CHEST_STATIONS[chestId];
      if (distance(player, station.position) >= 38) placeParty(station.arrival);
      openInventory(mode, chestId);
    } else {
      if (mode === "workbench" && (!insideCottage(player) || distance(player, COTTAGE.workbench) >= 38)) {
        placeParty(COTTAGE.workbenchArrival);
      }
      openInventory(mode === "chest" ? "bag" : mode);
    }
    panelMessage("Your unfinished inventory changes were restored.");
  } else {
    progress.panelMode = null;
    progress.chestId = null;
    updateInventory();
  }
}

function recoverOverflow() {
  for (const location of ["bag", "chest"]) {
    if (location === "chest" && progress.chestId !== "house") continue;
    const grids = location === "bag" ? playerGrids() : [progress.chest];
    for (const [item, count] of Object.entries(progress.overflow[location])) {
      const remaining = insertStack(grids, { item, count });
      if (remaining) progress.overflow[location][item] = remaining;
      else delete progress.overflow[location][item];
    }
  }
  const remaining = Object.values(progress.overflow.bag).some(Boolean) ||
    (progress.chestId === "house" && Object.values(progress.overflow.chest).some(Boolean));
  inventoryChanged();
  panelMessage(remaining ? "Make more room to recover the remaining saved items." : "Saved items recovered.");
}

function drinkPotion() {
  if (player.hearts >= 3 || !removeItem("potion", 1)) return;
  player.hearts = Math.min(3, player.hearts + 1);
  storeProgress();
  updateHud();
  panelMessage("Potion used.");
}

function inventoryChanged() {
  storeProgress();
  updateInventory();
  updateFireballStatus();
}

function panelMessage(message) {
  panelFeedbackMessage = message;
  publishUi();
}

function selectedStack() {
  return progress.hotbar[progress.selectedHotbar];
}

function selectHotbar(index) {
  if (!Number.isInteger(index) || index < 0 || index >= HOTBAR_SLOTS) return;
  progress.selectedHotbar = index;
  storeProgress();
  const stack = selectedStack();
  hotbarSelectionMessage = stack ? ITEMS[stack.item].label : "Empty slot " + (index + 1);
  updateInventory();
}

function updateInventory() {
  publishUi();
}

function bindInventory() {
  // Inventory controls are rendered and owned by React. The engine exposes transactions through its bridge.
}
