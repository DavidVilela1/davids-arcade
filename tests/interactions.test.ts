import { describe, expect, it } from 'vitest';
import {
  distanceToRect,
  resolveInteraction,
  type Interactable,
} from '../src/game/interactions/interactions';

const make = (id: string, x: number, y: number, reach = 14, enabled = true): Interactable => ({
  id,
  rect: { x, y, w: 10, h: 10 },
  reach,
  prompt: id,
  action: { kind: 'egg', eggId: id },
  enabled,
});

describe('distanceToRect', () => {
  it('is zero inside and Euclidean outside', () => {
    const r = { x: 0, y: 0, w: 10, h: 10 };
    expect(distanceToRect({ x: 5, y: 5 }, r)).toBe(0);
    expect(distanceToRect({ x: 13, y: 14 }, r)).toBe(5);
  });
});

describe('resolveInteraction', () => {
  const down = { x: 0, y: 1 };

  it('returns null when nothing is in reach', () => {
    expect(resolveInteraction({ x: 0, y: 0 }, down, [make('far', 100, 100)])).toBeNull();
  });

  it('picks the nearest candidate', () => {
    const near = make('near', 0, 6);
    const far = make('far', 0, 14);
    expect(resolveInteraction({ x: 5, y: 0 }, down, [far, near])?.id).toBe('near');
  });

  it('prefers what the player is facing over something slightly closer behind', () => {
    const behind = make('behind', 0, -13); // 3 px above
    const ahead = make('ahead', 0, 5); // 5 px below
    expect(resolveInteraction({ x: 5, y: 0 }, down, [behind, ahead])?.id).toBe('ahead');
  });

  it('ignores disabled interactables', () => {
    expect(resolveInteraction({ x: 5, y: 0 }, down, [make('off', 0, 2, 14, false)])).toBeNull();
  });

  it('breaks exact ties deterministically by id', () => {
    const a = make('a', 0, 4);
    const b = make('b', 0, 4);
    expect(resolveInteraction({ x: 5, y: 0 }, down, [b, a])?.id).toBe('a');
  });
});
