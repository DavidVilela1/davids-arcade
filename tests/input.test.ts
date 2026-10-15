import { describe, expect, it } from 'vitest';
import { InputController } from '../src/game/systems/InputController';

function setup() {
  const target = new EventTarget();
  let now = 0;
  const input = new InputController(target, () => now);
  const key = (type: 'keydown' | 'keyup', code: string, extra: Record<string, unknown> = {}) => {
    const event = Object.assign(new Event(type, { cancelable: true }), { code, ...extra });
    target.dispatchEvent(event);
    return event;
  };
  return { input, key, advance: (ms: number) => (now += ms) };
}

describe('InputController', () => {
  it('maps WASD and arrows to an axis', () => {
    const { input, key } = setup();
    key('keydown', 'KeyD');
    key('keydown', 'ArrowUp');
    expect(input.axis()).toEqual({ x: 1, y: -1 });
    key('keyup', 'KeyD');
    expect(input.axis()).toEqual({ x: 0, y: -1 });
  });

  it('prevents the browser default for game keys', () => {
    const { key } = setup();
    expect(key('keydown', 'ArrowDown').defaultPrevented).toBe(true);
    expect(key('keydown', 'KeyQ').defaultPrevented).toBe(false);
  });

  it('reports interact once per press and ignores key repeat', () => {
    const { input, key } = setup();
    key('keydown', 'KeyE');
    key('keydown', 'KeyE', { repeat: true });
    expect(input.consume('interact')).toBe(true);
    expect(input.consume('interact')).toBe(false);
  });

  it('clears held keys when disabled, so nothing sticks after a dialog', () => {
    const { input, key } = setup();
    key('keydown', 'KeyW');
    input.setEnabled(false);
    expect(input.axis()).toEqual({ x: 0, y: 0 });
    key('keydown', 'KeyE');
    input.setEnabled(true);
    expect(input.consume('interact')).toBe(false);
    expect(input.axis()).toEqual({ x: 0, y: 0 });
  });

  it('ignores interact presses during the resume grace period', () => {
    const { input, key, advance } = setup();
    input.setEnabled(true, 150);
    key('keydown', 'KeyE');
    expect(input.consume('interact')).toBe(false);
    advance(200);
    key('keydown', 'KeyE');
    expect(input.consume('interact')).toBe(true);
  });

  it('clears everything when the window loses focus', () => {
    const { input, key } = setup();
    key('keydown', 'KeyA');
    (input as unknown as { onBlur: () => void }).onBlur();
    expect(input.axis()).toEqual({ x: 0, y: 0 });
  });

  it('accepts virtual (touch) input and clamps the combined axis', () => {
    const { input, key } = setup();
    input.setVirtualAxis({ x: 1, y: 0 });
    key('keydown', 'KeyD');
    expect(input.axis()).toEqual({ x: 1, y: 0 });
    input.pressVirtual('interact');
    expect(input.consume('interact')).toBe(true);
  });
});
