"use strict";

const SAVE_KEY = "vonkje-survival-v1";
const SAVE_VERSION = 8;
const SLOT_SAVE_VERSION = 5;
const DUNGEON_LOOT_VERSION = 6;
const SAVED_SLOT_COUNTS = { bag: BAG_SLOTS, hotbar: HOTBAR_SLOTS, chest: CHEST_SLOTS, bagCraft: 4, benchCraft: 9 };

function newProgress() {
  const dungeonChests = Object.fromEntries(Object.entries(CHEST_STATIONS).filter(([, station]) => station.loot)
    .map(([id, { loot }]) => [id, Array.from({ length: CHEST_SLOTS }, (_, i) => {
      const [item, count] = loot[i] || [];
      return item ? { item, count } : null;
    })]));
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
    held: null, panelMode: null, chestId: null, selectedHotbar: 0, overflow: { bag: {}, chest: {} },
    trees: {}, mines: {}, buildings: {}, collected: {}, dungeonCompleted: false,
    encounterSeed: Math.floor(Math.random() * 0x80000000), dungeonEnemies: {}, dungeonChests, legacyTrailLoot: false, position: { ...COTTAGE.spawn },
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

function loadBuildings(saved, loaded) {
  const displaced = [];
  LEGACY_FOREST.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      const id = tileId(x, y);
      const resource = LEGACY_RESOURCES[tile];
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
  for (const [id, building] of Object.entries(saved.buildings || {})) {
    if (!["fence", "floor", "torch"].includes(building) || !/^\d+,\d+$/.test(id)) continue;
    let [x, y] = id.split(",").map(Number);
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) continue;
    if (!(saved.version >= 7)) ({ x, y } = tileAt(legacyWorldPoint("forest", worldCenter(x, y))));
    const slot = tileId(x, y);
    if (canBuildTile(x, y) && !loaded.buildings[slot]) loaded.buildings[slot] = building;
    else displaced.push({ x, y, building });
  }
  const empty = [];
  if (displaced.length) {
    WORLD_MAP.forEach((row, y) => [...row].forEach((_, x) => {
      const id = tileId(x, y);
      if (canBuildTile(x, y) && !loaded.buildings[id]) empty.push({ x, y, id });
    }));
  }
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
  if (area === "chest" && source.chestId != null && !Object.hasOwn(CHEST_STATIONS, source.chestId)) return false;
  return Object.hasOwn(SAVED_SLOT_COUNTS, area) &&
    Number.isInteger(index) && index >= 0 && index < SAVED_SLOT_COUNTS[area];
}

function validStack(stack) {
  return stack && Object.hasOwn(ITEMS, stack.item) && validCount(stack.count);
}

function loadGrid(savedSlots, slots, loaded, overflow) {
  if (!Array.isArray(savedSlots)) return;
  slots.fill(null);
  for (const [index, stack] of savedSlots.entries()) {
    if (!validStack(stack)) continue;
    const { item, count } = stack;
    const fitted = index < slots.length ? Math.min(count, stackLimit(item)) : 0;
    if (fitted) slots[index] = { item, count: fitted };
    addOverflow(loaded, overflow, item, count - fitted);
  }
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
    loadGrid(saved[area], loaded[area], loaded, area === "chest" ? "chest" : "bag");
  }
  for (const [id, slots] of Object.entries(loaded.dungeonChests)) {
    // Empty saved slots are intentional. Only a chest absent from an older save gets starter loot.
    loadGrid(saved.dungeonChests?.[id], slots, loaded, "bag");
  }

  loadEquipment(saved, loaded);
  if (Number.isInteger(saved.selectedHotbar) && saved.selectedHotbar >= 0 &&
      saved.selectedHotbar < loaded.hotbar.length) {
    loaded.selectedHotbar = saved.selectedHotbar;
  }
  if (["bag", "chest", "workbench"].includes(saved.panelMode)) loaded.panelMode = saved.panelMode;
  if (loaded.panelMode === "chest") {
    loaded.chestId = Object.hasOwn(CHEST_STATIONS, saved.chestId) ? saved.chestId : "house";
  }
  const held = saved.held;
  if (validStack(held)) {
    const count = Math.min(held.count, stackLimit(held.item));
    const source = validSlotSource(held.source) ? { area: held.source.area, index: held.source.index } : null;
    if (source?.area === "chest") source.chestId = held.source.chestId ?? loaded.chestId ?? "house";
    loaded.held = { item: held.item, count, source };
    addOverflow(loaded, source?.chestId === "house" ? "chest" : "bag", held.item, held.count - count);
  }
}

function loadDungeonProgress(saved, loaded) {
  loaded.dungeonCompleted = saved.dungeonCompleted === true;
  if (loaded.dungeonCompleted || saved.collected?.[DUNGEON_KEY] === true) loaded.collected[DUNGEON_KEY] = true;
  if (saved.collected?.[DUNGEON_POTION] === true) loaded.collected[DUNGEON_POTION] = true;
  for (const spawn of encounterSpawns(loaded)) {
    const { id, kind, zone } = spawn;
    const state = saved.dungeonEnemies?.[id] ?? saved.dungeonSlimes?.[id];
    if (!state || !Number.isInteger(state.health) || state.health < 0 || state.health >= enemyMaxHealth(spawn)) continue;
    if (state.health > 0) {
      loaded.dungeonEnemies[id] = { health: state.health };
      continue;
    }
    if (kind === "warden") {
      loaded.dungeonEnemies[id] = { health: 0 };
      continue;
    }
    const legacy = !(saved.version >= 7);
    const width = legacy ? 15 * TILE : WORLD_WIDTH;
    const height = legacy ? 10 * TILE : (TOWER_FLOORS.at(-1).top + 10) * TILE;
    const validPosition = state.x >= 8 && state.x <= width - 8 && state.y >= 8 && state.y <= height - 8;
    const destination = validPosition ? (legacy ? legacyWorldPoint(id.split(":")[0], state) :
      saved.version === 7 ? migrateVersion7Point(state) : state) : spawn;
    const position = safeWorldPoint(destination, loaded, zone);
    const drop = validStack(state.drop) ? { item: state.drop.item, count: state.drop.count } :
      !(saved.version >= DUNGEON_LOOT_VERSION) ? { item: "gel", count: 1 } : MOB_LOOT[kind];
    loaded.dungeonEnemies[id] = { health: 0, ...position, drop };
    if (saved.collected?.[id] === true) loaded.collected[id] = true;
  }
}

function loadPosition(saved, loaded) {
  const point = saved.position ?? saved.playerPosition ?? saved.player ?? saved.location;
  if (saved.version >= SAVE_VERSION) return safeWorldPoint(point, loaded);
  if (saved.version >= 7 && Number.isFinite(point?.x) && Number.isFinite(point?.y)) {
    const translated = migrateVersion7Point(point);
    if (towerFloorAt(translated)) return safeWorldPoint(translated, loaded);
    const col = Math.floor(point.x / TILE);
    const row = Math.floor(point.y / TILE);
    if (col < 24 && row < 38) return { ...COTTAGE.spawn };
    if (col >= 34 && col <= 40 && row >= 2 && row <= 8) return worldCenter(82, 10);
    if (col >= 25 && col <= 32 && row >= 33 && row <= 38) return worldCenter(9, 58);
    return safeWorldPoint(translated, loaded);
  }
  const oldArea = point?.area ?? point?.region ?? saved.area ?? saved.currentArea ?? "forest";
  if (oldArea === "house") return { ...COTTAGE.spawn };
  const arrival = LEGACY_ARRIVALS[oldArea];
  if (!arrival) return { ...COTTAGE.spawn };
  const translated = Number.isFinite(point?.x) && Number.isFinite(point?.y) ? legacyWorldPoint(oldArea, point) : arrival;
  return safeWorldPoint(translated, loaded, regionAt(arrival));
}

function migrateVersion7Point(point) {
  const oldTops = [42, 56, 70];
  const row = Math.floor(point.y / TILE);
  const floorIndex = oldTops.findIndex(top => row >= top && row < top + 10);
  if (floorIndex < 0) return point;
  const oldTop = oldTops[floorIndex];
  const newFloor = TOWER_FLOORS[floorIndex];
  return { ...point, y: point.y + (newFloor.top - oldTop) * TILE };
}

function loadProgress() {
  const loaded = newProgress();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved) return loaded;

    if (saved.version >= SLOT_SAVE_VERSION) loadSlotInventory(saved, loaded);
    else migrateLegacyInventory(saved, loaded);

    loaded.legacyTrailLoot = saved.legacyTrailLoot === true || !(saved.version >= DUNGEON_LOOT_VERSION);
    for (const drop of FOREST_LOOT) {
      if (saved.collected?.[drop.id] === true) loaded.collected[drop.id] = true;
    }
    if (Number.isSafeInteger(saved.encounterSeed)) loaded.encounterSeed = saved.encounterSeed;
    loadBuildings(saved, loaded);
    loadDungeonProgress(saved, loaded);
    loaded.position = loadPosition(saved, loaded);
    if (!(saved.version >= SAVE_VERSION)) storeProgress(loaded);
  } catch {
    // Local storage may be blocked when opening index.html directly.
  }
  return loaded;
}

function storeProgress(state = progress) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, ...state }));
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
