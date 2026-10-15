/**
 * Centralised tuning and bindings. Change controls here (see README:
 * "Changing controls").
 */
import type { MovementTuning } from '../../lib/movement';

export type GameAction = 'up' | 'down' | 'left' | 'right' | 'interact' | 'pause' | 'mute' | 'hub';

/** KeyboardEvent.code values (physical keys, so WASD works on any layout). */
export const KEY_BINDINGS: Readonly<Record<GameAction, readonly string[]>> = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  interact: ['KeyE', 'Space', 'Enter', 'KeyF'],
  pause: ['Escape', 'KeyP'],
  mute: ['KeyM'],
  hub: ['KeyH'],
};

/** Human-readable labels used in prompts and help text. */
export const KEY_LABELS = {
  interact: 'E',
  pause: 'Esc',
  mute: 'M',
  hub: 'H',
} as const;

export const MOVEMENT: MovementTuning = { speed: 92, accel: 900, decel: 1400 };

/** The player's solid footprint inside its 16x24 frame. */
export const PLAYER_BODY = { w: 10, h: 6, offsetX: 3, offsetY: 18 } as const;

/** Ignore interaction presses for this long after a dialog closes. */
export const RESUME_GRACE_MS = 150;

export const FOOTSTEP_INTERVAL_MS = 290;

export const DEPTH = {
  ground: 0,
  carpet: 1,
  shadow: 2,
  floorProp: 3,
  walls: 4,
  wallProp: 5,
  /** Objects and the player are y-sorted above this. */
  objects: 10,
  overlay: 100_000,
} as const;

export const AUDIO = {
  musicVolume: 0.32,
  sfxVolume: 0.6,
  stepVolume: 0.18,
} as const;

export const ASSET_ROOT = 'game';
