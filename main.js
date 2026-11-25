"use strict";

const canvas = document.querySelector("#dungeon");
const ctx = canvas.getContext("2d");
ctx.scale(canvas.width / WORLD_WIDTH, canvas.height / WORLD_HEIGHT);
const roomNumber = document.querySelector("#room-number");
const hearts = document.querySelector("#hearts");
const fireballStatus = document.querySelector("#fireball-status");
const keyLabel = document.querySelector("#key");
const ending = document.querySelector("#ending");
const result = document.querySelector("#result");
const respawnButton = document.querySelector("#respawn");
const actionLabel = document.querySelector("#action");
const feedback = document.querySelector("#feedback");
const status = document.querySelector("#status");

let facingTile, feedbackTime;
let progress;

function reset() {
  fireballCooldown = 0;
  meleeCooldown = 0;
  updateFireballStatus();
  protection = 0;
  phase = "playing";
  ending.hidden = true;
  respawnButton.hidden = true;
  showFeedback("");
  pressed.clear();
  enterArea("forest", 3);
  resumeInventory();
}

function updateHud() {
  hearts.replaceChildren(...Array.from({ length: 3 }, (_, i) => {
    const heart = document.createElement("span");
    const fill = Math.max(0, Math.min(1, player.hearts - i));
    heart.textContent = fill === 0 ? "♡" : "♥";
    heart.style.setProperty("--heart-fill", fill * 100 + "%");
    return heart;
  }));
  hearts.setAttribute("aria-label", formatNumber(player.hearts) + " of 3 hearts");
  game.dataset.area = area;
  roomNumber.textContent = {
    forest: "Forest", house: "House", dungeon1: "Dungeon 1 of 2", dungeon2: "Dungeon 2 of 2",
  }[area];
  keyLabel.hidden = !key;
  keyLabel.textContent = hasKey ? "Key found" : "Key missing";
  updateInventory();
}

function finish(outcome, message) {
  phase = outcome;
  result.textContent = message;
  ending.hidden = false;
  respawnButton.hidden = false;
  status.textContent = message;
  updateInventory();
  updateAction();
}

function showFeedback(message) {
  feedback.textContent = message;
  feedbackTime = 3;
}

function update(dt) {
  updateCombat(dt);
  elapsed += dt;
  protection = Math.max(0, protection - dt);
  if (updateArea(updatePlayer(dt))) return;
  followDragon(dt);
  updateHarvestEffects();
  updateEnemies(dt);
}

bindInput();
bindInventory();
progress = loadProgress();
reset();
let previousTime;
// Cap the time step so returning to a suspended tab does not cause a jump.
function frame(now) {
  const dt = Math.min(0.033, (now - (previousTime ?? now)) / 1000);
  previousTime = now;
  if (feedbackTime > 0) {
    feedbackTime -= dt;
    if (feedbackTime <= 0) feedback.textContent = "";
  }
  if (phase === "playing" && !inventoryPausesWorld()) update(dt);
  updateAction();
  draw(now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
