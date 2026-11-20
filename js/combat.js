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
    hit.health--;
    hit.flash = SLIME_FLASH_TIME;
    return false;
  });
}
