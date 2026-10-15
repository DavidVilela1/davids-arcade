/**
 * Keyboard and virtual (touch) input, read straight from DOM events so the
 * game and the HTML UI never fight over keys. While disabled, held keys are
 * cleared and nothing is queued — which is what prevents "stuck" movement and
 * accidental re-interaction after a dialog closes.
 */
import type { Vec2 } from '../../lib/geometry';
import { KEY_BINDINGS, type GameAction } from '../config/constants';

type EdgeAction = Extract<GameAction, 'interact' | 'pause' | 'mute' | 'hub'>;
const EDGE_ACTIONS: readonly EdgeAction[] = ['interact', 'pause', 'mute', 'hub'];

export interface KeyEventTarget {
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
}

function isEdgeAction(action: GameAction): action is EdgeAction {
  return (EDGE_ACTIONS as readonly GameAction[]).includes(action);
}

/** Reads `code`/`repeat` from any Event without assuming it is a KeyboardEvent. */
function keyInfo(event: Event): { code: string; repeat: boolean } | null {
  if (!('code' in event) || typeof event.code !== 'string') return null;
  return { code: event.code, repeat: 'repeat' in event && event.repeat === true };
}

/** Elements that own Space/Enter themselves (buttons, links, form fields). */
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return false;
  return (
    target.closest('button, a, input, select, textarea, summary, [contenteditable="true"]') !== null
  );
}

export class InputController {
  private readonly held = new Set<GameAction>();
  private readonly queued = new Set<EdgeAction>();
  private readonly codeToAction = new Map<string, GameAction>();
  private virtualAxis: Vec2 = { x: 0, y: 0 };
  private enabled = true;
  private graceUntil = 0;

  constructor(
    private readonly target: KeyEventTarget,
    private readonly now: () => number = () => performance.now(),
    bindings: Readonly<Record<GameAction, readonly string[]>> = KEY_BINDINGS,
  ) {
    for (const [action, codes] of Object.entries(bindings) as [GameAction, readonly string[]][])
      for (const code of codes) this.codeToAction.set(code, action);
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('blur', this.onBlur);
  }

  /** Disabling clears all state; enabling starts a short grace period for interactions. */
  setEnabled(enabled: boolean, graceMs = 0): void {
    this.enabled = enabled;
    this.reset();
    if (enabled) this.graceUntil = this.now() + graceMs;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  reset(): void {
    this.held.clear();
    this.queued.clear();
    this.virtualAxis = { x: 0, y: 0 };
  }

  /** Movement axis in [-1, 1], combining keyboard and touch. */
  axis(): Vec2 {
    if (!this.enabled) return { x: 0, y: 0 };
    const kx = (this.held.has('right') ? 1 : 0) - (this.held.has('left') ? 1 : 0);
    const ky = (this.held.has('down') ? 1 : 0) - (this.held.has('up') ? 1 : 0);
    return {
      x: Math.max(-1, Math.min(1, kx + this.virtualAxis.x)),
      y: Math.max(-1, Math.min(1, ky + this.virtualAxis.y)),
    };
  }

  /** True once per press. */
  consume(action: EdgeAction): boolean {
    const had = this.queued.delete(action);
    if (action === 'interact' && this.now() < this.graceUntil) return false;
    return had;
  }

  setVirtualAxis(axis: Vec2): void {
    if (this.enabled) this.virtualAxis = axis;
  }

  pressVirtual(action: EdgeAction): void {
    if (this.enabled) this.queued.add(action);
  }

  private readonly onKeyDown = (event: Event): void => {
    const key = keyInfo(event);
    if (!key) return;
    const action = this.codeToAction.get(key.code);
    if (!action || !this.enabled) return;
    const fromWidget = isInteractiveTarget(event.target);
    if (action === 'interact' && fromWidget) return; // Let the focused button handle it.
    if (!fromWidget) event.preventDefault();
    if (key.repeat) return;
    if (isEdgeAction(action)) this.queued.add(action);
    else this.held.add(action);
  };

  private readonly onKeyUp = (event: Event): void => {
    const key = keyInfo(event);
    const action = key ? this.codeToAction.get(key.code) : undefined;
    if (action) this.held.delete(action);
  };

  private readonly onBlur = (): void => {
    this.reset();
  };
}
