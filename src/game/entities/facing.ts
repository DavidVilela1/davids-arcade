/** Facing directions, kept Phaser-free so they can be unit-tested. */
import type { Vec2 } from '../../lib/geometry';

export type Facing = 'down' | 'up' | 'left' | 'right';

export const FACING_VECTORS: Readonly<Record<Facing, Vec2>> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** Follows the dominant input axis; keeps the previous facing when idle. */
export function facingFromAxis(axis: Vec2, previous: Facing): Facing {
  if (axis.x === 0 && axis.y === 0) return previous;
  if (Math.abs(axis.x) > Math.abs(axis.y)) return axis.x > 0 ? 'right' : 'left';
  return axis.y > 0 ? 'down' : 'up';
}
