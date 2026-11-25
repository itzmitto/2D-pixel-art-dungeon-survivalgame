"use strict";

// Atlas bands keep saved coordinates distinct. Only the current floor is drawn.
const TOWER_FLOORS = [
  { id: "watch", name: "Briar Watch · Lower floor", rows: [
    "###############",
    "#%%%%T%%%%%%%S#",
    "#%%%%#%%%%%#%%#",
    "#%%C%#%%%%%%%%#",
    "#%%%%####%%%%%#",
    "#%%%%%%%%%%%%%#",
    "#%%%%%#%%%%%%%#",
    "#%%%%%%%%%%T%%#",
    "#%D%%%%%%%%%%%#",
    "###############",
  ] },
  { id: "watchTop", name: "Briar Watch · Belfry", rows: [
    "###############",
    "#%%%%%%%%T%%C%#",
    "#%%%%%%%%%%%%%#",
    "#%%%%%%%%%%%%%#",
    "#%%%%%%%%%%%%%#",
    "#%%%%%%%%%%%%%#",
    "#%%%%%#%%%%%%%#",
    "#%%%%%%%%%%%%%#",
    "#%D%%%%%%%%%%%#",
    "###############",
  ] },
  { id: "fen", name: "Fen Spire · Cistern", rows: [
    "###############",
    "#%T%%%%%%C%%%%#",
    "#%##%~~~~~%##%#",
    "#%%%%~~~~~%%%%#",
    "#%%%%~~~~~%%%%#",
    "#%%%%%+++%%%%%#",
    "#%%%%~~~~~%%%%#",
    "#%##%~~~~~%##%#",
    "#%%%%%D%%%%%%%#",
    "###############",
  ] },
];
for (const [index, floor] of TOWER_FLOORS.entries()) {
  floor.top = WORLD_ROWS + 4 + index * 14;
  ZONES[floor.id] = floor.name;
}
function towerFloorAt({ y }) {
  const row = Math.floor(y / TILE);
  return TOWER_FLOORS.find(floor => row >= floor.top && row < floor.top + floor.rows.length);
}
function towerPoint(id, x, y) {
  return worldCenter(x, TOWER_FLOORS.find(floor => floor.id === id).top + y);
}

const TOWER_LANDMARKS = [
  { name: "Briar Watch", left: 35, right: 39, top: 3, bottom: 6, door: worldCenter(37, 6) },
  { name: "Fen Spire", left: 27, right: 31, top: 34, bottom: 36, door: worldCenter(29, 36) },
];
const TOWER_CONNECTIONS = [
  [TOWER_LANDMARKS[0].door, towerPoint("watch", 2, 8), towerPoint("watch", 2, 7), worldCenter(37, 7)],
  [towerPoint("watch", 13, 1), towerPoint("watchTop", 2, 8), towerPoint("watchTop", 2, 7), towerPoint("watch", 13, 2)],
  [TOWER_LANDMARKS[1].door, towerPoint("fen", 6, 8), towerPoint("fen", 5, 8), worldCenter(26, 36)],
].flatMap(([door, farDoor, arrival, returnArrival]) => [[door, arrival], [farDoor, returnArrival]]);

const TOWER_CHESTS = {
  watch: { name: "Watch provisions", position: towerPoint("watch", 3, 3), arrival: towerPoint("watch", 3, 4),
    loot: [["wolfFang", 2], ["wood", 4], ["copper", 3], ["potion", 2], ["stoneSword", 1]] },
  watchTop: { name: "Bellkeeper's reward", position: towerPoint("watchTop", 12, 1), arrival: towerPoint("watchTop", 12, 2),
    loot: [], boss: "watchTop:boss" },
  fen: { name: "Cistern cache", position: towerPoint("fen", 9, 1), arrival: towerPoint("fen", 10, 1),
    loot: [["copperBoots", 1], ["serpentScale", 3], ["copper", 4], ["potion", 2]] },
};

function towerTrail(x, y) {
  return (x === 24 && y >= 16 && y <= 32) || (y === 32 && x >= 24 && x <= 26) || (x === 32 && y >= 7 && y <= 16) || (y === 7 && x >= 32 && x <= 37) ||
    (x === 26 && y >= 32 && y <= 36) || (y === 32 && x >= 26 && x <= 28) ||
    (y === 36 && x >= 26 && x <= 29);
}
