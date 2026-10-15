import type { ArcadeDebugState } from '../game/scenes/MainScene';

declare global {
  interface Window {
    /** Development-only hook used by automated browser checks. */
    __ARCADE__?: {
      state: () => ArcadeDebugState;
      teleport: (x: number, y: number) => void;
    };
  }
}

export {};
