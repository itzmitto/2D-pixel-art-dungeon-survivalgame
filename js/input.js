"use strict";

const pressed = new Set();
const movementKeys = ["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"];
window.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === " " && phase === "playing") {
    event.preventDefault();
    if (!event.repeat) shootFireball();
    return;
  }
  const key = event.key.toLowerCase();
  if (phase === "playing" && ["e", "f", "1", "2", "escape"].includes(key)) {
    event.preventDefault();
    if (event.repeat) return;
    if (key === "e") interact();
    if (area === "forest") {
      if (key === "f") build();
      if (key === "1") buildItem = "fence";
      if (key === "2") buildItem = "floor";
      if (key === "escape") buildItem = undefined;
      updateInventory();
    }
    return;
  }
  if (!movementKeys.includes(key)) return;
  event.preventDefault();
  pressed.add(key);
});
window.addEventListener("keyup", (event) => pressed.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => pressed.clear());
respawnButton.addEventListener("click", reset);
for (const [item, { button }] of Object.entries(RECIPES)) {
  button.addEventListener("click", () => craft(item));
}
document.querySelector("#new-game").addEventListener("click", () => {
  if (!window.confirm("Nieuw spel starten? Je opgeslagen voortgang wordt gewist.")) return;
  progress = newProgress();
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    storeProgress();
  }
  reset();
});
