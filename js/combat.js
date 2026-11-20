"use strict";

const FIREBALL_COOLDOWN = 1;
const FIREBALL_LIFETIME = 1;
const FIREBALL_SPEED = 220;
const FIREBALL_RADIUS = 4;
const SLIME_HITS = 2;
const SLIME_FLASH_TIME = 0.14;
let fireballs, fireballCooldown, aim;
function updateFireballStatus() {
  fireballStatus.textContent = fireballCooldown > 0 ? "Vuurbal laadt op" : "Vuurbal klaar";
}

function shootFireball() {
  if (fireballCooldown > 0) return;
  fireballs.push({
    x: dragon.x, y: dragon.y,
    vx: aim.x * FIREBALL_SPEED, vy: aim.y * FIREBALL_SPEED,
    life: FIREBALL_LIFETIME,
  });
  fireballCooldown = FIREBALL_COOLDOWN;
  updateFireballStatus();
}

function updateFireballs(dt) {
  if (fireballCooldown > 0) {
    fireballCooldown = fireballCooldown <= dt + 1e-9 ? 0 : fireballCooldown - dt;
    if (fireballCooldown === 0) updateFireballStatus();
  }

  for (const slime of slimes) slime.flash = Math.max(0, slime.flash - dt);
  slimes = slimes.filter(slime => slime.health > 0 || slime.flash > 0);

  fireballs = fireballs.filter(ball => {
    const travelTime = Math.min(dt, ball.life);
    ball.x += ball.vx * travelTime;
    ball.y += ball.vy * travelTime;
    ball.life -= travelTime;
    if (blocked(ball.x, ball.y, FIREBALL_RADIUS, !key || hasKey)) return false;

    const hit = slimes.find(slime => slime.health > 0 &&
      distance(slime, ball) < slime.radius + FIREBALL_RADIUS);
    if (!hit) return ball.life > 1e-9;
    damageSlime(hit);
    return false;
  });
}


const MELEE_COOLDOWN = 0.38;
const SWING_TIME = 0.16;
let meleeCooldown, swing;

function damageSlime(slime) {
  slime.health--;
  slime.flash = SLIME_FLASH_TIME;
  if (slime.health === 0) groundLoot.push({ x: slime.x, y: slime.y, item: "gel", count: 1 });
}

// Volg de lijn van de slag in kleine stappen zodat muren en gesloten deuren beschermen.
function clearAttackPath(from, to) {
  const steps = Math.ceil(distance(from, to) / 3);
  for (let i = 1; i <= steps; i++) {
    const x = from.x + (to.x - from.x) * i / steps;
    const y = from.y + (to.y - from.y) * i / steps;
    if (blocked(x, y, 0, !key || hasKey)) return false;
  }
  return true;
}

function melee(hand) {
  const weapon = progress.hands[hand];
  if (!weapon) {
    showFeedback("Geen wapen uitgerust");
    return;
  }
  if (meleeCooldown > 0) return;
  const { x, y } = facingTile;
  const range = weapon === "sword" ? 30 : 26;
  meleeCooldown = MELEE_COOLDOWN;
  swing = { x, y, time: SWING_TIME, hand, weapon };
  for (const slime of slimes) {
    const dx = slime.x - player.x;
    const dy = slime.y - player.y;
    const gap = Math.hypot(dx, dy);
    if (slime.health > 0 && gap <= range && dx * x + dy * y >= gap * 0.45 &&
        clearAttackPath(player, slime)) damageSlime(slime);
  }
}

function updateCombat(dt) {
  updateFireballs(dt);
  meleeCooldown = Math.max(0, meleeCooldown - dt);
  if (swing) {
    swing.time -= dt;
    if (swing.time <= 0) swing = undefined;
  }
}

function updateSlimes(dt) {
  for (const slime of slimes) {
    if (slime.health === 0) continue;
    const gap = distance(slime, player);
    if (gap > 0) {
      const chase = Math.min(gap, 53 * dt) / gap;
      move(slime, (player.x - slime.x) * chase, (player.y - slime.y) * chase);
    }
    if (distance(player, slime) < 16 && protection === 0) {
      player.hearts--;
      protection = 1.1;
      updateHud();
      status.textContent = player.hearts + " hartjes over.";
      if (player.hearts === 0) {
        finish("lost", "Je hartjes zijn op");
        break;
      }
    }
  }
}

