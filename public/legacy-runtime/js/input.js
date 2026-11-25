"use strict";

const pressed = new Set();
const heldShift = new Set();
const BUILD_ITEMS = ["fence", "floor", "torch"];
const walkKeys = ["w", "a", "s", "d"];
const arrowKeys = ["arrowup", "arrowleft", "arrowdown", "arrowright"];
let inputAbortController = null;
let fullscreenStatus = false;
let canBuildStatus = false;

function shiftKey(event) {
  return event.code || (event.location === 2 ? "ShiftRight" : "ShiftLeft");
}

function sprinting() {
  return heldShift.size > 0;
}

function handleKeyDown(event) {
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
}

function handleKeyUp(event) {
  if (event.key === "Shift") heldShift.delete(shiftKey(event));
  pressed.delete(event.key.toLowerCase());
}

function handleWindowBlur() {
  pressed.clear();
  heldShift.clear();
  clearMouseRoute();
}

function selectedBuildItem() {
  const item = selectedStack()?.item;
  return BUILD_ITEMS.includes(item) ? item : null;
}

function updateBuildControls() {
  const canPlace = phase === "playing" && !inventoryOpen() && region === "cottage" && Boolean(selectedBuildItem());
  if (canBuildStatus !== canPlace) {
    canBuildStatus = canPlace;
    publishUi();
  }
}

function updateFullscreenButton() {
  const active = Boolean(document.fullscreenElement && document.fullscreenElement === canvas.closest("#game"));
  if (fullscreenStatus !== active) {
    fullscreenStatus = active;
    publishUi();
  }
}

async function toggleFullscreen() {
  const game = canvas?.closest("#game");
  if (!game) return;
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
  if (!(x >= 0 && x < 1 && y >= 0 && y < 1)) return null;
  return { x: camera.x + x * VIEW_WIDTH, y: camera.y + y * VIEW_HEIGHT };
}

function bindInput() {
  if (inputAbortController) return;
  inputAbortController = new AbortController();
  const { signal } = inputAbortController;
  window.addEventListener("keydown", handleKeyDown, { signal });
  window.addEventListener("keyup", handleKeyUp, { signal });
  window.addEventListener("blur", handleWindowBlur, { signal });
  document.addEventListener("fullscreenchange", updateFullscreenButton, { signal });
  canvas.addEventListener("click", event => {
    if (event.button === 0 && phase === "playing" && !inventoryOpen()) melee("left");
  }, { signal });
  canvas.addEventListener("contextmenu", event => {
    event.preventDefault();
    if (event.button !== 2 || phase !== "playing" || inventoryOpen()) return;
    const point = worldPoint(event);
    if (point) setMouseRoute(point);
  }, { signal });
  canvas.addEventListener("wheel", event => {
    if (phase !== "playing" || inventoryOpen() || event.ctrlKey || !event.deltaY) return;
    event.preventDefault();
    selectHotbar((progress.selectedHotbar + Math.sign(event.deltaY) + HOTBAR_SLOTS) % HOTBAR_SLOTS);
  }, { passive: false, signal });
  updateFullscreenButton();
}

function unbindInput() {
  inputAbortController?.abort();
  inputAbortController = null;
  handleWindowBlur();
}
