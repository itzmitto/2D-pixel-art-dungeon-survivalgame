"use strict";

const FIREBALL_COOLDOWN = 1;
const FIREBALL_LIFETIME = 1;
const FIREBALL_SPEED = 220;
const FIREBALL_RADIUS = 4;
const SLIME_HITS = 4;
const FIREBALL_DAMAGE = 2;
const WEAPONS = {
  axe: { damage: 2, range: 26, cooldown: 0.38, sprite: "axe" },
  sword: { damage: 2, range: 30, cooldown: 0.38, sprite: "sword" },
  stoneSword: { damage: 3, range: 30, cooldown: 0.38, sprite: "stoneSword" },
  copperSword: { damage: 4, range: 32, cooldown: 0.38, sprite: "copperSword" },
  copperSpear: { damage: 3, range: 47, cooldown: 0.65, sprite: "copperSpear" },
};
const ARMOR = { copperHelmet: 1, copperChestplate: 2, copperBoots: 1 };
const PET_UPGRADES = { copperPendant: 0.2 };

function totalDefense() {
  return Object.values(progress.armor).reduce((total, item) => total + (ARMOR[item] || 0), 0);
}

function fireballRecharge() {
  return FIREBALL_COOLDOWN - (PET_UPGRADES[progress.pet.pet] || 0);
}

function formatNumber(value) {
  return value.toLocaleString("en", { maximumFractionDigits: 2 });
}
const SLIME_FLASH_TIME = 0.14;
let fireballs, fireballCooldown, aim;
function updateFireballStatus() {
  const text = fireballCooldown > 0
    ? "Fireball · " + (Math.ceil(fireballCooldown * 10) / 10).toLocaleString("en") + " s"
    : "Fireball ready · " + formatNumber(fireballRecharge()) + " s recharge";
  if (fireballStatus.textContent !== text) fireballStatus.textContent = text;
}

function shootFireball() {
  if (fireballCooldown > 0) return;
  fireballs.push({
    x: dragon.x, y: dragon.y,
    vx: aim.x * FIREBALL_SPEED, vy: aim.y * FIREBALL_SPEED,
    life: FIREBALL_LIFETIME,
  });
  fireballCooldown = fireballRecharge();
  updateFireballStatus();
}

function updateFireballs(dt) {
  if (fireballCooldown > 0) {
    fireballCooldown = fireballCooldown <= dt + 1e-9 ? 0 : fireballCooldown - dt;
    updateFireballStatus();
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
    damageSlime(hit, FIREBALL_DAMAGE);
    return false;
  });
}


const SWING_TIME = 0.16;
let meleeCooldown, swing;

function damageSlime(slime, damage) {
  slime.health = Math.max(0, slime.health - damage);
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
    showFeedback("No weapon equipped");
    return;
  }
  if (meleeCooldown > 0) return;
  const { x, y } = facingTile;
  const { damage, range, cooldown } = WEAPONS[weapon];
  meleeCooldown = cooldown;
  swing = { x, y, time: SWING_TIME, hand, weapon };
  for (const slime of slimes) {
    const dx = slime.x - player.x;
    const dy = slime.y - player.y;
    const gap = Math.hypot(dx, dy);
    if (slime.health > 0 && gap <= range && dx * x + dy * y >= gap * 0.45 &&
        clearAttackPath(player, slime)) damageSlime(slime, damage);
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
      const damage = Math.max(0.5, 1 - totalDefense() * 0.125);
      player.hearts = Math.max(0, player.hearts - damage);
      protection = 1.1;
      updateHud();
      status.textContent = formatNumber(player.hearts) + " hearts left.";
      if (player.hearts === 0) {
        finish("lost", "You ran out of hearts");
        break;
      }
    }
  }
}

