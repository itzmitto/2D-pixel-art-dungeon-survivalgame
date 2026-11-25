import type { ItemId } from '../types/items.ts';
import type { ItemStack, SlotRef } from '../items/inventoryModel.ts';

export interface GameActionView {
  readonly kind: 'pickup' | 'locked' | 'bench' | 'chest';
  readonly hint: string;
  readonly chestId?: string;
}
export interface BossView {
  readonly name: string;
  readonly health: number;
  readonly maxHealth: number;
  readonly cue: string;
}
export interface ProgressView {
  readonly bag: readonly (ItemStack | null)[];
  readonly hotbar: readonly (ItemStack | null)[];
  readonly chest: readonly (ItemStack | null)[];
  readonly dungeonChests: Readonly<Record<string, readonly (ItemStack | null)[]>>;
  readonly bagCraft: readonly (ItemStack | null)[];
  readonly benchCraft: readonly (ItemStack | null)[];
  readonly hands: Readonly<Record<'left' | 'right', ItemId | null>>;
  readonly armor: Readonly<Record<'helmet' | 'chestplate' | 'boots', ItemId | null>>;
  readonly pet: Readonly<{ pet: ItemId | null }>;
  readonly held: (ItemStack & { source: SlotRef | null }) | null;
  readonly panelMode: 'bag' | 'chest' | 'workbench' | null;
  readonly chestId: string | null;
  readonly selectedHotbar: number;
  readonly overflow: Readonly<{ bag: Readonly<Record<string, number>>; chest: Readonly<Record<string, number>> }>;
}
export interface GameSnapshot {
  readonly revision: number;
  readonly progress: ProgressView;
  readonly hearts: number;
  readonly defense: number;
  readonly region: string;
  readonly fireballLabel: string;
  readonly action: GameActionView | null;
  readonly feedback: string;
  readonly panelMessage: string;
  readonly phase: 'playing' | 'won' | 'lost';
  readonly result: string;
  readonly boss: BossView | null;
  readonly hasKey: boolean;
  readonly fullscreen: boolean;
  readonly canBuild: boolean;
}

export interface GameEngineBridge {
  getSnapshot(): GameSnapshot;
  start(canvas: HTMLCanvasElement | null): void;
  subscribe(listener: () => void): () => void;
  selectHotbar(index: number): void;
  toggleInventory(): void;
  closeInventory(): boolean;
  clickSlot(ref: SlotRef, options?: { single?: boolean; shift?: boolean }): void;
  takeCraftOutput(): void;
  drinkPotion(): void;
  recoverOverflow(): void;
  build(): void;
  reset(): void;
  clearProgress(): void;
  toggleFullscreen(): void;
  stop(): void;
}

const listeners = new Set<() => void>();
let detachFromEngine: (() => void) | undefined;
let waitingForReady = false;

function notifySubscribers(): void {
  for (const listener of listeners) listener();
}

function connectToEngine(): void {
  waitingForReady = false;
  detachFromEngine?.();
  detachFromEngine = window.vonkje?.subscribe(notifySubscribers);
  notifySubscribers();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (window.vonkje) connectToEngine();
  else if (!waitingForReady) {
    waitingForReady = true;
    window.addEventListener('vonkje-ready', connectToEngine, { once: true });
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      detachFromEngine?.();
      detachFromEngine = undefined;
      if (waitingForReady) window.removeEventListener('vonkje-ready', connectToEngine);
      waitingForReady = false;
    }
  };
}

export function getSnapshot(): GameSnapshot | null {
  return window.vonkje?.getSnapshot() ?? null;
}

export function engineBridge(): GameEngineBridge | undefined {
  return window.vonkje;
}
