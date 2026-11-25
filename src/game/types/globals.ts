type Vec2 = { x: number; y: number };
type ItemId =
  | "wood" | "stone" | "copper" | "potion" | "gel" | "wolfFang" | "serpentScale" | "emberCore"
  | "axe" | "sword" | "stoneSword" | "copperSword" | "copperSpear" | "fangBlade"
  | "copperHelmet" | "copperChestplate" | "scaleArmor" | "copperBoots" | "copperPendant" | "emberCharm"
  | "pickaxe" | "fence" | "floor" | "torch";
type Stack = { item: ItemId; count: number };
type SavedStack = Stack & { source: SlotRef | null };
type ContainerName = "bag" | "hotbar" | "chest" | "bagCraft" | "benchCraft";
type SlotRef = { area: ContainerName | "equipment"; index: number | EquipmentKey; chestId?: string };
type EquipmentKey = "left" | "right" | "helmet" | "chestplate" | "boots" | "pet";
type EquipmentGroup = "hands" | "armor" | "pet";
type Buildable = "fence" | "floor" | "torch";
type Overflow = { bag: Partial<Record<ItemId, number>>; chest: Partial<Record<ItemId, number>> };
type EnemyKind = "wolf" | "snake" | "warden";
type AreaId = "village" | "cottage" | "river" | "forest" | "ruins" | "undercroft" | "arena" | "watch" | "watchTop" | "fen";
type Actor = Vec2 & { radius: number; facing: number; walkTime: number; walking?: boolean; flash?: number };
type PlayerActor = Actor & { hearts: number; walking: boolean };
type EnemyActor = Actor & {
  id: string; kind: EnemyKind; health: number; zone: AreaId; veteran?: boolean;
  attackPose?: boolean; bite?: WolfBite | null; attack?: WardenAttack | null; nextAttack?: "charge" | "slam";
};
type WolfBite = { age: number; dx: number; dy: number; landed: boolean };
type WardenAttack = {
  kind: "charge" | "slam"; origin: Vec2; end?: Vec2; phase: "windup" | "strike" | "recover";
  time: number; hit: boolean;
};
type GroundDrop = Stack & Vec2 & { id: string };
type MousePoint = Vec2;
type MapBounds = { left: number; top: number; right: number; bottom: number };
type ChestStation = {
  name: string; position: Vec2; arrival: Vec2; loot?: [ItemId, number][]; boss?: string;
};
type Progress = {
  version?: number;
  bag: (Stack | null)[]; hotbar: (Stack | null)[]; chest: (Stack | null)[];
  bagCraft: (Stack | null)[]; benchCraft: (Stack | null)[];
  hands: Record<"left" | "right", ItemId | null>;
  armor: Record<"helmet" | "chestplate" | "boots", ItemId | null>;
  pet: { pet: ItemId | null };
  held: SavedStack | null; panelMode: "bag" | "chest" | "workbench" | null;
  chestId: string | null; selectedHotbar: number; overflow: Overflow;
  trees: Record<string, number>; mines: Record<string, number>; buildings: Record<string, Buildable>;
  collected: Record<string, boolean>; dungeonCompleted: boolean; encounterSeed: number;
  dungeonEnemies: Record<string, SavedEnemy>; dungeonChests: Record<string, (Stack | null)[]>;
  legacyTrailLoot: boolean; position: Vec2;
};
type SavedEnemy = { health: number; x?: number; y?: number; drop?: Stack };
type RecipeCell = readonly [ItemId, number] | null;
type RecipeGrid = readonly RecipeCell[][];
type SpriteFrame = { path: string; width: number; height: number; columns: number; rows: number; image?: HTMLImageElement };
type SpriteId =
  | "knight" | "dragon" | "wolf" | "wolfIdle" | "wolfAttack" | "snake" | "warden"
  | "supplyClosed" | "supplyOpen" | "rewardClosed" | "rewardOpen" | "grass" | "trees" | "stump"
  | "rocks" | "dungeonStone" | "workbench" | "chest" | "bed" | "torch" | "cottage"
  | "houseDoor" | "porch" | "houseWall" | "houseFloor" | "rug";
type GameAction =
  | { kind: "pickup"; drop: GroundDrop; hint: string }
  | { kind: "locked"; hint: string }
  | { kind: "bench"; hint: string }
  | { kind: "chest"; id: string; hint: string }
  | null;
type BossView = { name: string; health: number; maxHealth: number; cue: string } | null;
type UiSnapshot = {
  revision: number; progress: Progress; hearts: number; defense: number; region: string;
  fireballLabel: string; action: GameAction; feedback: string; panelMessage: string;
  phase: "playing" | "won" | "lost"; result: string; boss: BossView;
};
type EngineListener = () => void;

const uiListeners = new Set<EngineListener>();
let uiRevision = 0;
let cachedUiSnapshot: UiSnapshot | null = null;
let endMessage = "";
let feedbackMessage = "";
let panelFeedbackMessage = "";
let feedbackTime = 0;
let fireballLabel = "Fireball ready";
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let progress: Progress;
let player: PlayerActor;
let dragon: Actor;
let region: AreaId;
let phase: "playing" | "won" | "lost" = "playing";
let elapsed = 0;
let protection = 0;
let enemies: EnemyActor[] = [];
let groundLoot: GroundDrop[] = [];
let hasKey = false;
let keyPosition: Vec2;
let potionPosition: Vec2 | undefined;
let fireballs: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
let fireballCooldown = 0;
let meleeCooldown = 0;
let swing: { x: number; y: number; time: number; duration: number; hand: "left" | "right"; weapon: ItemId } | undefined;
let aim: Vec2 = { x: 0, y: -1 };
let facingTile: Vec2 = { x: 0, y: -1 };
let mouseRoute: Vec2[] = [];
let positionDirty = false;
let timeSincePositionSave = 0;
let fireballText = "Fireball ready";
let gameCanvas: HTMLCanvasElement | null = null;
let cameraFollowX = 0;
let cameraFollowY = 0;
let camera = { x: 0, y: 0 };
let spriteAssets: Record<SpriteId, SpriteFrame>;

function publishUi(): void;
function updateHud(): void;
function updateInventory(): void;
function updateFireballStatus(): void;
function updateWardenHud(): void;
function updateBuildControls(): void;
function showFeedback(message: string): void;
function panelMessage(message: string): void;
function storeProgress(state?: Progress): void;
function notifyPanelState(): void;

function publishUi(): void {
  uiRevision++;
  cachedUiSnapshot = null;
  for (const listener of uiListeners) listener();
}

function currentUiSnapshot(): UiSnapshot {
  if (cachedUiSnapshot) return cachedUiSnapshot;
  const boss = enemies.find(enemy => enemy.kind === "warden" && enemy.zone === region && enemy.health > 0);
  cachedUiSnapshot = {
    revision: uiRevision,
    progress: structuredClone(progress),
    hearts: player?.hearts ?? 3,
    defense: totalDefense(),
    region: ZONES[region] ?? "Ashen Wilds",
    fireballLabel,
    action: getAction(),
    feedback: feedbackMessage,
    panelMessage: panelFeedbackMessage,
    phase,
    result: endMessage,
    boss: boss ? {
      name: boss.zone === "watchTop" ? "The Bellkeeper" : "Cyclops Warden",
      health: boss.health,
      maxHealth: ENEMIES.warden.health,
      cue: boss.attack ? boss.attack.phase === "recover" ? "Recovering" :
        (boss.attack.kind === "charge" ? "Charge · Sidestep" : "Ground slam · Back away") : "",
    } : null,
  };
  return cachedUiSnapshot;
}

interface EngineBridge {
  getSnapshot(): UiSnapshot;
  subscribe(listener: EngineListener): () => void;
  start(canvasElement: HTMLCanvasElement): void;
  stop(): void;
  keyDown(event: KeyboardEvent): void;
  keyUp(event: KeyboardEvent): void;
  blur(): void;
  pointerDown(event: MouseEvent): void;
  contextMenu(event: MouseEvent): void;
  wheel(event: WheelEvent): void;
  selectHotbar(index: number): void;
  toggleInventory(): void;
  closeInventory(): boolean;
  clickSlot(ref: SlotRef, options?: { single?: boolean; shift?: boolean }): void;
  takeCraftOutput(): void;
  drinkPotion(): void;
  recoverOverflow(): void;
  confirmNewGame(): void;
  importSave(text: string): void;
  exportSave(): string;
  setPanelMessage(message: string): void;
}
