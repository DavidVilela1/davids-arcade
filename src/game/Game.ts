/**
 * Creates and destroys the Phaser game, and keeps the canvas crisply
 * integer-scaled as the window changes size.
 */
import Phaser from 'phaser';
import { computeViewport } from '../lib/scaling';
import { BootScene } from './scenes/BootScene';
import { MainScene, type MainSceneDeps } from './scenes/MainScene';

export interface GameHandle {
  readonly game: Phaser.Game;
  destroy(): void;
}

function viewportSize(): { w: number; h: number } {
  const vv = window.visualViewport;
  return { w: vv?.width ?? window.innerWidth, h: vv?.height ?? window.innerHeight };
}

export function createGame(parent: HTMLElement, deps: MainSceneDeps): GameHandle {
  const { w, h } = viewportSize();
  const initial = computeViewport(w, h);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0e0b0c',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    disableContextMenu: true,
    banner: false,
    scale: {
      mode: Phaser.Scale.NONE,
      width: initial.width,
      height: initial.height,
      zoom: initial.zoom,
    },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    // All keyboard and touch handling lives in the DOM (InputController, TouchControls).
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    audio: { disableWebAudio: false },
    scene: [new BootScene(), new MainScene(deps)],
  });

  let frame = 0;
  const onResize = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const size = viewportSize();
      const next = computeViewport(size.w, size.h);
      game.scale.resize(next.width, next.height);
      game.scale.setZoom(next.zoom);
    });
  };
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);

  return {
    game,
    destroy() {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      game.destroy(true);
    },
  };
}
