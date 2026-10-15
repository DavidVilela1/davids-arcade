/**
 * Frame-rate independent acceleration / deceleration toward a target
 * velocity. Kept separate from Player so the feel can be unit-tested.
 */
import type { Vec2 } from './geometry';

export interface MovementTuning {
  /** Top speed in px/s. */
  readonly speed: number;
  /** px/s² while input is held. */
  readonly accel: number;
  /** px/s² when input is released (stops crisply, without sliding). */
  readonly decel: number;
}

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return target;
}

/** Normalises diagonal input so moving diagonally is not faster. */
export function normalizeAxis(axis: Vec2): Vec2 {
  const len = Math.hypot(axis.x, axis.y);
  if (len <= 1) return axis;
  return { x: axis.x / len, y: axis.y / len };
}

export function stepVelocity(
  velocity: Vec2,
  axis: Vec2,
  tuning: MovementTuning,
  dtSeconds: number,
  speedMultiplier = 1,
): Vec2 {
  const dir = normalizeAxis(axis);
  const max = tuning.speed * speedMultiplier;
  const target = { x: dir.x * max, y: dir.y * max };
  const rate = (t: number, v: number) =>
    t !== 0 && Math.sign(t) === Math.sign(v || t) ? tuning.accel : tuning.decel;
  return {
    x: approach(velocity.x, target.x, rate(target.x, velocity.x) * dtSeconds),
    y: approach(velocity.y, target.y, rate(target.y, velocity.y) * dtSeconds),
  };
}
