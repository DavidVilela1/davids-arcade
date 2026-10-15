/**
 * Mounts the DOM interface and connects it to the game through the event bus.
 * The UI never touches Phaser; the game never touches the DOM.
 */
import type { GameplayLock } from '../lib/GameplayLock';
import type { SettingsStore } from '../lib/SettingsStore';
import { secretCatalogue } from '../game/data/easterEggs';
import { INFO_PANELS } from '../game/data/infoPanels';
import { PROJECTS } from '../game/data/projects';
import type { DialogContent, DirectoryEntry } from '../game/data/types';
import { visibleProjects } from '../game/data/validation';
import { GameEvent, type GameEventBus } from '../game/events/events';
import { Hud } from './Hud';
import { Modal } from './Modal';
import { createRenderer } from './renderers';
import { TitleScreen } from './TitleScreen';
import { TouchControls } from './TouchControls';

export interface UiDeps {
  readonly root: HTMLElement;
  readonly gameRoot: HTMLElement;
  readonly bus: GameEventBus;
  readonly lock: GameplayLock;
  readonly settings: SettingsStore;
  readonly dev: boolean;
}

const WING_LABEL = {
  godot: 'Godot Wing',
  unity: 'Unity Wing',
  unreal: 'Unreal Wing (Boss Room)',
} as const;

export function buildDirectory(): DialogContent {
  const entries: DirectoryEntry[] = [
    ...visibleProjects(PROJECTS).map((p) => ({
      id: p.id,
      group: WING_LABEL[p.engine],
      label: p.status === 'sample' ? `${p.title} (${p.engine})` : p.title,
      content: { kind: 'project', project: p } as const,
    })),
    ...Object.values(INFO_PANELS).map((panel) => ({
      id: panel.id,
      group: 'About, skills & contact',
      label: panel.title,
      content: { kind: 'info', panel } as const,
    })),
  ];
  return { kind: 'directory', entries };
}

export function mountUi(deps: UiDeps): { destroy(): void } {
  const { root, gameRoot, bus, lock, settings } = deps;
  const coarse = window.matchMedia('(pointer: coarse)');
  let touchMode = coarse.matches;
  const isTouch = () => touchMode;
  const offs: (() => void)[] = [];

  const counts = () => {
    const ids = new Set(secretCatalogue().map((s) => s.id));
    return { found: settings.value.discoveries.filter((d) => ids.has(d)).length, total: ids.size };
  };
  const toggleSound = () => {
    settings.update({ muted: !settings.value.muted });
    return !settings.value.muted;
  };
  const menuContent = (): DialogContent => {
    const found = new Set(settings.value.discoveries);
    return {
      kind: 'menu',
      menu: { secrets: secretCatalogue().map((s) => ({ title: s.title, found: found.has(s.id) })) },
    };
  };

  const modal = new Modal(
    root,
    lock,
    (sourceId) => {
      if (sourceId) bus.emit(GameEvent.ExhibitClose, { id: sourceId });
    },
    gameRoot,
  );
  modal.setRenderer(
    createRenderer({
      dev: deps.dev,
      settings,
      touch: isTouch,
      secretCounts: counts,
      actions: {
        resume: () => {
          modal.close();
        },
        returnToHub: () => {
          modal.close();
          bus.emit(GameEvent.ReturnToHub, undefined);
        },
        toggleSound: () => {
          toggleSound();
        },
        toggleMusic: () => {
          settings.update({ music: !settings.value.music });
        },
        resetProgress: () => {
          bus.emit(GameEvent.ResetProgress, undefined);
        },
        directory: buildDirectory,
        tune: () => {
          bus.emit(GameEvent.UiSound, { key: 'tune' });
        },
      },
    }),
  );

  const openMenu = () => {
    if (lock.has('title')) return;
    if (modal.isOpen) {
      modal.close();
      return;
    }
    modal.open(menuContent(), { reason: 'menu' });
  };

  const hud = new Hud(root, { onMenu: openMenu, onToggleSound: toggleSound }, isTouch);
  hud.setSound(!settings.value.muted);
  hud.setSecrets(counts().found, counts().total);
  offs.push(
    settings.subscribe((s) => {
      hud.setSound(!s.muted);
      hud.setSecrets(counts().found, counts().total);
    }),
  );

  const touch = new TouchControls(
    root,
    (axis) => {
      bus.emit(GameEvent.VirtualAxis, axis);
    },
    () => {
      bus.emit(GameEvent.VirtualInteract, undefined);
    },
  );
  const applyTouchMode = () => {
    document.body.classList.toggle('is-touch', touchMode);
    touch.show(touchMode && !lock.locked);
  };
  const onFirstTouch = () => {
    touchMode = true;
    applyTouchMode();
  };
  window.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });
  applyTouchMode();

  offs.push(
    lock.subscribe((locked) => {
      document.body.classList.toggle('is-locked', locked);
      if (locked) touch.reset();
      applyTouchMode();
      if (locked) hud.setPrompt(null);
    }),
    bus.on(GameEvent.ExhibitOpen, ({ id, content }) => {
      modal.open(content, { sourceId: id });
    }),
    bus.on(GameEvent.PromptChange, (prompt) => {
      hud.setPrompt(prompt?.label ?? null);
    }),
    bus.on(GameEvent.AreaEnter, ({ name, subtitle }) => {
      if (!lock.has('title')) hud.showArea(name, subtitle);
    }),
    bus.on(GameEvent.Toast, ({ message }) => {
      hud.toast(message);
    }),
    bus.on(GameEvent.SecretFound, ({ title, found, total }) => {
      hud.toast(`Secret found: ${title} (${String(found)}/${String(total)})`);
      hud.setSecrets(found, total);
    }),
    bus.on(GameEvent.MenuRequest, openMenu),
  );

  const title = new TitleScreen(
    root,
    {
      onEnter: () => {
        lock.release('title');
        bus.emit(GameEvent.Start, undefined);
        hud.showArea('The Lobby', "David's Arcade");
        hud.showHint();
        gameRoot.focus({ preventScroll: true });
      },
      onDirectory: () => {
        modal.open(buildDirectory());
      },
      onToggleSound: toggleSound,
    },
    !settings.value.muted,
    touchMode,
  );

  return {
    destroy() {
      for (const off of offs) off();
      window.removeEventListener('touchstart', onFirstTouch);
      title.close();
      modal.close();
      modal.element.remove();
      hud.destroy();
      touch.element.remove();
    },
  };
}
