import { describe, expect, it, vi } from 'vitest';
import { EASTER_EGGS, findEgg, rollD20Note, secretCatalogue } from '../src/game/data/easterEggs';
import { AREAS, DOORS, ROOMS, WORLD_COLS, WORLD_ROWS } from '../src/game/data/world';
import { facingFromAxis } from '../src/game/entities/facing';
import { EffectRunner, type EffectHost } from '../src/game/systems/EffectRunner';
import { carpetPart, floorVariant, wallRender } from '../src/game/world/autotile';
import { laneAssist } from '../src/game/world/laneAssist';
import { WorldGrid } from '../src/game/world/WorldGrid';
import { SettingsStore } from '../src/lib/SettingsStore';

function fakeHost(): EffectHost & { calls: string[] } {
  const calls: string[] = [];
  let boxed = false;
  return {
    calls,
    openDialog: (id, content) => calls.push(`dialog:${id}:${content.kind}`),
    playSfx: (k) => calls.push(`sfx:${k}`),
    toast: (m) => calls.push(`toast:${m}`),
    secretFound: (t, f, n) => calls.push(`secret:${t}:${String(f)}/${String(n)}`),
    toggleDisguise: () => (boxed = !boxed),
    setGrateOpen: (o) => calls.push(`grate:${String(o)}`),
    travel: (t) => calls.push(`travel:${t}`),
    flash: () => calls.push('flash'),
  };
}

const egg = (id: string) => {
  const e = findEgg(id);
  if (!e) throw new Error(id);
  return e;
};

describe('easter eggs', () => {
  it('have unique ids and every non-effect egg has a note', () => {
    expect(new Set(EASTER_EGGS.map((e) => e.id)).size).toBe(EASTER_EGGS.length);
    for (const e of EASTER_EGGS) if (!e.effect) expect(e.note, e.id).toBeDefined();
  });

  it('counts shared discoveries (floor messages) once', () => {
    const settings = new SettingsStore(null);
    const host = fakeHost();
    const runner = new EffectRunner(host, settings);
    runner.run(egg('message-lobby'), 'a');
    runner.run(egg('message-unity'), 'b');
    expect(host.calls.filter((c) => c.startsWith('secret:'))).toHaveLength(1);
    expect(runner.discoveredCount).toBe(1);
    expect(runner.totalSecrets).toBe(secretCatalogue().length);
  });

  it('rolls a d20 between 1 and 20', () => {
    const host = fakeHost();
    new EffectRunner(host, new SettingsStore(null), () => 0.999).run(egg('d20'), 'die');
    expect(rollD20Note(20).lines[0]).toMatch(/Natural 20/);
    expect(rollD20Note(1).lines[0]).toMatch(/Natural 1/);
    expect(host.calls).toContain('sfx:dice');
  });

  it('opens the grate, then travels through it', () => {
    const host = fakeHost();
    const runner = new EffectRunner(host, new SettingsStore(null));
    runner.run(egg('grate'), 'g');
    runner.run(egg('grate-open'), 'g');
    expect(host.calls).toContain('grate:true');
    expect(host.calls).toContain('travel:duct');
  });

  it('toggles the cardboard box and opens the codec', () => {
    const host = fakeHost();
    const runner = new EffectRunner(host, new SettingsStore(null));
    runner.run(egg('cardboard-box'), 'box');
    runner.run(egg('codec'), 'codec');
    expect(host.calls.some((c) => c.startsWith('toast:You are now'))).toBe(true);
    expect(host.calls).toContain('dialog:codec:codec');
  });

  it('cycles arcade cabinet lines', () => {
    const host = fakeHost();
    const openDialog = vi.spyOn(host, 'openDialog');
    const runner = new EffectRunner(host, new SettingsStore(null));
    runner.run(egg('cabinet'), 'c1');
    runner.run(egg('cabinet'), 'c1');
    const [first, second] = openDialog.mock.calls.map((c) => JSON.stringify(c[1]));
    expect(first).not.toBe(second);
  });
});

describe('autotiling', () => {
  const grid = new WorldGrid(WORLD_COLS, WORLD_ROWS, [...ROOMS, ...DOORS]);

  it('draws wall faces above floors and tops elsewhere', () => {
    // Lobby north wall: row 16 sits directly above lobby floor.
    expect(wallRender(grid, 20, 16)).toEqual({ type: 'face', part: 'lower', area: 'hub' });
    expect(wallRender(grid, 20, 15)).toEqual({ type: 'face', part: 'upper', area: 'hub' });
    expect(wallRender(grid, 20, 14).type).toBe('top');
    expect(wallRender(grid, 20, 20).type).toBe('none');
  });

  it('picks 9-slice carpet parts from neighbours', () => {
    expect(carpetPart(false, true, true, false)).toBe('tl');
    expect(carpetPart(true, true, true, true)).toBe('c');
    expect(carpetPart(true, false, false, true)).toBe('br');
  });

  it('chooses floor variants deterministically', () => {
    expect(floorVariant(3, 7)).toBe(floorVariant(3, 7));
    const counts = new Map<number, number>();
    for (let y = 0; y < 40; y++)
      for (let x = 0; x < 40; x++) {
        const v = floorVariant(x, y);
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    const plain = counts.get(0) ?? 0;
    expect(plain).toBeGreaterThan((counts.get(1) ?? 0) + (counts.get(2) ?? 0));
  });

  it('defines a floor and wall theme for every area', () => {
    for (const a of Object.values(AREAS)) {
      expect(a.floor).toBeTruthy();
      expect(a.wall).toBeTruthy();
    }
  });
});

describe('lane assist', () => {
  const grid = new WorldGrid(WORLD_COLS, WORLD_ROWS, [...ROOMS, ...DOORS]);

  it('nudges the player into a one-tile passage', () => {
    // The crawlspace turns down at column 40 (x 640..656); the player is 4 px left of centre.
    const axis = laneAssist(grid, { x: 644, y: 761 }, { x: 0, y: 1 });
    expect(axis.x).toBeGreaterThan(0);
    expect(axis.y).toBe(1);
  });

  it('does nothing in open rooms or for diagonal input', () => {
    expect(laneAssist(grid, { x: 480, y: 400 }, { x: 0, y: 1 })).toEqual({ x: 0, y: 1 });
    expect(laneAssist(grid, { x: 644, y: 761 }, { x: 1, y: 1 })).toEqual({ x: 1, y: 1 });
  });
});

describe('player facing', () => {
  it('follows the dominant axis and remembers the last direction', () => {
    expect(facingFromAxis({ x: 1, y: 0.4 }, 'up')).toBe('right');
    expect(facingFromAxis({ x: 0, y: -1 }, 'left')).toBe('up');
    expect(facingFromAxis({ x: 0, y: 0 }, 'left')).toBe('left');
  });
});
