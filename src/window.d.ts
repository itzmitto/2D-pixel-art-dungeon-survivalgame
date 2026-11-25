import type { GameEngineBridge } from './game/core/bridge';

declare global {
  interface Window {
    vonkje?: GameEngineBridge;
    vonkjeStop?: () => void;
  }
}

export {};
