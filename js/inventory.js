"use strict";

const RECIPES = {
  fence: { label: "Hek", cost: 4, button: document.querySelector("#craft-fence") },
  floor: { label: "Vloer", cost: 2, button: document.querySelector("#craft-floor") },
};
function updateInventory() {
  woodLabel.textContent = "Hout " + progress.wood;
  for (const [item, { label, cost, button }] of Object.entries(RECIPES)) {
    button.textContent = label + " maken · " + cost + " hout · " + progress.items[item] + " op zak";
    button.disabled = phase !== "playing" || progress.wood < cost;
  }
  buildSelection.textContent = buildItem
    ? RECIPES[buildItem].label + " geselecteerd · F om te plaatsen · Esc om te stoppen"
    : "1 — Hek selecteren · 2 — Vloer selecteren";
  buildSelection.hidden = area !== "forest";
}

function craft(item) {
  const { label, cost } = RECIPES[item];
  if (phase !== "playing" || progress.wood < cost) return;
  progress.wood -= cost;
  progress.items[item]++;
  storeProgress();
  updateInventory();
  showFeedback(label + " gemaakt.");
}
