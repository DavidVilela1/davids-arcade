import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../src/lib/EventBus';
import { GameplayLock } from '../src/lib/GameplayLock';
import { normalizeAxis, stepVelocity } from '../src/lib/movement';
import { computeViewport, MAX_VIEW } from '../src/lib/scaling';
import {
  DEFAULT_SETTINGS,
  SettingsStore,
  STORAGE_KEY,
  type StorageLike,
} from '../src/lib/SettingsStore';
import { snapToEightWay } from '../src/ui/TouchControls';
import { MOVEMENT } from '../src/game/config/constants';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

describe('EventBus', () => {
  it('delivers typed payloads and unsubscribes', () => {
    const bus = new EventBus<{ ping: { n: number } }>();
    const fn = vi.fn();
    const off = bus.on('ping', fn);
    bus.emit('ping', { n: 1 });
    off();
    bus.emit('ping', { n: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ n: 1 });
  });

  it('supports once()', () => {
    const bus = new EventBus<{ ping: undefined }>();
    const fn = vi.fn();
    bus.once('ping', fn);
    bus.emit('ping', undefined);
    bus.emit('ping', undefined);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('GameplayLock', () => {
  it('stays locked until every reason is released and notifies only on flips', () => {
    const lock = new GameplayLock();
    const seen: boolean[] = [];
    lock.subscribe((l) => seen.push(l));
    lock.acquire('dialog');
    lock.acquire('menu');
    lock.release('dialog');
    expect(lock.locked).toBe(true);
    lock.release('menu');
    lock.release('menu');
    expect(lock.locked).toBe(false);
    expect(seen).toEqual([true, false]);
  });
});

describe('SettingsStore', () => {
  it('persists and reloads settings', () => {
    const storage = new MemoryStorage();
    const a = new SettingsStore(storage);
    a.update({ muted: true });
    expect(a.discover('bonfire')).toBe(true);
    expect(a.discover('bonfire')).toBe(false);
    const b = new SettingsStore(storage);
    expect(b.value.muted).toBe(true);
    expect(b.value.discoveries).toEqual(['bonfire']);
  });

  it('recovers from corrupt or hostile data', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    expect(new SettingsStore(storage).value).toEqual(DEFAULT_SETTINGS);
    storage.setItem(STORAGE_KEY, JSON.stringify({ muted: 'yes', discoveries: [1, 'x', 'x'] }));
    expect(new SettingsStore(storage).value).toEqual({ ...DEFAULT_SETTINGS, discoveries: ['x'] });
  });

  it('keeps working when storage throws', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => undefined,
    };
    const s = new SettingsStore(broken);
    s.update({ music: false });
    expect(s.value.music).toBe(false);
  });

  it('resets progress', () => {
    const s = new SettingsStore(null);
    s.discover('x');
    s.update({ grateOpen: true });
    s.resetProgress();
    expect(s.value.discoveries).toEqual([]);
    expect(s.value.grateOpen).toBe(false);
  });
});

describe('computeViewport', () => {
  it('uses whole-number zoom and stays within the max view', () => {
    for (const [w, h] of [
      [1920, 1080],
      [1366, 768],
      [2560, 1440],
      [844, 390],
      [390, 844],
      [1280, 720],
    ] as const) {
      const v = computeViewport(w, h);
      expect(Number.isInteger(v.zoom)).toBe(true);
      expect(v.width * v.zoom).toBeGreaterThanOrEqual(w);
      expect(v.height * v.zoom).toBeGreaterThanOrEqual(h);
      expect(v.width).toBeLessThanOrEqual(MAX_VIEW.width + 1);
      expect(v.height).toBeLessThanOrEqual(MAX_VIEW.height + 1);
    }
  });

  it('never zooms below 1', () => {
    expect(computeViewport(200, 150).zoom).toBe(1);
  });
});

describe('movement', () => {
  it('normalises diagonal input', () => {
    const d = normalizeAxis({ x: 1, y: 1 });
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1);
  });

  it('accelerates toward top speed and stops without sliding', () => {
    let v = { x: 0, y: 0 };
    for (let i = 0; i < 30; i++) v = stepVelocity(v, { x: 1, y: 0 }, MOVEMENT, 1 / 60);
    expect(v.x).toBeCloseTo(MOVEMENT.speed);
    for (let i = 0; i < 10; i++) v = stepVelocity(v, { x: 0, y: 0 }, MOVEMENT, 1 / 60);
    expect(v.x).toBe(0);
  });

  it('applies area speed multipliers', () => {
    let v = { x: 0, y: 0 };
    for (let i = 0; i < 60; i++) v = stepVelocity(v, { x: 0, y: 1 }, MOVEMENT, 1 / 60, 0.5);
    expect(v.y).toBeCloseTo(MOVEMENT.speed * 0.5);
  });
});

describe('touch D-pad', () => {
  it('snaps to eight directions with a dead zone', () => {
    expect(snapToEightWay(2, 1, 64)).toEqual({ x: 0, y: 0 });
    expect(snapToEightWay(50, 3, 64)).toEqual({ x: 1, y: 0 });
    expect(snapToEightWay(-40, -40, 64)).toEqual({ x: -1, y: -1 });
    expect(snapToEightWay(0, 60, 64)).toEqual({ x: 0, y: 1 });
  });
});
