"use strict";

const pressed = new Set();
const game = document.querySelector("#game");
const fullscreenToggle = document.querySelector("#fullscreen-toggle");
const placeButton = document.querySelector("#build-place");
const BUILD_ITEMS = ["fence", "floor", "torch"];
const movementKeys = ["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"];

window.addEventListener("keydown", event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key === "tab" && (phase === "playing" || inventoryOpen())) {
    event.preventDefault();
    if (!event.repeat) navigateInventory(event.shiftKey);
    return;
  }
  if (key === "b" || (inventoryOpen() && (key === "escape" || (key === "e" && progress.panelMode !== "bag")))) {
    event.preventDefault();
    if (!event.repeat) {
      if (inventoryOpen()) closeInventory();
      else openInventory();
    }
    return;
  }
  if (inventoryOpen() || phase !== "playing") return;
  if (movementKeys.includes(key)) {
    event.preventDefault();
    pressed.add(key);
    return;
  }
  if (!/^[1-9]$/.test(key) && ![" ", "e", "f", "j", "k"].includes(key)) return;
  event.preventDefault();
  if (event.repeat) return;
  switch (key) {
    case " ": shootFireball(); break;
    case "e": interact(); break;
    case "f": build(); break;
    case "j": melee("left"); break;
    case "k": melee("right"); break;
    default: selectHotbar(Number(key) - 1);
  }
});

window.addEventListener("keyup", event => pressed.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => pressed.clear());

function navigateInventory(reverse) {
  if (!inventoryOpen()) {
    openInventory();
    return;
  }
  const controls = [...backpack.querySelectorAll("button:enabled, summary")]
    .filter(element => !element.closest("[hidden]"));
  const current = controls.indexOf(document.activeElement);
  const offset = reverse ? -1 : 1;
  const next = current < 0 ? (reverse ? controls.length - 1 : 0) : (current + offset + controls.length) % controls.length;
  controls[next]?.focus();
}

function selectedBuildItem() {
  const item = selectedStack()?.item;
  return BUILD_ITEMS.includes(item) ? item : null;
}

function updateBuildControls() {
  placeButton.disabled = phase !== "playing" || inventoryOpen() || area !== "forest" || !selectedBuildItem();
}

function updateFullscreenButton() {
  const active = document.fullscreenElement === game;
  fullscreenToggle.textContent = active ? "Exit full screen" : "Full screen";
  fullscreenToggle.setAttribute("aria-pressed", String(active));
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement === game) await document.exitFullscreen();
    else await game.requestFullscreen();
  } catch {
    showFeedback("Full screen is unavailable in this window.");
  }
}

function bindInput() {
  fullscreenToggle.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  updateFullscreenButton();
  document.querySelector(".stage").addEventListener("wheel", event => {
    if (inventoryOpen() || phase !== "playing" || event.ctrlKey || !event.deltaY) return;
    event.preventDefault();
    selectHotbar((progress.selectedHotbar + Math.sign(event.deltaY) + HOTBAR_SLOTS) % HOTBAR_SLOTS);
  }, { passive: false });
  placeButton.addEventListener("click", build);
  respawnButton.addEventListener("click", reset);
  document.querySelector("#new-game").addEventListener("click", () => {
    if (!window.confirm("Start a new game? Your saved progress will be erased.")) return;
    clearProgress();
    reset();
  });
}
