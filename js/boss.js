"use strict";

const WARDEN_ATTACKS = {
  charge: { range: 142, windup: 0.9, strike: 0.32, length: 116, damage: 1.25, cue: "Charge · Sidestep" },
  slam: { range: 64, windup: 0.85, strike: 0.19, radius: 54, damage: 1.5, cue: "Ground slam · Back away" },
};
const WARDEN_RECOVERY = 0.85;
const wardenHud = document.querySelector("#warden-hud");
const wardenHealth = document.querySelector("#warden-health");
const wardenCue = document.querySelector("#warden-cue");

function updateWardenHud() {
  const warden = region === "arena" && enemies.find(enemy => enemy.id === WARDEN_ID && enemy.health > 0);
  wardenHud.hidden = !warden;
  if (!warden) return;
  wardenHealth.max = ENEMIES.warden.health;
  wardenHealth.value = warden.health;
  const attack = warden.attack;
  wardenCue.textContent = !attack ? "" : attack.phase === "recover" ? "Recovering" : WARDEN_ATTACKS[attack.kind].cue;
}

function chargeEnd(warden, origin, direction, length) {
  let end = origin;
  // Fix the charge lane at wind-up. The same walls that stop actors shorten it.
  for (let traveled = 4; traveled <= length; traveled += 4) {
    const x = origin.x + direction.x * traveled;
    const y = origin.y + direction.y * traveled;
    if (blocked(x, end.y, warden.radius, false) || blocked(x, y, warden.radius, false)) break;
    end = { x, y };
  }
  return end;
}

function beginWardenAttack(warden, kind, spec, direction) {
  const origin = { x: warden.x, y: warden.y };
  warden.attack = { kind, origin, phase: "windup", time: spec.windup, hit: false };
  if (kind === "charge") warden.attack.end = chargeEnd(warden, origin, direction, spec.length);
  warden.nextAttack = kind === "charge" ? "slam" : "charge";
  updateWardenHud();
}

function updateWardenAttack(warden, dt) {
  const attack = warden.attack;
  const spec = WARDEN_ATTACKS[attack.kind];
  const advance = Math.min(dt, attack.time);
  attack.time -= advance;
  if (attack.phase === "strike" && attack.kind === "charge") {
    move(warden, (attack.end.x - attack.origin.x) * advance / spec.strike,
      (attack.end.y - attack.origin.y) * advance / spec.strike, false);
    if (!attack.hit && distance(warden, player) < warden.radius + player.radius && clearAttackPath(warden, player)) {
      attack.hit = true;
      damagePlayer(spec.damage);
    }
  }
  if (attack.time > 0) return;

  switch (attack.phase) {
    case "windup":
      attack.phase = "strike";
      attack.time = spec.strike;
      if (attack.kind === "slam" && distance(attack.origin, player) < spec.radius && clearAttackPath(warden, player)) {
        damagePlayer(spec.damage);
      }
      break;
    case "strike":
      attack.phase = "recover";
      attack.time = WARDEN_RECOVERY;
      break;
    case "recover":
      warden.attack = null;
      break;
  }
  updateWardenHud();
}

function updateWarden(warden, dt) {
  if (warden.attack) {
    updateWardenAttack(warden, dt);
    return;
  }
  const kind = warden.nextAttack ?? "charge";
  const spec = WARDEN_ATTACKS[kind];
  const gap = distance(warden, player);
  const direction = { x: (player.x - warden.x) / (gap || 1), y: (player.y - warden.y) / (gap || 1) };
  if (direction.x) warden.facing = Math.sign(direction.x);
  warden.walkTime += dt;
  if (gap <= spec.range && clearAttackPath(warden, player)) {
    beginWardenAttack(warden, kind, spec, direction);
  } else {
    move(warden, direction.x * 46 * dt, direction.y * 46 * dt, false);
  }
}

function drawWardenTelegraph(warden) {
  const attack = warden.attack;
  if (!attack || attack.phase === "recover") return;
  const striking = attack.phase === "strike";
  const spec = WARDEN_ATTACKS[attack.kind];
  const { x, y } = attack.origin;
  ctx.save();
  ctx.beginPath();
  if (attack.kind === "charge") {
    ctx.lineCap = "round";
    ctx.moveTo(x, y);
    ctx.lineTo(attack.end.x, attack.end.y);
    ctx.lineWidth = (warden.radius + player.radius) * 2;
    ctx.strokeStyle = striking ? "#f3745d77" : "#e7554966";
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.setLineDash(striking ? [] : [6, 4]);
    ctx.strokeStyle = striking ? "#ffe5b5" : "#ff997d";
    ctx.stroke();
  } else {
    ctx.arc(x, y, spec.radius, 0, Math.PI * 2);
    ctx.fillStyle = striking ? "#fda15499" : "#dc8b413f";
    ctx.fill();
    ctx.strokeStyle = striking ? "#fff1b5" : "#ffd182";
    ctx.lineWidth = striking ? 4 : 2;
    ctx.setLineDash(striking ? [] : [4, 3]);
    ctx.stroke();
  }
  ctx.restore();
}
