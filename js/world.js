"use strict";

const WARDEN_ID = "dungeon3:warden";
const DUNGEON_KEY = "dungeon1:key";
const DUNGEON_POTION = "dungeon2:potion";
const CHEST_STATIONS = {
  house: { ...CHEST_LOCATIONS.house, name: "House chest" },
  dungeon1: {
    ...CHEST_LOCATIONS.dungeon1, name: "Supply chest",
    loot: [["wood", 14], ["stone", 8], ["copper", 8], ["wolfFang", 2], ["serpentScale", 1], ["potion", 2]],
  },
  dungeon2: {
    ...CHEST_LOCATIONS.dungeon2, name: "Reserve chest",
    loot: [["wood", 10], ["stone", 6], ["copper", 8], ["wolfFang", 1], ["serpentScale", 3], ["potion", 2]],
  },
  dungeon3: { ...CHEST_LOCATIONS.dungeon3, name: "Reward chest", loot: [] },
};
const DUNGEON_DROPS = { wolf: { item: "wolfFang", count: 2 }, snake: { item: "serpentScale", count: 2 } };
const LEGACY_RESOURCES = {
  Y: { state: "trees", hits: 3, item: "wood", count: 3 },
  M: { state: "mines", hits: 2, item: "stone", count: 3 },
  N: { state: "mines", hits: 3, item: "copper", count: 3 },
};
const FOREST_LOOT = [
  { id: "trail-wood", item: "wood", count: 2, ...worldCenter(6, 5) },
  { id: "trail-potion", item: "potion", count: 1, ...worldCenter(9, 4) },
];
let region, key, potion, enemies, elapsed, hasKey, protection, phase;
let groundLoot = [];
let positionDirty = false;
let timeSincePositionSave = 0;

function tileId(x, y) {
  return x + "," + y;
}

function centerOf({ x, y }) {
  return worldCenter(x, y);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function insideCottage(point) {
  return regionAt(point) === "cottage";
}

function wardenDefeated(state = progress) {
  return state?.dungeonEnemies[WARDEN_ID]?.health === 0;
}

function chestUnlocked(id) {
  return id !== "dungeon3" || wardenDefeated();
}

function enemyMayEngage(enemy) {
  return enemy.zone === region;
}

function enemyMaxHealth(enemy) {
  return ENEMIES[enemy.kind].health + (enemy.veteran ? 2 : 0);
}

function oldForestDrops() {
  const drops = progress.legacyTrailLoot ? [...FOREST_LOOT] : [];
  LEGACY_FOREST.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      const resource = LEGACY_RESOURCES[tile];
      const id = tileId(x, y);
      if (resource && progress[resource.state][id] === resource.hits) {
        drops.push({ id: "resource:" + id, item: resource.item, count: resource.count, ...worldCenter(x, y) });
      }
    });
  });
  return drops.filter(drop => !progress.collected[drop.id]).map(drop => ({
    ...drop, ...safeWorldPoint(legacyWorldPoint("forest", drop), progress, "village"),
  }));
}

function enemyDrop(id, { x, y, drop }) {
  return { id, x, y, ...drop };
}

function loadEnemies() {
  return WORLD_ENEMY_SPAWNS.flatMap(spawn => {
    const { id, kind } = spawn;
    const saved = progress.dungeonEnemies[id];
    if (saved?.health === 0) {
      if (saved.drop && !progress.collected[id]) groundLoot.push(enemyDrop(id, saved));
      return [];
    }
    return [{ ...spawn, radius: ENEMIES[kind].radius ?? 8, health: saved?.health ?? enemyMaxHealth(spawn),
      facing: 1, flash: 0, walkTime: 0 }];
  });
}

function startWorld(position) {
  groundLoot = oldForestDrops();
  enemies = loadEnemies();
  hasKey = progress.collected[DUNGEON_KEY] === true;
  key = KEY_POSITION;
  potion = progress.collected[DUNGEON_POTION] ? undefined : POTION_POSITION;
  fireballs = [];
  swing = undefined;
  elapsed = 0;
  positionDirty = false;
  timeSincePositionSave = 0;
  status.textContent = "";
  placeParty(position, 3);
}

function recordEnemyDamage({ id, kind, x, y, health }) {
  if (progress.dungeonEnemies[id]?.health === 0) return;
  if (health > 0) {
    progress.dungeonEnemies[id] = { health };
  } else if (id === WARDEN_ID) {
    progress.dungeonEnemies[id] = { health: 0 };
    progress.dungeonCompleted = true;
    progress.dungeonChests.dungeon3[0] = { item: "emberCore", count: 1 };
  } else {
    const defeat = { health: 0, x, y, drop: DUNGEON_DROPS[kind] };
    progress.dungeonEnemies[id] = defeat;
    groundLoot.push(enemyDrop(id, defeat));
  }
  storeProgress();
  if (id === WARDEN_ID) {
    updateWardenHud();
    if (health === 0) showFeedback("Cyclops Warden defeated. The reward chest and shortcut are open.");
  }
}

function buildSite() {
  const x = Math.floor(player.x / TILE) + facingTile.x;
  const y = Math.floor(player.y / TILE) + facingTile.y;
  const id = tileId(x, y);
  const center = worldCenter(x, y);
  const occupied = [player, dragon, ...groundLoot].some(actor =>
    Math.abs(actor.x - center.x) < TILE / 2 + 8 && Math.abs(actor.y - center.y) < TILE / 2 + 8);
  return { x, y, id, allowed: canBuildTile(x, y) && !progress.buildings[id] && !occupied && Boolean(selectedBuildItem()) };
}

function build() {
  if (phase !== "playing" || inventoryOpen() || region !== "village") return;
  const item = selectedBuildItem();
  if (!item) {
    showFeedback("Select a fence, floor tile or torch in the hotbar.");
    return;
  }
  const site = buildSite();
  if (!site.allowed) {
    showFeedback("You cannot build here.");
    return;
  }
  progress.buildings[site.id] = item;
  progress.hotbar[progress.selectedHotbar] = smallerStack(selectedStack(), 1);
  storeProgress();
  updateInventory();
  showFeedback(ITEMS[item].label + " placed.");
}

function nearbyLoot() {
  return groundLoot.filter(drop => distance(drop, player) < 22 &&
    clearAttackPath(player, drop)).sort((a, b) => distance(a, player) - distance(b, player))[0];
}

function getAction() {
  if (phase !== "playing" || inventoryOpen()) return null;
  const drop = nearbyLoot();
  if (drop) return { kind: "pickup", drop, hint: "E — Pick up · " + ITEMS[drop.item].label + " × " + drop.count };
  for (const [id, chest] of Object.entries(CHEST_STATIONS)) {
    if (id === "house" && !insideCottage(player)) continue;
    if (distance(player, chest.position) >= 38) continue;
    if (!chestUnlocked(id)) return { kind: "locked", hint: "Reward chest locked · Defeat the Warden" };
    return { kind: "chest", id, hint: "E — Open " + chest.name.toLowerCase() };
  }
  if (insideCottage(player)) {
    if (distance(player, COTTAGE.workbench) < 31) return { kind: "bench", hint: "E — Open workbench" };
    if (distance(player, COTTAGE.bed) < 36 && player.hearts < 3) return { kind: "rest", hint: "E — Rest" };
  }
  if (!hasKey && distance(player, KEY_GATE_POSITION) < 48) return { kind: "locked", hint: "Gate locked · Find the keep key" };
  return null;
}

function interact() {
  const action = getAction();
  switch (action?.kind) {
    case "pickup": pickUp(action.drop); break;
    case "locked": showFeedback(action.hint); break;
    case "bench": openInventory("workbench"); break;
    case "chest": openInventory("chest", action.id); break;
    case "rest":
      player.hearts = 3;
      updateHud();
      showFeedback("Rested · 3 hearts");
      break;
  }
}

function pickUp(drop) {
  if (!groundLoot.includes(drop)) return;
  if (!addItem(drop.item, drop.count)) {
    showFeedback("Backpack and hotbar are full.");
    return;
  }
  groundLoot = groundLoot.filter(other => other !== drop);
  if (drop.id) progress.collected[drop.id] = true;
  storeProgress();
  updateInventory();
  showFeedback(ITEMS[drop.item].label + " picked up.");
}

function updateWorld(dt) {
  if (player.x !== progress.position.x || player.y !== progress.position.y) {
    progress.position = { x: player.x, y: player.y };
    positionDirty = true;
  }
  timeSincePositionSave += dt;
  if (positionDirty && timeSincePositionSave >= 1) {
    storeProgress();
    positionDirty = false;
    timeSincePositionSave = 0;
  }
  const current = regionAt(player);
  if (current !== region) {
    region = current;
    updateHud();
  }
  if (!hasKey && distance(player, key) < 16) {
    hasKey = true;
    progress.collected[DUNGEON_KEY] = true;
    storeProgress();
    updateHud();
    status.textContent = "Keep key found. The gate to the undercroft is open.";
  }
  if (potion && player.hearts < 3 && distance(player, potion) < 16) {
    potion = undefined;
    progress.collected[DUNGEON_POTION] = true;
    player.hearts = Math.min(3, player.hearts + 1);
    storeProgress();
    updateHud();
    status.textContent = "Potion used. " + player.hearts + " of 3 hearts.";
  }
}
