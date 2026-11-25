"use strict";

const canvas = document.querySelector("#dungeon");
const ctx = canvas.getContext("2d");
ctx.scale(canvas.width / VIEW_WIDTH, canvas.height / VIEW_HEIGHT);
ctx.imageSmoothingEnabled = false;
let progress;

function reset(position = COTTAGE.spawn) {
  fireballCooldown = 0;
  meleeCooldown = 0;
  updateFireballStatus();
  protection = 0;
  phase = "playing";
  ending.hidden = true;
  respawnButton.hidden = true;
  showFeedback("");
  pressed.clear();
  startWorld(position);
  resumeInventory();
  storeProgress();
}

function update(dt) {
  updateCombat(dt);
  elapsed += dt;
  protection = Math.max(0, protection - dt);
  updatePlayer(dt);
  updateWorld(dt);
  followDragon(dt);
  updateEnemies(dt);
}

bindInput();
bindInventory();
progress = loadProgress();
reset(progress.position);
window.addEventListener("pagehide", () => storeProgress());
let previousTime;
let gameRunning = true;
let gameFrame = 0;

function stopGame() {
  if (!gameRunning) return;
  gameRunning = false;
  cancelAnimationFrame(gameFrame);
  storeProgress();
}
window.vonkjeStop = stopGame;
window.addEventListener("pagehide", stopGame, { once: true });

function frame(now) {
  if (!gameRunning) return;
  // Cap the timestep after the tab has been suspended.
  const dt = Math.min(0.033, (now - (previousTime ?? now)) / 1000);
  previousTime = now;
  updateFeedback(dt);
  if (phase === "playing" && !inventoryPausesWorld()) update(dt);
  updateCamera(dt);
  updateAction();
  draw(now / 1000);
  gameFrame = requestAnimationFrame(frame);
}
gameFrame = requestAnimationFrame(frame);
