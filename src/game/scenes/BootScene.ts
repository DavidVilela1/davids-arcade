/**
 * Loads every local asset, shows a small pixel progress bar, registers
 * animations and hands over to MainScene.
 */
import Phaser from 'phaser';
import { DATA, MUSIC, SFX_KEYS, TEXTURES, sfxUrl } from '../config/assets';
import { createPlayerAnimations } from '../entities/Player';
import { createPropAnimations } from '../entities/PropFactory';

export const BOOT_SCENE = 'boot';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(BOOT_SCENE);
  }

  preload(): void {
    const { width, height } = this.scale;
    const barW = Math.min(160, width - 32);
    const x = Math.round((width - barW) / 2);
    const y = Math.round(height / 2);
    this.add
      .rectangle(x - 2, y - 2, barW + 4, 8, 0x0e0b0c)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xb08d4f);
    const fill = this.add.rectangle(x, y, 1, 4, 0xad3434).setOrigin(0, 0);
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      fill.width = Math.max(1, Math.round(barW * value));
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(
        `[assets] failed to load ${file.key}${typeof file.url === 'string' ? ` (${file.url})` : ''}`,
      );
    });

    this.load.image(TEXTURES.tileset.key, TEXTURES.tileset.url);
    this.load.spritesheet(TEXTURES.player.key, TEXTURES.player.url, {
      frameWidth: 16,
      frameHeight: 24,
    });
    this.load.atlas(TEXTURES.props.key, TEXTURES.props.url, TEXTURES.props.atlas);
    this.load.json(DATA.tileset.key, DATA.tileset.url);
    for (const key of SFX_KEYS) this.load.audio(key, sfxUrl(key));
    this.load.audio(MUSIC.key, MUSIC.url);
  }

  create(): void {
    createPlayerAnimations(this.anims);
    createPropAnimations(this.anims);
    this.scene.start('main');
  }
}
