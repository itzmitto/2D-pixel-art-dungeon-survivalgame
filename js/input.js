"use strict";

const pressed = new Set();
const game = document.querySelector("#game");
const fullscreenToggle = document.querySelector("#fullscreen-toggle");
const buildKeys = { "1": "fence", "2": "floor", "3": "torch" };
const buildButtons = Object.fromEntries(Object.values(buildKeys).map(item =>
  [item, document.querySelector("#build-" + item)]));
const placeButton = document.querySelector("#build-place");
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
    if (key === "f") build();
    if (buildKeys[key]) selectBuild(buildKeys[key]);
    if (key === "escape") selectBuild(undefined);
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

function selectBuild(item) {
  if (phase !== "playing" || inventoryOpen() || area !== "forest") return;
  buildItem = item;
  updateBuildControls();
}

function updateBuildControls() {
  document.querySelector("#build-selection").hidden = area !== "forest";
  const locked = phase !== "playing" || inventoryOpen();
  for (const [item, button] of Object.entries(buildButtons)) {
    button.disabled = locked;
    button.setAttribute("aria-pressed", String(buildItem === item));
  }
  placeButton.disabled = locked || !buildItem;
}

function updateFullscreenButton() {
  const active = document.fullscreenElement === game;
  fullscreenToggle.textContent = active ? "Volledig scherm verlaten" : "Volledig scherm";
  fullscreenToggle.setAttribute("aria-pressed", String(active));
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement === game) await document.exitFullscreen();
    else await game.requestFullscreen();
  } catch {
    showFeedback("Volledig scherm is niet beschikbaar in dit venster.");
  }
}

function bindInput() {
  fullscreenToggle.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  updateFullscreenButton();
  for (const [item, button] of Object.entries(buildButtons)) {
    button.addEventListener("click", () => selectBuild(item));
  }
  placeButton.addEventListener("click", build);
  respawnButton.addEventListener("click", reset);
  document.querySelector("#new-game").addEventListener("click", () => {
    if (!window.confirm("Nieuw spel starten? Je opgeslagen voortgang wordt gewist.")) return;
    clearProgress();
    reset();
  });
}
