/**
 * Corner correction for narrow passages (doors, the crawlspace). When the
 * player pushes straight into an opening but is a few pixels off-centre, a
 * small sideways nudge slides them in instead of snagging on the wall edge.
 */
import type { Vec2 } from '../../lib/geometry';
import { TILE } from '../data/world';
import type { WorldGrid } from './WorldGrid';

/** How far off-centre (px) the assist still helps. */
export const ASSIST_RANGE = 7;
const NUDGE = 0.7;

function assistAxis(
  grid: WorldGrid,
  along: number,
  across: number,
  dir: number,
  isVertical: boolean,
): number {
  const lane = Math.floor(across / TILE);
  const laneCenter = lane * TILE + TILE / 2;
  const offset = across - laneCenter;
  if (Math.abs(offset) < 1 || Math.abs(offset) > ASSIST_RANGE) return 0;
  const ahead = Math.floor((along + dir * (TILE / 2 + 2)) / TILE);
  const floorAt = (l: number, a: number) => (isVertical ? grid.isFloor(l, a) : grid.isFloor(a, l));
  if (!floorAt(lane, ahead)) return 0;
  const side = offset > 0 ? lane + 1 : lane - 1;
  if (floorAt(side, ahead)) return 0; // Wide open: no help needed.
  return offset > 0 ? -NUDGE : NUDGE;
}

/** Returns the input axis, plus a perpendicular nudge when entering a narrow gap. */
export function laneAssist(grid: WorldGrid, feet: Vec2, axis: Vec2): Vec2 {
  if (axis.x === 0 && axis.y !== 0) {
    return { x: assistAxis(grid, feet.y, feet.x, Math.sign(axis.y), true), y: axis.y };
  }
  if (axis.y === 0 && axis.x !== 0) {
    return { x: axis.x, y: assistAxis(grid, feet.x, feet.y, Math.sign(axis.x), false) };
  }
  return axis;
}
