"use strict";

const pressed = new Set();
const heldShift = new Set();
const game = document.querySelector("#game");
const fullscreenToggle = document.querySelector("#fullscreen-toggle");
const placeButton = document.querySelector("#build-place");
const BUILD_ITEMS = ["fence", "floor", "torch"];
const walkKeys = ["w", "a", "s", "d"];
const arrowKeys = ["arrowup", "arrowleft", "arrowdown", "arrowright"];

function shiftKey(event) {
  return event.code || (event.location === 2 ? "ShiftRight" : "ShiftLeft");
}

function sprinting() {
  return heldShift.size > 0;
}

window.addEventListener("keydown", event => {
  if (event.key === "Shift") heldShift.add(shiftKey(event));
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  const panelOpen = inventoryOpen();
  if (((key === "tab" || key === "b") && (phase === "playing" || panelOpen)) ||
      (panelOpen && (key === "escape" || (key === "e" && inventoryPausesWorld())))) {
    event.preventDefault();
    if (!event.repeat) {
      if (panelOpen) closeInventory();
      else openInventory();
    }
    return;
  }
  if (phase !== "playing") return;
  if ((walkKeys.includes(key) && !inventoryPausesWorld()) || (!panelOpen && arrowKeys.includes(key))) {
    event.preventDefault();
    clearMouseRoute();
    pressed.add(key);
    return;
  }
  if (/^[1-9]$/.test(key)) {
    event.preventDefault();
    if (!event.repeat) selectHotbar(Number(key) - 1);
    return;
  }
  if (panelOpen || ![" ", "e", "f", "j", "k"].includes(key)) return;
  event.preventDefault();
  if (event.repeat) return;
  switch (key) {
    case " ": shootFireball(); break;
    case "e": interact(); break;
    case "f": build(); break;
    case "j": melee("left"); break;
    case "k": melee("right"); break;
  }
});

window.addEventListener("keyup", event => {
  if (event.key === "Shift") heldShift.delete(shiftKey(event));
  const key = event.key.toLowerCase();
  pressed.delete(key);
});
window.addEventListener("blur", () => {
  pressed.clear();
  heldShift.clear();
  clearMouseRoute();
});

function selectedBuildItem() {
  const item = selectedStack()?.item;
  return BUILD_ITEMS.includes(item) ? item : null;
}

function updateBuildControls() {
  placeButton.disabled = phase !== "playing" || inventoryOpen() || region !== "cottage" || !selectedBuildItem();
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

function worldPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  // The stage letterboxes the canvas itself. Only the canvas rectangle maps to the world.
  if (!(x >= 0 && x < 1 && y >= 0 && y < 1)) return null;
  return { x: camera.x + x * VIEW_WIDTH, y: camera.y + y * VIEW_HEIGHT };
}

function bindInput() {
  canvas.addEventListener("click", event => {
    if (event.button === 0) melee("left");
  });
  canvas.addEventListener("contextmenu", event => {
    event.preventDefault();
    if (event.button !== 2 || phase !== "playing" || inventoryOpen()) return;
    const point = worldPoint(event);
    if (point) setMouseRoute(point);
  });
  fullscreenToggle.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  updateFullscreenButton();
  canvas.addEventListener("wheel", event => {
    if (phase !== "playing" || event.ctrlKey || !event.deltaY) return;
    event.preventDefault();
    selectHotbar((progress.selectedHotbar + Math.sign(event.deltaY) + HOTBAR_SLOTS) % HOTBAR_SLOTS);
  }, { passive: false });
  placeButton.addEventListener("click", build);
  respawnButton.addEventListener("click", () => reset());
  document.querySelector("#new-game").addEventListener("click", () => {
    if (!window.confirm("Start a new game? Your saved progress will be erased.")) return;
    clearProgress();
    reset();
  });
}
