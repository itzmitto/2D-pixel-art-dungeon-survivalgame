"use strict";

const SAVE_KEY = "vonkje-survival-v1";

function newProgress() {
  return {
    bag: { sword: 1, axe: 1 }, hands: { left: null, right: null },
    armor: { helmet: null, chestplate: null, boots: null }, pet: { pet: null },
    chest: {}, trees: {}, mines: {}, buildings: {}, collected: {}, repaired: false, dungeonCompleted: false,
  };
}

// Oude bouwsels op het nieuwe pad of grot krijgen de dichtstbijzijnde vrije grastegel.
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
        // Oude saves gaven hout bij de laatste slag direct aan de speler.
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
    else loaded.bag[building] = (loaded.bag[building] || 0) + 1;
  }
}

function loadProgress() {
  const loaded = newProgress();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved) return loaded;

    // De vorige versie bewaarde hout en bouwitems buiten de rugzak.
    const bag = saved.version >= 2 ? saved.bag : {
      wood: saved.wood, fence: saved.items?.fence, floor: saved.items?.floor,
    };
    if (saved.version >= 3) loaded.bag = {};
    for (const item of Object.keys(ITEMS)) {
      const stored = saved.version >= 3 ? saved.chest?.[item] : undefined;
      if (Number.isSafeInteger(stored) && stored > 0) loaded.chest[item] = stored;
      const count = bag?.[item];
      if (Number.isSafeInteger(count) && count > 0) loaded.bag[item] = count;
    }
    for (const [slot, { group }] of Object.entries(EQUIPMENT_SLOTS)) {
      const item = saved[group]?.[slot];
      if (!ITEMS[item] || (group === "hands" ? !ITEMS[item].weapon : ITEMS[item].slot !== slot)) continue;
      if (!(saved.version >= 4)) {
        if (group !== "hands" || !loaded.bag[item] || Object.values(loaded.hands).includes(item)) continue;
        changeItem(item, -1, loaded.bag);
      }
      loaded[group][slot] = item;
    }
    for (const drop of FOREST_LOOT) {
      if (saved.collected?.[drop.id] === true) loaded.collected[drop.id] = true;
    }
    loadBuildings(saved, loaded);
    loaded.repaired = saved.repaired === true;
    loaded.dungeonCompleted = saved.dungeonCompleted === true;
  } catch {
    // Opslag kan ook geblokkeerd zijn bij het openen van index.html.
  }
  return loaded;
}

function storeProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 4, ...progress }));
  } catch {
    // Doorspelen blijft mogelijk met voortgang in het geheugen.
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
