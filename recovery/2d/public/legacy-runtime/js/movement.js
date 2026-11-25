"use strict";

const WALK_SPEED = 104;
const MAX_MOVE_STEP = 4;
const ROUTE_NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
let mouseRoute = [];

function clearMouseRoute() {
  mouseRoute.length = 0;
}

function tileAt({ x, y }) {
  return { x: Math.floor(x / TILE), y: Math.floor(y / TILE) };
}

function routeSegmentClear(from, to, walkable) {
  const steps = Math.ceil(distance(from, to) / (MAX_MOVE_STEP / 2));
  let previousX = from.x;
  let previousY = from.y;
  for (let i = 1; i <= steps; i++) {
    const x = from.x + (to.x - from.x) * i / steps;
    const y = from.y + (to.y - from.y) * i / steps;
    if (!walkable(x, previousY) || !walkable(previousX, y) || !walkable(x, y)) return false;
    previousX = x;
    previousY = y;
  }
  return true;
}

function findMouseRoute(target) {
  const start = tileAt(player);
  const goal = tileAt(target);
  const startId = tileId(start.x, start.y);
  const walkable = (x, y) => !blocked(x, y, player.radius);
  if (!walkable(target.x, target.y)) return null;
  if (routeSegmentClear(player, target, walkable)) return [target];

  const queue = [{ ...start, parent: null }];
  const seen = new Set([startId]);
  let end;
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    if (node.x === goal.x && node.y === goal.y) {
      end = node;
      break;
    }
    for (const [dx, dy] of ROUTE_NEIGHBORS) {
      const x = node.x + dx;
      const y = node.y + dy;
      const id = tileId(x, y);
      const center = centerOf({ x, y });
      if (seen.has(id) || !walkable(center.x, center.y)) continue;
      seen.add(id);
      queue.push({ x, y, parent: node });
    }
  }
  if (!end) return null;

  const corners = [target];
  for (let node = end; node; node = node.parent) corners.push(centerOf(node));
  corners.reverse();
  const route = [];
  let from = player;
  for (let i = 0; i < corners.length;) {
    let next = corners.length - 1;
    while (next > i && !routeSegmentClear(from, corners[next], walkable)) next--;
    if (!routeSegmentClear(from, corners[next], walkable)) return null;
    from = corners[next];
    route.push(from);
    i = next + 1;
  }
  return route;
}

function setMouseRoute(target) {
  const route = findMouseRoute(target);
  mouseRoute = route || [];
  if (!route) showFeedback("Can't reach that spot");
}

function moveAlongRoute(budget) {
  let dx = 0;
  let dy = 0;
  while (budget > 1e-8 && mouseRoute.length) {
    const target = mouseRoute[0];
    const gap = distance(player, target);
    if (gap < 1e-8) {
      mouseRoute.shift();
      continue;
    }
    const step = Math.min(gap, budget, MAX_MOVE_STEP / 2);
    const x = player.x + (target.x - player.x) * step / gap;
    const y = player.y + (target.y - player.y) * step / gap;
    if (blocked(x, player.y, player.radius) || blocked(x, y, player.radius)) {
      clearMouseRoute();
      showFeedback("Can't reach that spot");
      break;
    }
    dx = (x - player.x) / step;
    dy = (y - player.y) / step;
    player.x = x;
    player.y = y;
    budget -= step;
    if (step === gap) mouseRoute.shift();
  }
  return { dx, dy };
}

function updatePlayer(dt) {
  const arrowsMove = !inventoryOpen();
  const down = (letter, arrow) => Number(pressed.has(letter) || (arrowsMove && pressed.has(arrow)));
  let dx = down("d", "arrowright") - down("a", "arrowleft");
  let dy = down("s", "arrowdown") - down("w", "arrowup");
  const drive = Math.hypot(dx, dy);
  const multiplier = sprinting() ? 2 : 1;
  const budget = WALK_SPEED * multiplier * dt;
  const { x, y } = player;

  if (drive) {
    clearMouseRoute();
    const steps = Math.ceil(budget / MAX_MOVE_STEP);
    for (let i = 0; i < steps; i++) move(player, dx * budget / drive / steps, dy * budget / drive / steps);
  } else {
    ({ dx, dy } = moveAlongRoute(budget));
  }

  if (dx || dy) {
    if (Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && facingTile.x)) {
      facingTile = { x: Math.sign(dx), y: 0 };
    } else {
      facingTile = { x: 0, y: Math.sign(dy) };
    }
  }
  if (dx) player.facing = Math.sign(dx);
  const traveled = Math.hypot(player.x - x, player.y - y);
  player.walking = traveled > 0;
  player.walkTime = player.walking ? player.walkTime + dt * multiplier : 0;
  if (player.walking) aim = { x: (player.x - x) / traveled, y: (player.y - y) / traveled };
}
