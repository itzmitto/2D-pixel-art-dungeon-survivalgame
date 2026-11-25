"use strict";

const WOLF_BITE_RANGE = 22;
const WOLF_BITE_STEP = 8;
const WOLF_WINDUP = 0.36;
const WOLF_RECOVERY = 0.74;
const WOLF_IDLE_FRAME_RATE = 9;
const WOLF_STRIKE_FRAME = 4;

function updateWolf(enemy, dt) {
  const spec = ENEMIES.wolf;
  const gap = distance(enemy, player);
  if (!enemyMayEngage(enemy) || gap > spec.sight) {
    enemy.walkTime = 0;
    enemy.attackPose = false;
    enemy.bite = null;
    return;
  }

  if (enemy.bite) {
    const bite = enemy.bite;
    bite.age += dt;
    if (!bite.landed && bite.age >= WOLF_WINDUP) {
      bite.landed = true;
      move(enemy, bite.dx * WOLF_BITE_STEP, bite.dy * WOLF_BITE_STEP, false);
      if (distance(enemy, player) < spec.reach && clearAttackPath(enemy, player)) damagePlayer(spec.damage);
    }
    if (bite.age >= WOLF_WINDUP + WOLF_RECOVERY) {
      enemy.bite = null;
      enemy.attackPose = false;
    }
    return;
  }

  const { x, y } = enemy;
  const dx = (player.x - x) / (gap || 1);
  const dy = (player.y - y) / (gap || 1);
  if (gap <= WOLF_BITE_RANGE && clearAttackPath(enemy, player)) {
    if (dx) enemy.facing = Math.sign(dx);
    enemy.bite = { age: 0, dx, dy, landed: false };
    enemy.attackPose = true;
    enemy.walkTime = 0;
    return;
  }

  const step = Math.min(gap, spec.speed * dt);
  move(enemy, dx * step, dy * step, false);
  if (enemy.x !== x) enemy.facing = Math.sign(enemy.x - x);
  enemy.walkTime = enemy.x !== x || enemy.y !== y ? enemy.walkTime + dt : 0;
}

function drawWolf(enemy, time) {
  const { x, y, facing, health, walkTime } = enemy;
  const bite = health > 0 ? enemy.bite : null;
  if (bite && !bite.landed) {
    const left = Math.round(x) - 9;
    const top = Math.round(y) + 8;
    const fill = Math.round(18 * bite.age / WOLF_WINDUP);
    rect("#a16338", left, top, 18, 2);
    rect("#ffd083", left, top, fill, 2);
  }
  if (!bite && walkTime > 0) return false;

  const name = bite ? "wolfAttack" : "wolfIdle";
  const { columns, rows } = PNG_SPRITES[name];
  const frameCount = columns * rows;
  let frame = Math.floor(time * WOLF_IDLE_FRAME_RATE) % frameCount;
  if (bite) {
    if (bite.landed) {
      const progress = (bite.age - WOLF_WINDUP) / WOLF_RECOVERY;
      const remainingFrames = frameCount - WOLF_STRIKE_FRAME;
      frame = Math.min(frameCount - 1, WOLF_STRIKE_FRAME + Math.floor(progress * remainingFrames));
    } else {
      frame = Math.floor(bite.age / WOLF_WINDUP * WOLF_STRIKE_FRAME);
    }
  }
  // The supplied art faces left and keeps its paws at the same height in each cell.
  return drawPng(name, x, y - 1, frame % columns, Math.floor(frame / columns), -facing, 38, 19);
}
