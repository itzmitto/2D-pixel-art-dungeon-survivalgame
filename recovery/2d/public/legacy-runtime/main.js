"use strict";

let canvas, ctx, progress, services, store, loop, lifecycle;
let snapshotDirty = false;

function publishUi() {
  snapshotDirty = true;
}

function flushSnapshot() {
  if (!snapshotDirty) return;
  snapshotDirty = false;
  const boss = enemies.find(enemy => enemy.kind === "warden" && enemy.zone === region && enemy.health > 0);
  const attack = boss?.attack;
  const action = getAction();
  const { bag, hotbar, chest, dungeonChests, bagCraft, benchCraft, hands, armor, pet,
    held, panelMode, chestId, selectedHotbar, overflow } = progress;
  store.publish({
    progress: { bag, hotbar, chest, dungeonChests, bagCraft, benchCraft, hands, armor, pet,
      held, panelMode, chestId, selectedHotbar, overflow },
    hearts: player.hearts, defense: totalDefense(), region: ZONES[region],
    fireballLabel: fireballText, feedback: feedbackMessage, panelMessage: panelFeedbackMessage,
    phase, result: endMessage, hasKey, fullscreen: fullscreenStatus,
    canBuild: phase === "playing" && !inventoryOpen() && region === "cottage" && Boolean(selectedBuildItem()),
    action: action ? { kind: action.kind, hint: action.hint, chestId: action.id } : null,
    boss: boss ? {
      name: region === "watchTop" ? "The Bellkeeper" : "Cyclops Warden",
      health: boss.health, maxHealth: ENEMIES.warden.health,
      cue: !attack ? "" : attack.phase === "recover" ? "Recovering" : WARDEN_ATTACKS[attack.kind].cue,
    } : null,
  });
}

function reset(position = COTTAGE.spawn) {
  fireballCooldown = 0;
  meleeCooldown = 0;
  protection = 0;
  phase = "playing";
  endMessage = "";
  showFeedback("");
  pressed.clear();
  startWorld(position);
  resumeInventory();
  updateFireballStatus();
}

function update(dt) {
  updateFeedback(dt);
  if (phase === "playing" && !inventoryPausesWorld()) {
    updateCombat(dt);
    elapsed += dt;
    protection = Math.max(0, protection - dt);
    updatePlayer(dt);
    updateWorld(dt);
    followDragon(dt);
    updateEnemies(dt);
  }
  updateCamera(dt);
  updateAction();
  flushSnapshot();
}

function start(element, runtimeServices) {
  if (loop?.isRunning()) return;
  canvas = element;
  ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable.");
  ctx.setTransform(canvas.width / VIEW_WIDTH, 0, 0, canvas.height / VIEW_HEIGHT, 0, 0);
  ctx.imageSmoothingEnabled = false;
  services = runtimeServices;
  store ??= services.createSnapshotStore();
  progress = loadProgress();
  reset(progress.position);
  bindInput();
  lifecycle = new AbortController();
  window.addEventListener("pagehide", saveOnPageHide, { signal: lifecycle.signal });
  loop = services.createLoop(update, draw);
  updateAction();
  flushSnapshot();
  loop.start();
  window.dispatchEvent(new Event("vonkje-ready"));
}

function saveOnPageHide() {
  if (positionDirty) storeProgress();
}

function stopGame() {
  if (!loop?.isRunning()) return;
  loop.stop();
  unbindInput();
  lifecycle.abort();
}

window.vonkje = {
  start, stop: stopGame,
  getSnapshot: () => store?.getSnapshot() ?? null,
  subscribe: listener => store?.subscribe(listener) ?? (() => {}),
  selectHotbar,
  toggleInventory: () => inventoryOpen() ? closeInventory() : openInventory(),
  closeInventory,
  clickSlot: (ref, options = {}) => {
    if (!inventoryOpen()) return;
    panelMessage("");
    if (options.shift && progress.panelMode === "chest") quickTransfer(ref);
    else slotAction(ref, options.single);
  },
  takeCraftOutput, recoverOverflow, drinkPotion, build, toggleFullscreen,
  reset: () => { reset(); storeProgress(); },
  clearProgress: () => { clearProgress(); reset(); storeProgress(); },
};
