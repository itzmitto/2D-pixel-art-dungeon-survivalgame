import { useSyncExternalStore } from 'react';
import { getSnapshot, subscribe } from '../game/core/bridge';
import type { GameSnapshot } from '../game/core/bridge';

const EMPTY_SNAPSHOT: GameSnapshot = {
  revision: 0,
  progress: {
    bag: Array(27).fill(null), hotbar: Array(9).fill(null), chest: Array(27).fill(null), dungeonChests: {},
    bagCraft: Array(4).fill(null), benchCraft: Array(9).fill(null),
    hands: { left: null, right: null }, armor: { helmet: null, chestplate: null, boots: null }, pet: { pet: null },
    held: null, panelMode: null, chestId: null, selectedHotbar: 0, overflow: { bag: {}, chest: {} },
  },
  hearts: 3, defense: 0, region: 'Ashen Wilds', fireballLabel: 'Fireball ready',
  action: null, feedback: '', panelMessage: '', phase: 'playing', result: '', boss: null,
  hasKey: false, fullscreen: false, canBuild: false,
};

export function useGameSnapshot(): GameSnapshot {
  return useSyncExternalStore(subscribe, () => getSnapshot() ?? EMPTY_SNAPSHOT, () => EMPTY_SNAPSHOT);
}
