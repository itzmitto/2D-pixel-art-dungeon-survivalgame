"use strict";

const SAVE_KEY = "vonkje-survival-v1";

function newProgress() {
  return {
    wood: 0, items: { fence: 0, floor: 0 }, trees: {}, buildings: {},
    repaired: false, dungeonCompleted: false,
  };
}

// Houd de voortgang ook in het geheugen als localStorage ontbreekt of een schrijffout geeft.
function loadProgress() {
  const loaded = newProgress();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved) return loaded;
    if (Number.isSafeInteger(saved.wood) && saved.wood >= 0) loaded.wood = saved.wood;
    for (const item of Object.keys(RECIPES)) {
      const count = saved.items?.[item];
      if (Number.isSafeInteger(count) && count >= 0) loaded.items[item] = count;
    }
    FOREST.forEach((row, y) => {
      [...row].forEach((tile, x) => {
        const id = tileId(x, y);
        const hits = saved.trees?.[id];
        const building = saved.buildings?.[id];
        if (tile === "Y" && Number.isInteger(hits) && hits > 0 && hits <= 3) {
          loaded.trees[id] = hits;
        }
        if (tile === "." && (building === "fence" || building === "floor")) {
          loaded.buildings[id] = building;
        }
      });
    });
    loaded.repaired = saved.repaired === true;
    loaded.dungeonCompleted = saved.dungeonCompleted === true;
  } catch {
    // Een ontbrekende of onleesbare save begint met een lege inventaris.
  }
  return loaded;
}

function storeProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  } catch {
    // De huidige sessie blijft speelbaar.
  }
}
