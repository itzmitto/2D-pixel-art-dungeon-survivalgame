export type SpriteId =
  | 'knight' | 'dragon' | 'wolf' | 'wolfIdle' | 'wolfAttack' | 'snake' | 'warden'
  | 'supplyClosed' | 'supplyOpen' | 'rewardClosed' | 'rewardOpen' | 'grass' | 'trees' | 'stump'
  | 'rocks' | 'dungeonStone' | 'workbench' | 'chest' | 'bed' | 'torch' | 'cottage'
  | 'houseDoor' | 'porch' | 'houseWall' | 'houseFloor' | 'rug';

export interface SpriteSheetDefinition {
  readonly path: string;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly columns: number;
  readonly rows: number;
}

export interface LoadedSpriteSheet extends SpriteSheetDefinition {
  readonly image: HTMLImageElement;
}

export interface DrawOptions {
  readonly frame?: number;
  readonly row?: number;
  readonly facing?: 1 | -1;
  readonly width?: number;
  readonly height?: number;
}

export const SPRITE_IDS = [
  'knight', 'dragon', 'wolf', 'wolfIdle', 'wolfAttack', 'snake', 'warden', 'supplyClosed', 'supplyOpen',
  'rewardClosed', 'rewardOpen', 'grass', 'trees', 'stump', 'rocks', 'dungeonStone', 'workbench', 'chest',
  'bed', 'torch', 'cottage', 'houseDoor', 'porch', 'houseWall', 'houseFloor', 'rug',
] as const satisfies readonly SpriteId[];

export const SPRITE_SHEETS: Readonly<Record<SpriteId, SpriteSheetDefinition>> = {
  knight: { path: '/images/characters/knight-walk.png', frameWidth: 40, frameHeight: 40, columns: 6, rows: 4 },
  dragon: { path: '/images/pets/vonkje-flight.png', frameWidth: 256, frameHeight: 204, columns: 4, rows: 1 },
  wolf: { path: '/images/enemies/shadow-wolf.png', frameWidth: 134, frameHeight: 102, columns: 5, rows: 1 },
  wolfIdle: { path: '/images/third-party/wolf-enemy/wolf-idle-sprite-sheet.png', frameWidth: 320, frameHeight: 160, columns: 5, rows: 2 },
  wolfAttack: { path: '/images/third-party/wolf-enemy/wolf-attack-sprite-sheet.png', frameWidth: 320, frameHeight: 160, columns: 4, rows: 2 },
  snake: { path: '/images/enemies/cave-serpent.png', frameWidth: 134, frameHeight: 102, columns: 5, rows: 1 },
  warden: { path: '/images/third-party/superpowers-medieval-fantasy/cyclop.png', frameWidth: 32, frameHeight: 16, columns: 1, rows: 1 },
  supplyClosed: { path: '/images/third-party/superpowers-medieval-fantasy/wood-chest-close.png', frameWidth: 10, frameHeight: 8, columns: 1, rows: 1 },
  supplyOpen: { path: '/images/third-party/superpowers-medieval-fantasy/wood-chest-open.png', frameWidth: 10, frameHeight: 13, columns: 1, rows: 1 },
  rewardClosed: { path: '/images/third-party/superpowers-medieval-fantasy/gold-chest-close.png', frameWidth: 12, frameHeight: 9, columns: 1, rows: 1 },
  rewardOpen: { path: '/images/third-party/superpowers-medieval-fantasy/gold-chest-open.png', frameWidth: 12, frameHeight: 14, columns: 1, rows: 1 },
  grass: { path: '/images/terrain/grass.png', frameWidth: 102, frameHeight: 102, columns: 8, rows: 1 },
  trees: { path: '/images/terrain/trees.png', frameWidth: 40, frameHeight: 36, columns: 3, rows: 1 },
  stump: { path: '/images/terrain/stump.png', frameWidth: 29, frameHeight: 13, columns: 1, rows: 1 },
  rocks: { path: '/images/terrain/rocks.png', frameWidth: 102, frameHeight: 102, columns: 5, rows: 1 },
  dungeonStone: { path: '/images/terrain/dungeon.png', frameWidth: 102, frameHeight: 102, columns: 8, rows: 1 },
  workbench: { path: '/images/objects/workbench.png', frameWidth: 32, frameHeight: 32, columns: 1, rows: 1 },
  chest: { path: '/images/objects/chest.png', frameWidth: 32, frameHeight: 32, columns: 1, rows: 1 },
  bed: { path: '/images/objects/bed.png', frameWidth: 32, frameHeight: 32, columns: 1, rows: 1 },
  torch: { path: '/images/objects/torch.png', frameWidth: 32, frameHeight: 32, columns: 1, rows: 1 },
  cottage: { path: '/images/house/cottage.png', frameWidth: 128, frameHeight: 96, columns: 1, rows: 1 },
  houseDoor: { path: '/images/house/doors.png', frameWidth: 32, frameHeight: 32, columns: 2, rows: 1 },
  porch: { path: '/images/house/porch.png', frameWidth: 64, frameHeight: 32, columns: 1, rows: 1 },
  houseWall: { path: '/images/house/interior-wall.png', frameWidth: 352, frameHeight: 48, columns: 1, rows: 1 },
  houseFloor: { path: '/images/house/interior-floor.png', frameWidth: 32, frameHeight: 32, columns: 4, rows: 1 },
  rug: { path: '/images/house/rug.png', frameWidth: 114, frameHeight: 62, columns: 1, rows: 1 },
};

export class SpriteRegistry {
  readonly #images = new Map<SpriteId, HTMLImageElement>();

  constructor(private readonly imageFactory: () => HTMLImageElement = () => new Image()) {}

  async loadAll(): Promise<void> {
    await Promise.all(SPRITE_IDS.map(async (id) => {
      const definition = SPRITE_SHEETS[id];
      const image = this.imageFactory();
      await new Promise<void>((resolve) => {
        image.onload = () => {
          const validSize = image.naturalWidth === definition.frameWidth * definition.columns &&
            image.naturalHeight === definition.frameHeight * definition.rows;
          if (validSize) this.#images.set(id, image);
          resolve();
        };
        image.onerror = () => resolve();
        image.src = definition.path;
      });
    }));
  }

  has(id: SpriteId): boolean {
    return this.#images.has(id);
  }

  draw(
    context: CanvasRenderingContext2D,
    id: SpriteId,
    x: number,
    y: number,
    options: DrawOptions = {},
  ): boolean {
    const image = this.#images.get(id);
    if (!image) return false;
    const definition = SPRITE_SHEETS[id];
    const frame = Math.max(0, Math.min(definition.columns - 1, options.frame ?? 0));
    const row = Math.max(0, Math.min(definition.rows - 1, options.row ?? 0));
    const width = options.width ?? definition.frameWidth;
    const height = options.height ?? definition.frameHeight;
    const facing = options.facing ?? 1;
    context.save();
    context.imageSmoothingEnabled = false;
    context.translate(Math.round(x - width / 2) + (facing < 0 ? width : 0), Math.round(y - height / 2));
    context.scale(facing, 1);
    context.drawImage(image, frame * definition.frameWidth, row * definition.frameHeight,
      definition.frameWidth, definition.frameHeight, 0, 0, width, height);
    context.restore();
    return true;
  }

  drawTile(context: CanvasRenderingContext2D, id: SpriteId, x: number, y: number, variant: number, tileSize: number): boolean {
    const image = this.#images.get(id);
    if (!image) return false;
    const definition = SPRITE_SHEETS[id];
    const frame = Math.max(0, Math.min(definition.columns - 1, variant));
    context.imageSmoothingEnabled = false;
    context.drawImage(image, frame * definition.frameWidth, 0,
      definition.frameWidth, definition.frameHeight, x, y, tileSize, tileSize);
    return true;
  }
}

export function animationFrame(timeSeconds: number, framesPerSecond: number, frameCount: number): number {
  return frameCount > 0 ? Math.floor(timeSeconds * framesPerSecond) % frameCount : 0;
}

export function knightFrame(
  facing: Vec2Like,
  walkTime: number,
  moving: boolean,
  framesPerSecond = 10,
): { readonly row: number; readonly column: number } {
  const row = facing.y > 0 ? 0 : facing.x < 0 ? 1 : facing.x > 0 ? 2 : 3;
  return { row, column: moving ? animationFrame(walkTime, framesPerSecond, SPRITE_SHEETS.knight.columns) : 0 };
}

export interface Vec2Like { readonly x: number; readonly y: number }
