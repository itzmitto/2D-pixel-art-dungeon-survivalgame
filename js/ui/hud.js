"use strict";

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
let feedbackTime = 0;

function updateHud() {
  hearts.replaceChildren(...Array.from({ length: 3 }, (_, i) => {
    const heart = document.createElement("span");
    const fill = Math.max(0, Math.min(1, player.hearts - i));
    heart.textContent = fill === 0 ? "♡" : "♥";
    heart.style.setProperty("--heart-fill", fill * 100 + "%");
    return heart;
  }));
  hearts.setAttribute("aria-label", formatNumber(player.hearts) + " of 3 hearts");
  game.dataset.area = region;
  roomNumber.textContent = ZONES[region];
  keyLabel.hidden = !["ruins", "undercroft", "arena"].includes(region);
  keyLabel.textContent = hasKey ? "Keep key found" : "Keep key missing";
  updateInventory();
  updateWardenHud();
}

function finish(outcome, message) {
  clearMouseRoute();
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

function updateFeedback(dt) {
  if (feedbackTime <= 0) return;
  feedbackTime -= dt;
  if (feedbackTime <= 0) feedback.textContent = "";
}

function updateAction() {
  const text = getAction()?.hint || "";
  if (actionLabel.textContent !== text) actionLabel.textContent = text;
  actionLabel.hidden = !text;
  if (!text) return;
  actionLabel.style.setProperty("--action-x", (player.x - camera.x) / VIEW_WIDTH * 100 + "%");
  actionLabel.style.setProperty("--action-y", (player.y - camera.y - 20) / VIEW_HEIGHT * 100 + "%");
}
