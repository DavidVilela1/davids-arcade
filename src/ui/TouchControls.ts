/**
 * On-screen controls for touch devices: an 8-way D-pad and an A button.
 * Built on Pointer Events with pointer capture, so dragging off the pad keeps
 * working and multi-touch (move + interact) is supported.
 */
import type { Vec2 } from '../lib/geometry';
import { h } from './dom';

const DEADZONE = 0.28;

/** Snaps a raw drag vector to one of eight directions (or zero). */
export function snapToEightWay(dx: number, dy: number, radius: number): Vec2 {
  const len = Math.hypot(dx, dy);
  if (len < radius * DEADZONE) return { x: 0, y: 0 };
  const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
  const round = (v: number) => (Math.abs(v) < 1e-6 ? 0 : Math.sign(v));
  return { x: round(Math.cos(angle)), y: round(Math.sin(angle)) };
}

export class TouchControls {
  readonly element: HTMLElement;
  private readonly pad: HTMLElement;
  private readonly knob: HTMLElement;
  private activePointer: number | null = null;

  constructor(
    parent: HTMLElement,
    private readonly onAxis: (axis: Vec2) => void,
    onInteract: () => void,
  ) {
    this.knob = h('span', { class: 'touch__knob' });
    this.pad = h('div', { class: 'touch__pad', 'aria-hidden': 'true' }, this.knob);
    const a = h('button', { type: 'button', class: 'touch__a', 'aria-label': 'Interact' }, 'A');
    this.element = h('div', { class: 'touch', hidden: true }, this.pad, a);
    parent.append(this.element);

    this.pad.addEventListener('pointerdown', this.onDown);
    this.pad.addEventListener('pointermove', this.onMove);
    this.pad.addEventListener('pointerup', this.onUp);
    this.pad.addEventListener('pointercancel', this.onUp);
    this.pad.addEventListener('lostpointercapture', this.onUp);
    a.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      onInteract();
    });
    // Keyboard / switch users can still activate the A button.
    a.addEventListener('click', (event) => {
      if (event.detail === 0) onInteract();
    });
  }

  show(visible: boolean): void {
    this.element.hidden = !visible;
  }

  reset(): void {
    this.activePointer = null;
    this.knob.style.transform = '';
    this.onAxis({ x: 0, y: 0 });
  }

  private readonly onDown = (event: PointerEvent): void => {
    event.preventDefault();
    this.activePointer = event.pointerId;
    this.pad.setPointerCapture(event.pointerId);
    this.track(event);
  };

  private readonly onMove = (event: PointerEvent): void => {
    if (event.pointerId === this.activePointer) this.track(event);
  };

  private readonly onUp = (event: PointerEvent): void => {
    if (event.pointerId === this.activePointer) this.reset();
  };

  private track(event: PointerEvent): void {
    const rect = this.pad.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = event.clientX - (rect.left + radius);
    const dy = event.clientY - (rect.top + radius);
    const axis = snapToEightWay(dx, dy, radius);
    const k = radius * 0.45;
    this.knob.style.transform = `translate(${String(axis.x * k)}px, ${String(axis.y * k)}px)`;
    this.onAxis(axis);
  }
}
