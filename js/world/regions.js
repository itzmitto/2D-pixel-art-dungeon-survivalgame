"use strict";

const TILE = 32;
const WORLD_COLUMNS = 64;
const WORLD_ROWS = 38;
const WORLD_WIDTH = WORLD_COLUMNS * TILE;
const WORLD_HEIGHT = WORLD_ROWS * TILE;

function worldCenter(x, y) {
  return { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE };
}

const ZONES = {
  village: "Lantern Hollow",
  cottage: "Cottage",
  river: "Blackwater Bridge",
  forest: "Gloamwood",
  ruins: "Briar Keep",
  undercroft: "The Undercroft",
  arena: "Warden's Court",
};

const COTTAGE = {
  left: 5, top: 10, right: 9, bottom: 13,
  door: worldCenter(7, 13),
  workbench: worldCenter(6, 11),
  bed: worldCenter(7, 11),
  chest: worldCenter(8, 11),
  spawn: worldCenter(7, 14),
  workbenchArrival: worldCenter(6, 12),
  chestArrival: worldCenter(8, 12),
};
const VILLAGE_HUTS = [
  { left: 3, top: 4, right: 6, bottom: 7 },
  { left: 11, top: 5, right: 15, bottom: 8 },
  { left: 4, top: 21, right: 8, bottom: 25 },
  { left: 11, top: 23, right: 14, bottom: 26 },
];
const VILLAGE_BUILD_BOUNDS = { left: 1, top: 2, right: 17, bottom: 35 };

const WORLD_GATES = { G: worldCenter(49, 26), X: worldCenter(48, 32) };
const KEY_POSITION = worldCenter(47, 20);
const POTION_POSITION = worldCenter(45, 9);
const CHEST_LOCATIONS = {
  house: { position: COTTAGE.chest, arrival: COTTAGE.chestArrival },
  dungeon1: { position: worldCenter(38, 21), arrival: worldCenter(38, 22) },
  dungeon2: { position: worldCenter(52, 9), arrival: worldCenter(52, 10) },
  dungeon3: { position: worldCenter(60, 29), arrival: worldCenter(60, 30) },
};

// Preserve the old room offsets for existing heroes, buildings and unclaimed drops.
const LEGACY_OFFSETS = {
  forest: { x: 3, y: 9 },
  dungeon1: { x: 35, y: 18 },
  dungeon2: { x: 43, y: 4 },
  dungeon3: { x: 48, y: 27 },
};
const LEGACY_ARRIVALS = {
  forest: COTTAGE.spawn,
  house: worldCenter(7, 12),
  dungeon1: worldCenter(36, 26),
  dungeon2: worldCenter(44, 12),
  dungeon3: worldCenter(59, 28),
};
const LEGACY_FOREST = [
  "###############",
  "#.Y..Y....Y.Y.#",
  "#.HHHH.....QGQ#",
  "#.HHHH....==R.#",
  "#.HHUH..===...#",
  "#..+P====.....#",
  "#..Y.Y..Y.Y.MN#",
  "#.Y...Y...N..N#",
  "#...Y....YMYN.#",
  "###############",
];

function legacyWorldPoint(oldArea, point) {
  if (oldArea === "house") {
    const x = Math.max(6, Math.min(8, Math.floor(point.x / TILE)));
    return worldCenter(x, 12);
  }
  const offset = LEGACY_OFFSETS[oldArea];
  return offset ? { x: point.x + offset.x * TILE, y: point.y + offset.y * TILE } : COTTAGE.spawn;
}

const WORLD_ENEMY_SPAWNS = [
  ["forest:wolf:0", "wolf", 27, 13, "forest"],
  ["forest:wolf:1", "wolf", 29, 20, "forest"],
  ["forest:wolf:2", "wolf", 33, 10, "forest"],
  ["forest:wolf:3", "wolf", 35, 31, "forest"],
  ["dungeon1:slime:0", "wolf", 45, 25, "ruins"],
  ["dungeon1:slime:1", "snake", 45, 20, "ruins"],
  ["dungeon2:slime:0", "snake", 45, 7, "undercroft"],
  ["dungeon2:slime:1", "wolf", 53, 11, "undercroft", true],
  ["dungeon2:slime:2", "snake", 55, 7, "undercroft", true],
  ["dungeon2:guard:0", "snake", 55, 10, "undercroft", true],
  ["dungeon3:warden", "warden", 55, 32, "arena"],
].map(([id, kind, x, y, zone, veteran = false]) => ({ id, kind, ...worldCenter(x, y), zone, veteran }));

const RUIN_LAYOUTS = {
  dungeon1: [
    "###############",
    "#%%%%%%%%%%%%%#",
    "#%###%T%%%%%K%#",
    "#%%C%%#%%%%%%%#",
    "#%%%%%#%%%##%%#",
    "#%###%%%%%#%%%#",
    "#%%%T%%%%%T%%%#",
    "#%%%%%%%%%%%%%#",
    "%%%%%%%%%%%%%%G",
    "###############",
  ],
  dungeon2: [
    "###############",
    "#%%%%%#%%%%%%%%",
    "#%##%%#%%###%%#",
    "#%%%%%#%%%%%%%#",
    "####%T#%%##%%%#",
    "##V#%%%%%C%%%%#",
    "##%#%####%%%%%#",
    "##%#%%%%%%%%%%#",
    "%%%%%%%%%%%%%%#",
    "###############",
  ],
  dungeon3: [
    "###########%###",
    "#%%%%%%%%%%%%%#",
    "#%%%%#%%%#%%C%#",
    "#%%%%%%%%%%%%%#",
    "#%%%%%%%%%%%%%#",
    "X%%%%%%%%%%%%%#",
    "#%%%%%%%%%%%%%#",
    "#%%%%#%%%#%%%%#",
    "#%%%%%%%%%%%%%#",
    "###############",
  ],
};

function inTileBounds(x, y, bounds) {
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}

function makeWorldMap() {
  const map = Array.from({ length: WORLD_ROWS }, () => Array(WORLD_COLUMNS).fill("."));
  const horizontal = (y, left, right, tile) => {
    for (let x = left; x <= right; x++) map[y][x] = tile;
  };
  const vertical = (x, top, bottom, tile) => {
    for (let y = top; y <= bottom; y++) map[y][x] = tile;
  };
  const fill = ({ left, top, right, bottom }, tile) => {
    for (let y = top; y <= bottom; y++) horizontal(y, left, right, tile);
  };
  const place = (tile, points) => {
    for (const [x, y] of points) map[y][x] = tile;
  };

  horizontal(0, 0, WORLD_COLUMNS - 1, "#");
  horizontal(WORLD_ROWS - 1, 0, WORLD_COLUMNS - 1, "#");
  vertical(0, 0, WORLD_ROWS - 1, "#");
  vertical(WORLD_COLUMNS - 1, 0, WORLD_ROWS - 1, "#");

  // The river seals the western village. Its bridge is two tiles wide.
  for (let y = 1; y < WORLD_ROWS - 1; y++) {
    const bank = 19 + Math.round(Math.sin(y * 0.36));
    horizontal(y, bank, bank + 3, "~");
  }
  for (const y of [16, 17]) horizontal(y, 18, 23, "+");

  fill({ left: 3, top: 15, right: 17, bottom: 17 }, ":");
  horizontal(14, 6, 10, ":");
  vertical(10, 5, 32, ":");
  horizontal(8, 4, 10, ":");
  horizontal(9, 10, 15, ":");
  horizontal(20, 6, 14, ":");
  vertical(6, 18, 20, ":");
  horizontal(27, 6, 16, ":");
  vertical(16, 17, 32, ":");
  VILLAGE_HUTS.forEach(hut => fill(hut, "H"));
  fill(COTTAGE, "H");
  fill({ left: 6, top: 11, right: 8, bottom: 12 }, "I");
  place("W", [[6, 11]]);
  place("B", [[7, 11]]);
  place("O", [[8, 11]]);
  place("U", [[7, 13]]);
  place("L", [[3, 15], [8, 15], [12, 14], [15, 15], [17, 16], [17, 18], [4, 20], [11, 21], [15, 27]]);

  horizontal(16, 24, 36, "=");
  horizontal(17, 24, 27, "=");
  vertical(32, 8, 32, "=");
  horizontal(26, 31, 35, "=");
  horizontal(10, 25, 32, "=");
  vertical(25, 10, 16, "=");
  vertical(27, 18, 28, "=");
  horizontal(20, 27, 32, "=");
  horizontal(28, 27, 32, "=");
  horizontal(32, 28, 47, "=");
  vertical(28, 28, 32, "=");
  place("L", [[24, 15], [30, 16], [32, 24], [33, 26], [46, 32]]);

  // Woodland glades and rock outcrops frame the dirt paths and the old walls.
  const groves = [
    [2, 2, 3, 2], [7, 3, 3, 2], [14, 3, 4, 2], [1, 11, 3, 3],
    [2, 28, 4, 4], [7, 32, 4, 3], [13, 29, 3, 4], [16, 10, 2, 3],
    [24, 2, 10, 5], [23, 7, 6, 3], [27, 11, 4, 2], [29, 13, 2, 3],
    [34, 7, 7, 4], [35, 12, 5, 4], [24, 19, 3, 7], [28, 22, 3, 5],
    [24, 29, 4, 6], [33, 28, 6, 3], [36, 33, 8, 3], [42, 1, 16, 2],
    [58, 11, 4, 6], [60, 17, 3, 6], [39, 12, 3, 5], [51, 18, 3, 4],
  ];
  for (const [left, top, width, height] of groves) {
    for (let y = top; y < top + height; y++) {
      for (let x = left; x < left + width; x++) {
        if (map[y][x] !== "." || (x * 11 + y * 7 + x * y) % 7 > 4) continue;
        map[y][x] = (x * 9 + y * 13) % 11 === 0 ? "Q" : "Y";
      }
    }
  }

  for (const [id, rows] of Object.entries(RUIN_LAYOUTS)) {
    const { x, y } = LEGACY_OFFSETS[id];
    rows.forEach((row, j) => [...row].forEach((tile, i) => { map[y + j][x + i] = tile; }));
  }

  // Masonry closes the routes between wings so the locked gate cannot be bypassed.
  const passages = [
    [[50, 26], [52, 26], [52, 15], [41, 15], [41, 12], [42, 12]],
    [[58, 5], [59, 5], [59, 27]],
  ];
  for (const points of passages) {
    const cells = [];
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i - 1];
      const [endX, endY] = points[i];
      const length = Math.abs(endX - x) + Math.abs(endY - y);
      for (let n = 0; n <= length; n++) cells.push([x + n * Math.sign(endX - x), y + n * Math.sign(endY - y)]);
    }
    place("%", cells);
    for (const [x, y] of cells) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const tile = map[y + dy][x + dx];
        if (".YQ".includes(tile)) map[y + dy][x + dx] = "#";
      }
    }
  }
  place("T", [[36, 25], [43, 19], [48, 24], [52, 25], [52, 19], [49, 15], [43, 15],
    [44, 11], [50, 8], [56, 6], [59, 8], [59, 16], [59, 24], [58, 29], [49, 31], [60, 34]]);

  // The west side of the river stays safe, and encounter centers stay clear of scenery.
  for (const { x, y, zone } of WORLD_ENEMY_SPAWNS) {
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    if (zone === "forest" && "YQ".includes(map[row][col])) map[row][col] = ".";
  }
  return map.map(row => row.join(""));
}

const WORLD_MAP = makeWorldMap();

function regionAt({ x, y }) {
  const floor = towerFloorAt({ y });
  if (floor) return floor.id;
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  if (inTileBounds(col, row, COTTAGE) && "IUWBO".includes(WORLD_MAP[row]?.[col] || "#")) return "cottage";
  if (col <= 17) return "village";
  if (col <= 23) return "river";
  if (col >= 48 && col <= 62 && row >= 27 && row <= 36) return "arena";
  if ((col >= 43 && col <= 59 && row >= 4 && row <= 13) || (col === 59 && row < 27) ||
      (col >= 41 && col <= 52 && row >= 12 && row <= 15) || (col >= 50 && col <= 52 && row <= 26 && row >= 15)) {
    return "undercroft";
  }
  if (col >= 35 && col <= 49 && row >= 18 && row <= 27) return "ruins";
  return "forest";
}

function canBuildTile(x, y) {
  return inTileBounds(x, y, VILLAGE_BUILD_BOUNDS) && WORLD_MAP[y]?.[x] === ".";
}
