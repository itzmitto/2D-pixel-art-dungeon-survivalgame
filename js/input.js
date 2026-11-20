"use strict";

const pressed = new Set();
const movementKeys = ["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"];
window.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key === "tab") {
    if (phase !== "playing" && !inventoryOpen()) return;
    event.preventDefault();
    if (!event.repeat) navigateInventory(event.shiftKey);
    return;
  }
  if (!housePanel.hidden && ["e", "escape", "b"].includes(key)) {
    event.preventDefault();
    if (!event.repeat) closeHousePanel();
    return;
  }
  if (key === "b" || (key === "escape" && !backpack.hidden)) {
    event.preventDefault();
    if (!event.repeat) toggleBackpack(key !== "escape" && backpack.hidden);
    return;
  }
  if (inventoryOpen()) return;
  if (event.key === " " && phase === "playing") {
    event.preventDefault();
    if (!event.repeat) shootFireball();
    return;
  }
  if (phase === "playing" && ["e", "f", "1", "2", "3", "escape", "j", "k"].includes(key)) {
    event.preventDefault();
    if (event.repeat) return;
    if (key === "e") interact();
    if (key === "j" || key === "k") melee(key === "j" ? "left" : "right");
    if (area === "forest") {
      if (key === "f") build();
      if (key === "1") buildItem = "fence";
      if (key === "2") buildItem = "floor";
      if (key === "3") buildItem = "torch";
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
function navigateInventory(reverse) {
  if (!inventoryOpen()) {
    toggleBackpack(true);
    return;
  }
  const panel = backpack.hidden ? housePanel : backpack;
  const buttons = [...panel.querySelectorAll("button:enabled")].filter(button => !button.closest("[hidden]"));
  const current = buttons.indexOf(document.activeElement);
  const next = current === -1 && reverse ? buttons.length - 1 : current + (reverse ? -1 : 1);
  if (next < 0 || next >= buttons.length) {
    if (panel === backpack) toggleBackpack(false);
    else buttons[reverse ? buttons.length - 1 : 0]?.focus();
    return;
  }
  buttons[next].focus();
}

function bindInput() {
  respawnButton.addEventListener("click", reset);
  document.querySelector("#new-game").addEventListener("click", () => {
    if (!window.confirm("Nieuw spel starten? Je opgeslagen voortgang wordt gewist.")) return;
    clearProgress();
    reset();
  });
}
