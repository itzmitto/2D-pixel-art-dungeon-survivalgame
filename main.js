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

let buildItem, facingTile, feedbackTime, axeTime;
let progress;

function reset() {
  fireballCooldown = 0;
  meleeCooldown = 0;
  selectedWeapon = undefined;
  aim = { x: 0, y: 1 };
  updateFireballStatus();
  protection = 0;
  phase = "playing";
  ending.hidden = true;
  respawnButton.hidden = true;
  buildItem = undefined;
  showFeedback("");
  pressed.clear();
  status.textContent = "";
  enterArea("forest", 3);
  toggleBackpack(false);
}

function updateHud() {
  hearts.textContent = Array.from({ length: 3 }, (_, i) => i < player.hearts ? "♥" : "♡").join(" ");
  hearts.setAttribute("aria-label", player.hearts + " van 3 hartjes");
  roomNumber.textContent = {
    forest: "Bos", house: "Huis", dungeon1: "Kamer 1 van 2", dungeon2: "Kamer 2 van 2",
  }[area];
  keyLabel.hidden = !key;
  keyLabel.textContent = hasKey ? "Sleutel gevonden" : "Sleutel ontbreekt";
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
  if (traveled > 0) aim = { x: (player.x - x) / traveled, y: (player.y - y) / traveled };
  followDragon(dt);
  axeTime = Math.max(0, axeTime - dt);
  if (feedbackTime > 0) {
    feedbackTime -= dt;
    if (feedbackTime <= 0) feedback.textContent = "";
  }

  if (key && !hasKey && distance(player, key) < 16) {
    hasKey = true;
    updateHud();
    status.textContent = "Sleutel gevonden. De deur naar kamer 2 is open.";
  }
  if (exit && (!key || hasKey) && distance(player, exit) < 13) {
    if (area === "dungeon1") {
      enterArea("dungeon2", player.hearts);
    } else {
      enterArea("forest", player.hearts, "R");
      completeDungeon();
    }
    return;
  }

  if (potion && player.hearts < 3 && distance(player, potion) < 16) {
    potion = undefined;
    player.hearts++;
    updateHud();
    status.textContent = "Potion gebruikt. " + player.hearts + " van 3 hartjes.";
  }

  updateSlimes(dt);
}

bindInput();
bindInventory();
progress = loadProgress();
reset();
let previousTime;
// De game loop begrenst de tijdstap zodat een gepauzeerd tabblad geen sprong veroorzaakt.
function frame(now) {
  const dt = Math.min(0.033, (now - (previousTime ?? now)) / 1000);
  previousTime = now;
  if (phase === "playing" && backpack.hidden) update(dt);
  updateAction();
  draw(now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
