/**
 * The typed contract between the Phaser game and the DOM UI. Event names are
 * defined once here; payload types are checked at every emit/on call site.
 */
import { EventBus } from '../../lib/EventBus';
import type { SfxKey } from '../config/assets';
import type { DialogContent } from '../data/types';

export const GameEvent = {
  /** Game -> UI: show a dialog for an exhibit, panel or easter egg. */
  ExhibitOpen: 'exhibit:open',
  /** UI -> Game: the dialog was dismissed. */
  ExhibitClose: 'exhibit:close',
  /** Game -> UI: what the player can interact with right now (null hides the prompt). */
  PromptChange: 'prompt:change',
  /** Game -> UI: the player entered a new area. */
  AreaEnter: 'area:enter',
  /** Game -> UI: a secret was found for the first time. */
  SecretFound: 'secret:found',
  /** Game -> UI: a short status message. */
  Toast: 'ui:toast',
  /** Either way: open the pause menu. */
  MenuRequest: 'menu:request',
  /** UI -> Game: teleport back to the lobby. */
  ReturnToHub: 'player:return-to-hub',
  /** UI -> Game: forget discoveries and re-close the grate. */
  ResetProgress: 'progress:reset',
  /** UI -> Game: the visitor dismissed the title screen. */
  Start: 'game:start',
  /** Game -> UI: assets are loaded and the world exists. */
  Ready: 'game:ready',
  /** UI -> Game: touch controls. */
  VirtualAxis: 'input:virtual-axis',
  VirtualInteract: 'input:virtual-interact',
  /** UI -> Game: play a UI sound through the game's audio manager. */
  UiSound: 'ui:sound',
} as const;

export interface GameEventMap {
  [GameEvent.ExhibitOpen]: { readonly id: string; readonly content: DialogContent };
  [GameEvent.ExhibitClose]: { readonly id: string };
  [GameEvent.PromptChange]: { readonly label: string } | null;
  [GameEvent.AreaEnter]: { readonly id: string; readonly name: string; readonly subtitle: string };
  [GameEvent.SecretFound]: {
    readonly title: string;
    readonly found: number;
    readonly total: number;
  };
  [GameEvent.Toast]: { readonly message: string };
  [GameEvent.MenuRequest]: undefined;
  [GameEvent.ReturnToHub]: undefined;
  [GameEvent.ResetProgress]: undefined;
  [GameEvent.Start]: undefined;
  [GameEvent.Ready]: undefined;
  [GameEvent.VirtualAxis]: { readonly x: number; readonly y: number };
  [GameEvent.VirtualInteract]: undefined;
  [GameEvent.UiSound]: { readonly key: SfxKey };
}

export type GameEventBus = EventBus<GameEventMap>;

export function createGameEventBus(): GameEventBus {
  return new EventBus<GameEventMap>();
}
