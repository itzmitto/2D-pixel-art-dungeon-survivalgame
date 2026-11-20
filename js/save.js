"use strict";

const SAVE_KEY = "vonkje-survival-v1";
const SAVE_VERSION = 5;
const SAVED_SLOT_COUNTS = { bag: 27, hotbar: 9, chest: 27, bagCraft: 4, benchCraft: 9 };

function newProgress() {
  return {
    bag: [
      { item: "sword", count: 1 }, { item: "axe", count: 1 },
      ...Array(SAVED_SLOT_COUNTS.bag - 2).fill(null),
    ],
    hotbar: Array(SAVED_SLOT_COUNTS.hotbar).fill(null),
    chest: Array(SAVED_SLOT_COUNTS.chest).fill(null),
    bagCraft: Array(SAVED_SLOT_COUNTS.bagCraft).fill(null),
    benchCraft: Array(SAVED_SLOT_COUNTS.benchCraft).fill(null),
    hands: { left: null, right: null },
    armor: { helmet: null, chestplate: null, boots: null },
    pet: { pet: null },
    held: null, panelMode: null, selectedHotbar: 0, overflow: { bag: {}, chest: {} },
    trees: {}, mines: {}, buildings: {}, collected: {}, repaired: false, dungeonCompleted: false,
  };
}

function validCount(count) {
  return Number.isSafeInteger(count) && count > 0;
}

function addOverflow(loaded, area, item, count) {
  if (!count) return;
  const overflow = loaded.overflow[area];
  overflow[item] = (overflow[item] || 0) + count;
}

// Relocate older buildings that overlap reserved tiles, and restore harvest progress.
function loadBuildings(saved, loaded) {
  const displaced = [];
  const empty = [];
  FOREST.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      const id = tileId(x, y);
      const building = saved.buildings?.[id];
      if (building === "fence" || building === "floor" || building === "torch") {
        if (tile === ".") loaded.buildings[id] = building;
        else displaced.push({ x, y, building });
      } else if (tile === ".") {
        empty.push({ x, y, id });
      }
      const resource = RESOURCES[tile];
      if (!resource) return;
      const hits = saved[resource.state]?.[id];
      if (Number.isInteger(hits) && hits > 0 && hits <= resource.hits) {
        loaded[resource.state][id] = hits;
        // Saves before v4 awarded wood directly on the last swing.
        if (hits === resource.hits && (!(saved.version >= 4) || saved.collected?.["resource:" + id] === true)) {
          loaded.collected["resource:" + id] = true;
        }
      }
    });
  });
  for (const { x, y, building } of displaced) {
    empty.sort((a, b) => (Math.abs(a.x - x) + Math.abs(a.y - y)) -
      (Math.abs(b.x - x) + Math.abs(b.y - y)));
    const site = empty.shift();
    if (site) loaded.buildings[site.id] = building;
    else addOverflow(loaded, "bag", building, insertStack([loaded.bag, loaded.hotbar], { item: building, count: 1 }));
  }
}

function loadEquipment(saved, loaded, legacyBag) {
  const sharedHands = !(saved.version >= 4);
  for (const [slot, { group }] of Object.entries(EQUIPMENT_SLOTS)) {
    const item = saved[group]?.[slot];
    const definition = Object.hasOwn(ITEMS, item) && ITEMS[item];
    if (!definition || (group === "hands" ? !definition.weapon : definition.slot !== slot)) continue;
    if (sharedHands) {
      if (group !== "hands" || !legacyBag[item] || Object.values(loaded.hands).includes(item)) continue;
      legacyBag[item]--;
    }
    loaded[group][slot] = item;
  }
}

function migrateContainer(loaded, area, counts) {
  const slots = area === "bag" ? [loaded.bag, loaded.hotbar] : [loaded.chest];
  const remainder = [];
  // Seed one stack of each item before filling spare slots with large old stacks.
  for (const [item, count] of Object.entries(counts)) {
    if (!validCount(count)) continue;
    const first = Math.min(count, stackLimit(item));
    const left = insertStack(slots, { item, count: first });
    remainder.push({ item, count: count - first + left });
  }
  for (const stack of remainder) {
    if (stack.count) addOverflow(loaded, area, stack.item, insertStack(slots, stack));
  }
}

function migrateLegacyInventory(saved, loaded) {
  // The oldest saves store wood and building supplies separately from the starter tools.
  const bag = saved.version >= 2 ? saved.bag : {
    wood: saved.wood, fence: saved.items?.fence, floor: saved.items?.floor,
  };
  const counts = saved.version >= 3 ? {} : { sword: 1, axe: 1 };
  const chest = {};
  for (const item of Object.keys(ITEMS)) {
    const count = bag?.[item];
    if (validCount(count)) counts[item] = count;
    const stored = saved.version >= 3 ? saved.chest?.[item] : undefined;
    if (validCount(stored)) chest[item] = stored;
  }
  loadEquipment(saved, loaded, counts);
  loaded.bag.fill(null);
  migrateContainer(loaded, "bag", counts);
  migrateContainer(loaded, "chest", chest);
}

function validSlotSource(source) {
  const { area, index } = source || {};
  if (area === "equipment") return Object.hasOwn(EQUIPMENT_SLOTS, index);
  return Object.hasOwn(SAVED_SLOT_COUNTS, area) &&
    Number.isInteger(index) && index >= 0 && index < SAVED_SLOT_COUNTS[area];
}

function loadSlotInventory(saved, loaded) {
  for (const area of ["bag", "chest"]) {
    for (const item of Object.keys(ITEMS)) {
      const count = saved.overflow?.[area]?.[item];
      if (validCount(count)) loaded.overflow[area][item] = count;
    }
  }

  loaded.bag.fill(null);
  for (const area of Object.keys(SAVED_SLOT_COUNTS)) {
    const slots = saved[area];
    if (!Array.isArray(slots)) continue;
    for (const [index, stack] of slots.entries()) {
      if (!stack || !Object.hasOwn(ITEMS, stack.item) || !validCount(stack.count)) continue;
      const { item, count } = stack;
      const fitted = index < loaded[area].length ? Math.min(count, stackLimit(item)) : 0;
      if (fitted) loaded[area][index] = { item, count: fitted };
      addOverflow(loaded, area === "chest" ? "chest" : "bag", item, count - fitted);
    }
  }

  loadEquipment(saved, loaded);
  if (Number.isInteger(saved.selectedHotbar) && saved.selectedHotbar >= 0 &&
      saved.selectedHotbar < loaded.hotbar.length) {
    loaded.selectedHotbar = saved.selectedHotbar;
  }
  if (["bag", "chest", "workbench"].includes(saved.panelMode)) loaded.panelMode = saved.panelMode;
  const held = saved.held;
  if (held && Object.hasOwn(ITEMS, held.item) && validCount(held.count)) {
    const count = Math.min(held.count, stackLimit(held.item));
    const source = validSlotSource(held.source) ? { area: held.source.area, index: held.source.index } : null;
    loaded.held = { item: held.item, count, source };
    addOverflow(loaded, held.source?.area === "chest" ? "chest" : "bag", held.item, held.count - count);
  }
}

function loadProgress() {
  const loaded = newProgress();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved) return loaded;

    if (saved.version >= SAVE_VERSION) loadSlotInventory(saved, loaded);
    else migrateLegacyInventory(saved, loaded);

    for (const drop of FOREST_LOOT) {
      if (saved.collected?.[drop.id] === true) loaded.collected[drop.id] = true;
    }
    loadBuildings(saved, loaded);
    loaded.repaired = saved.repaired === true;
    loaded.dungeonCompleted = saved.dungeonCompleted === true;
  } catch {
    // Local storage may be blocked when opening index.html directly.
  }
  return loaded;
}

function storeProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, ...progress }));
  } catch {
    // The game can continue with progress held in memory.
  }
}

function clearProgress() {
  progress = newProgress();
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    storeProgress();
  }
}
