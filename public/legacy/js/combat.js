"use strict";

const FIREBALL_COOLDOWN = 1;
const FIREBALL_LIFETIME = 1;
const FIREBALL_SPEED = 220;
const FIREBALL_RADIUS = 4;
const FIREBALL_DAMAGE = 2;
const ENEMIES = {
  wolf: { health: 4, speed: 68, reach: 16, sight: 152, damage: 1 },
  snake: { health: 4, speed: 38, rushSpeed: 96, reach: 15, sight: 104, damage: 0.75 },
  warden: { health: 24, radius: 14 },
};
const WEAPONS = {
  axe: { damage: 2, range: 26, cooldown: 0.38, sprite: "axe" },
  sword: { damage: 2, range: 30, cooldown: 0.38, sprite: "sword" },
  stoneSword: { damage: 3, range: 30, cooldown: 0.38, sprite: "stoneSword" },
  copperSword: { damage: 4, range: 32, cooldown: 0.38, sprite: "copperSword" },
  copperSpear: { damage: 3, range: 47, cooldown: 0.65, sprite: "copperSpear" },
  fangBlade: { damage: 3, range: 30, cooldown: 0.25, swingTime: 0.12, sprite: "fangBlade" },
};
const ARMOR = { copperHelmet: 1, copperChestplate: 2, copperBoots: 1, scaleArmor: 3 };
const PET_UPGRADES = { copperPendant: 0.2, emberCharm: 0.4 };

function totalDefense() {
  return Object.values(progress.armor).reduce((total, item) => total + (ARMOR[item] || 0), 0);
}

function fireballRecharge() {
  return FIREBALL_COOLDOWN - (PET_UPGRADES[progress.pet.pet] || 0);
}

function formatNumber(value) {
  return value.toLocaleString("en", { maximumFractionDigits: 2 });
}
const ENEMY_FLASH_TIME = 0.14;
let fireballs, fireballCooldown, aim;
function updateFireballStatus() {
  const text = fireballCooldown > 0
    ? "Fireball · " + (Math.ceil(fireballCooldown * 10) / 10).toLocaleString("en") + " s"
    : "Fireball ready · " + formatNumber(fireballRecharge()) + " s recharge";
  if (fireballStatus.textContent !== text) fireballStatus.textContent = text;
}

function shootFireball() {
  if (phase !== "playing" || inventoryOpen() || fireballCooldown > 0) return;
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

  for (const enemy of enemies) enemy.flash = Math.max(0, enemy.flash - dt);
  enemies = enemies.filter(enemy => enemy.health > 0 || enemy.flash > 0);

  fireballs = fireballs.filter(ball => {
    const travelTime = Math.min(dt, ball.life);
    ball.x += ball.vx * travelTime;
    ball.y += ball.vy * travelTime;
    ball.life -= travelTime;
    if (blocked(ball.x, ball.y, FIREBALL_RADIUS)) return false;

    const hit = enemies.find(enemy => enemy.health > 0 &&
      distance(enemy, ball) < enemy.radius + FIREBALL_RADIUS);
    if (!hit) return ball.life > 1e-9;
    damageEnemy(hit, FIREBALL_DAMAGE);
    return false;
  });
}


const SWING_TIME = 0.16;
let meleeCooldown, swing;

function damageEnemy(enemy, damage) {
  if (enemy.health <= 0) return;
  enemy.health = Math.max(0, enemy.health - damage);
  enemy.flash = ENEMY_FLASH_TIME;
  recordEnemyDamage(enemy);
}

// Volg de lijn van de slag in kleine stappen zodat muren en gesloten deuren beschermen.
function clearAttackPath(from, to) {
  const steps = Math.ceil(distance(from, to) / 3);
  for (let i = 1; i <= steps; i++) {
    const x = from.x + (to.x - from.x) * i / steps;
    const y = from.y + (to.y - from.y) * i / steps;
    if (blocked(x, y, 0)) return false;
  }
  return true;
}

function melee(hand) {
  if (phase !== "playing" || inventoryOpen()) return;
  const weapon = progress.hands[hand];
  if (!weapon) {
    showFeedback("No weapon equipped");
    return;
  }
  if (meleeCooldown > 0) return;
  const { x, y } = facingTile;
  const { damage, range, cooldown, swingTime = SWING_TIME } = WEAPONS[weapon];
  meleeCooldown = cooldown;
  swing = { x, y, time: swingTime, duration: swingTime, hand, weapon };
  for (const enemy of enemies) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const gap = Math.hypot(dx, dy);
    if (enemy.health > 0 && gap <= range + enemy.radius - 8 && dx * x + dy * y >= gap * 0.45 &&
        clearAttackPath(player, enemy)) damageEnemy(enemy, damage);
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

function damagePlayer(rawDamage) {
  if (protection > 0 || phase !== "playing") return;
  const damage = Math.max(0.5, rawDamage - totalDefense() * 0.125);
  player.hearts = Math.max(0, player.hearts - damage);
  protection = 1.1;
  updateHud();
  status.textContent = formatNumber(player.hearts) + " hearts left.";
  if (player.hearts === 0) finish("lost", "You ran out of hearts");
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    if (enemy.health === 0 || phase !== "playing") continue;
    if (enemy.kind === "wolf") {
      updateWolf(enemy, dt);
      continue;
    }
    if (!enemyMayEngage(enemy)) {
      enemy.walkTime = 0;
      enemy.attackPose = false;
      if (enemy.kind === "warden") enemy.attack = null;
      continue;
    }
    if (enemy.kind === "warden") {
      updateWarden(enemy, dt);
      continue;
    }
    const spec = ENEMIES[enemy.kind];
    const gap = distance(enemy, player);
    if (gap > spec.sight) {
      enemy.walkTime = 0;
      enemy.attackPose = false;
      continue;
    }
    const { x, y } = enemy;
    enemy.attackPose = gap < 42;
    const speed = enemy.attackPose ? spec.rushSpeed : spec.speed;
    const chase = Math.min(gap, speed * dt) / (gap || 1);
    move(enemy, (player.x - x) * chase, (player.y - y) * chase, false);
    if (enemy.x !== x) enemy.facing = Math.sign(enemy.x - x);
    enemy.walkTime = enemy.x !== x || enemy.y !== y ? enemy.walkTime + dt : 0;
    if (protection === 0 && distance(player, enemy) < spec.reach && clearAttackPath(enemy, player)) {
      damagePlayer(spec.damage);
      if (phase !== "playing") break;
    }
  }
}

