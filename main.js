"use strict";

const canvas = document.querySelector("#dungeon");
const ctx = canvas.getContext("2d");
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
  aim = { x: 0, y: 1 };
  updateFireballStatus();
  protection = 0;
  phase = "playing";
  ending.hidden = true;
  respawnButton.hidden = true;
  showFeedback("");
  pressed.clear();
  status.textContent = "";
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

  const down = (a, b) => Number(pressed.has(a) || pressed.has(b));
  const dx = down("d", "arrowright") - down("a", "arrowleft");
  const dy = down("s", "arrowdown") - down("w", "arrowup");
  if (dx || dy) {
    if (dx && (!dy || facingTile.x)) facingTile = { x: dx, y: 0 };
    else facingTile = { x: 0, y: dy };
  }
  if (dx) player.facing = Math.sign(dx);
  const step = 104 * dt / (Math.hypot(dx, dy) || 1);
  const { x, y } = player;
  move(player, dx * step, dy * step, !key || hasKey);
  const traveled = Math.hypot(player.x - x, player.y - y);
  player.walking = traveled > 0;
  player.walkTime = player.walking ? player.walkTime + dt : 0;
  if (traveled > 0) aim = { x: (player.x - x) / traveled, y: (player.y - y) / traveled };
  followDragon(dt);
  updateHarvestEffects();
  if (!updateDungeon()) updateSlimes(dt);
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
  if (phase === "playing" && !inventoryOpen()) update(dt);
  updateAction();
  draw(now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
