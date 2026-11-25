"use strict";

let feedbackTime = 0;
let feedbackMessage = "";
let endMessage = "";
let currentActionHint = "";
let statusMessage = "";

function updateHud() {
  updateInventory();
  updateWardenHud();
  publishUi();
}

function finish(outcome, message) {
  clearMouseRoute();
  phase = outcome;
  progress.position = { ...COTTAGE.spawn };
  storeProgress();
  endMessage = message;
  statusMessage = message;
  updateInventory();
  updateAction();
  publishUi();
}

function showFeedback(message) {
  feedbackMessage = message;
  feedbackTime = 3;
  publishUi();
}

function updateFeedback(dt) {
  if (feedbackTime <= 0) return;
  feedbackTime -= dt;
  if (feedbackTime <= 0) {
    feedbackMessage = "";
    publishUi();
  }
}

function updateAction() {
  const text = getAction()?.hint || "";
  if (text !== currentActionHint) {
    currentActionHint = text;
    publishUi();
  }
}
