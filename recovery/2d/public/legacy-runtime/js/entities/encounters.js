"use strict";

const MOB_LOOT = {
  wolf: { item: "wolfFang", count: 2 },
  snake: { item: "serpentScale", count: 2 },
};
const ENCOUNTER_POOLS = {
  forest: ["wolf", "wolf", "snake"],
  undercroft: ["snake", "snake", "wolf"],
  watch: ["wolf", "snake"],
  fen: ["snake", "snake", "wolf"],
};
const POOLED_SPAWNS = [
  ["forest:path", "forest", worldCenter(31, 17)],
  ["undercroft:alcove", "undercroft", worldCenter(54, 5)],
  ["watch:guard", "watch", towerPoint("watch", 7, 5)],
  ["watch:scout", "watch", towerPoint("watch", 11, 6)],
  ["fen:east", "fen", towerPoint("fen", 12, 5)],
  ["fen:north", "fen", towerPoint("fen", 5, 1)],
];
function encounterSpawns(state) {
  const pooled = POOLED_SPAWNS.map(([id, zone, point], index) => {
    const pool = ENCOUNTER_POOLS[zone];
    const roll = (state.encounterSeed >>> ((index * 5) % 27)) + index;
    return { id, zone, ...point, kind: pool[roll % pool.length], veteran: zone === "undercroft" };
  });
  return [...WORLD_ENEMY_SPAWNS, ...pooled,
    { id: "watchTop:boss", kind: "warden", zone: "watchTop", ...towerPoint("watchTop", 9, 3) }];
}

function bossReward(id) {
  if (id === WARDEN_ID) return { chest: "dungeon3", loot: [{ item: "emberCore", count: 1 }] };
  return { chest: "watchTop", loot: [{ item: "emberCore", count: 1 }, { item: "copperSword", count: 1 }] };
}
