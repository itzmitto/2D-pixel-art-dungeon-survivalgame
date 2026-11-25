"use strict";

const FOLLOW_DELAY = 0.28;
const FOLLOW_DISTANCE = 23;
let player, dragon, trail, facingTile;

function placeParty(position, health = player?.hearts ?? 3) {
  clearMouseRoute();
  const spawn = safeWorldPoint(position, progress);
  facingTile = aim = { x: 0, y: -1 };
  player = { ...spawn, radius: 8, facing: 1, hearts: health, walkTime: 0 };
  const dragonSpawn = [[0, 1], [-1, 0], [1, 0], [0, -1]].map(([x, y]) => ({
    x: spawn.x + x * FOLLOW_DISTANCE, y: spawn.y + y * FOLLOW_DISTANCE,
  })).find(point => !blocked(point.x, point.y, 8));
  dragon = { ...(dragonSpawn || spawn), facing: 1 };
  trail = [{ ...dragon, time: elapsed }, { ...spawn, time: elapsed }];
  progress.position = spawn;
  region = regionAt(player);
  snapCamera();
  updateHud();
}

function followDragon(dt) {
  if (distance(player, trail.at(-1)) > 0) {
    trail.push({ x: player.x, y: player.y, time: elapsed });
  }
  let remaining = (sprinting() ? 250 : 125) * dt;
  while (remaining > 0 && trail[0].time <= elapsed - FOLLOW_DELAY) {
    const target = trail[0];
    const gap = distance(dragon, target);
    if (gap < 0.001) {
      if (trail.length === 1) break;
      trail.shift();
      continue;
    }
    const step = Math.min(gap, remaining, distance(player, dragon) - FOLLOW_DISTANCE);
    if (step < 0.001) break;
    const dx = target.x - dragon.x;
    dragon.x += dx * step / gap;
    dragon.y += (target.y - dragon.y) * step / gap;
    if (dx) dragon.facing = Math.sign(dx);
    remaining -= step;
  }
}
