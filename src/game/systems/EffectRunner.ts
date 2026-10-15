/**
 * Runs easter-egg effects and records discoveries. The scene supplies a small
 * host interface, so effects never touch Phaser objects directly and can be
 * exercised in unit tests with a fake host.
 */
import type { SettingsStore } from '../../lib/SettingsStore';
import type { SfxKey } from '../config/assets';
import {
  CABINET_LINES,
  CODEC,
  discoveryIdOf,
  rollD20Note,
  secretCatalogue,
  type EasterEggDef,
} from '../data/easterEggs';
import type { DialogContent } from '../data/types';

export type TravelTarget = 'duct' | 'workshop';

export interface EffectHost {
  openDialog(id: string, content: DialogContent): void;
  playSfx(key: SfxKey): void;
  toast(message: string): void;
  secretFound(title: string, found: number, total: number): void;
  /** Toggles the cardboard-box disguise; returns the new state. */
  toggleDisguise(): boolean;
  setGrateOpen(open: boolean): void;
  travel(target: TravelTarget): void;
  /** A warm flash or similar feedback, skipped under reduced motion. */
  flash(): void;
}

export class EffectRunner {
  private coin = 0;

  constructor(
    private readonly host: EffectHost,
    private readonly settings: SettingsStore,
    private readonly random: () => number = Math.random,
  ) {}

  get discoveredCount(): number {
    const ids = new Set(secretCatalogue().map((s) => s.id));
    return this.settings.value.discoveries.filter((d) => ids.has(d)).length;
  }

  get totalSecrets(): number {
    return secretCatalogue().length;
  }

  /** Records a discovery; plays the jingle and notifies the UI only the first time. */
  discover(id: string, title: string): boolean {
    if (!secretCatalogue().some((s) => s.id === id)) return false;
    const isNew = this.settings.discover(id);
    if (isNew) {
      this.host.playSfx('secret');
      this.host.secretFound(title, this.discoveredCount, this.totalSecrets);
    }
    return isNew;
  }

  run(egg: EasterEggDef, sourceId: string): void {
    const open = (content: DialogContent) => {
      this.host.openDialog(sourceId, content);
    };
    switch (egg.effect) {
      case 'rest-bonfire':
        this.host.playSfx('bonfire');
        this.host.flash();
        if (egg.note) open({ kind: 'note', note: egg.note });
        break;
      case 'roll-d20': {
        const roll = 1 + Math.floor(this.random() * 20);
        this.host.playSfx('dice');
        open({ kind: 'note', note: rollD20Note(roll) });
        break;
      }
      case 'toggle-box': {
        const boxed = this.host.toggleDisguise();
        this.host.playSfx('box');
        this.host.toast(
          boxed
            ? 'You are now a cardboard box. Press E in an open spot to step out.'
            : 'You step out of the box.',
        );
        break;
      }
      case 'open-grate':
        this.host.playSfx('vent');
        this.host.setGrateOpen(true);
        if (egg.note) open({ kind: 'note', note: egg.note });
        break;
      case 'climb-down':
        this.host.playSfx('vent');
        this.host.travel('duct');
        break;
      case 'climb-up':
        this.host.travel('workshop');
        break;
      case 'open-codec':
        this.host.playSfx('codec_ring');
        open({ kind: 'codec', codec: CODEC });
        break;
      case 'insert-coin': {
        const line = CABINET_LINES[this.coin % CABINET_LINES.length] ?? '';
        this.coin++;
        open({ kind: 'note', note: { title: 'Arcade cabinet', lines: [line] } });
        break;
      }
      case undefined:
        if (egg.note) open({ kind: 'note', note: egg.note });
        break;
    }
    if (egg.secret) this.discover(discoveryIdOf(egg), egg.title);
  }
}
