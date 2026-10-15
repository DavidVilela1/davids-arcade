/**
 * Entry point: creates the shared services, mounts the DOM UI and starts the
 * Phaser game. Both halves receive their dependencies explicitly.
 */
import './styles/main.css';
import './ui/ui.css';
import { createGame } from './game/Game';
import { createGameEventBus } from './game/events/events';
import { GameplayLock } from './lib/GameplayLock';
import { SettingsStore } from './lib/SettingsStore';
import { mountUi } from './ui/UiController';

function requireElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} is missing from index.html`);
  return el;
}

const gameRoot = requireElement('game');
const uiRoot = requireElement('ui');

const bus = createGameEventBus();
const lock = new GameplayLock();
lock.acquire('title');
const settings = SettingsStore.fromBrowser();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ui = mountUi({ root: uiRoot, gameRoot, bus, lock, settings, dev: import.meta.env.DEV });
const game = createGame(gameRoot, { bus, lock, settings, reducedMotion, keyTarget: window });

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy();
    ui.destroy();
    bus.clear();
  });
}
