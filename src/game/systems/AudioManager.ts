/**
 * Thin wrapper over Phaser's sound manager. Music starts only after the
 * visitor's first deliberate interaction (the title screen), respects the
 * saved mute/music settings, and fails silently if audio is unavailable.
 */
import type Phaser from 'phaser';
import type { Settings, SettingsStore } from '../../lib/SettingsStore';
import { MUSIC, type SfxKey } from '../config/assets';
import { AUDIO } from '../config/constants';

export class AudioManager {
  private music: Phaser.Sound.BaseSound | null = null;
  private started = false;
  private readonly unsubscribe: () => void;

  constructor(
    private readonly sound: Phaser.Sound.BaseSoundManager,
    private readonly settings: SettingsStore,
  ) {
    this.apply(settings.value);
    this.unsubscribe = settings.subscribe((s) => {
      this.apply(s);
    });
  }

  /** Call from a user gesture (the title screen) — browsers block audio before that. */
  start(): void {
    this.started = true;
    this.apply(this.settings.value);
  }

  play(key: SfxKey, volume: number = AUDIO.sfxVolume): void {
    if (!this.started || this.settings.value.muted) return;
    try {
      this.sound.play(key, { volume });
    } catch {
      // Audio can be unavailable (no device, decode failure). The game works without it.
    }
  }

  destroy(): void {
    this.unsubscribe();
    this.music?.destroy();
  }

  private apply(s: Settings): void {
    this.sound.mute = s.muted;
    if (!this.started) return;
    const wantMusic = s.music && !s.muted;
    if (wantMusic) {
      try {
        this.music ??= this.sound.add(MUSIC.key, { loop: true, volume: AUDIO.musicVolume });
        if (this.music.isPaused) this.music.resume();
        else if (!this.music.isPlaying) this.music.play();
      } catch {
        this.music = null;
      }
    } else if (this.music?.isPlaying) {
      this.music.pause();
    }
  }
}
