import { createGameLoop, browserFrameScheduler } from './loop.ts';
import * as camera from '../world/camera.ts';
import { insertStack } from '../items/inventoryModel.ts';
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
  getSnapshot(): GameSnapshot | null;
  start(canvas: HTMLCanvasElement, services: RuntimeServices): void;
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

export function createSnapshotStore() {
  let snapshot: GameSnapshot | null = null;
  let signature = '';
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    publish(view: Omit<GameSnapshot, 'revision'>) {
      const next = JSON.stringify(view);
      if (next === signature) return;
      signature = next;
      snapshot = { ...structuredClone(view), revision: (snapshot?.revision ?? 0) + 1 };
      for (const listener of listeners) listener();
    },
  };
}

export const runtimeServices = {
  createSnapshotStore,
  createLoop: (update: (dt: number) => void, render: (time: number) => void) =>
    createGameLoop({ scheduler: browserFrameScheduler, update, render }),
  camera,
  insertStack,
};
export type RuntimeServices = typeof runtimeServices;

export function subscribe(listener: () => void): () => void {
  let unsubscribe: (() => void) | undefined;
  const connect = () => {
    unsubscribe = window.vonkje?.subscribe(listener);
    listener();
  };
  if (window.vonkje?.getSnapshot()) connect();
  else window.addEventListener('vonkje-ready', connect, { once: true });
  return () => {
    window.removeEventListener('vonkje-ready', connect);
    unsubscribe?.();
  };
}

export function getSnapshot(): GameSnapshot | null {
  return window.vonkje?.getSnapshot() ?? null;
}
