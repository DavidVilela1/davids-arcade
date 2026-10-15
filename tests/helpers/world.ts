/**
 * Test helpers: builds the real world layout from the shipped data and the
 * generated atlas, and flood-fills where the player's footprint can go.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PLAYER_BODY } from '../../src/game/config/constants';
import { findEgg } from '../../src/game/data/easterEggs';
import { PROJECTS } from '../../src/game/data/projects';
import { propFrameNames, type PropId } from '../../src/game/data/props';
import {
  DOORS,
  EXHIBIT_SLOTS,
  PLACEMENTS,
  ROOMS,
  TILE,
  WORLD_COLS,
  WORLD_ROWS,
} from '../../src/game/data/world';
import type { PixelRect, Vec2 } from '../../src/lib/geometry';
import { WorldGrid } from '../../src/game/world/WorldGrid';
import { layoutWorld, type LayoutResult } from '../../src/game/world/worldLayout';

interface AtlasJson {
  frames: Record<string, { frame: { w: number; h: number } }>;
}

export function readPublicJson(path: string): unknown {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL(`../../public/${path}`, import.meta.url)), 'utf8'),
  );
}

export const atlas = readPublicJson('game/sprites/props.json') as AtlasJson;

export function frameSize(prop: PropId): { w: number; h: number } {
  const frame = atlas.frames[propFrameNames(prop)[0] ?? '']?.frame;
  if (!frame) throw new Error(`No atlas frame for ${prop}`);
  return { w: frame.w, h: frame.h };
}

export function buildWorld(): { grid: WorldGrid; layout: LayoutResult } {
  const grid = new WorldGrid(WORLD_COLS, WORLD_ROWS, [...ROOMS, ...DOORS]);
  const layout = layoutWorld({
    placements: PLACEMENTS,
    projects: PROJECTS,
    slots: EXHIBIT_SLOTS,
    frameSize,
    eggPrompt: (id) => findEgg(id)?.prompt ?? 'Inspect',
  });
  return { grid, layout };
}

const STEP = 2;

function overlaps(a: PixelRect, b: PixelRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Positions (body centres, 2 px grid) the player can stand on, reachable from `start`. */
export function reachableFrom(grid: WorldGrid, bodies: readonly PixelRect[], start: Vec2): Vec2[] {
  const w = PLAYER_BODY.w;
  const h = PLAYER_BODY.h;
  const free = (cx: number, cy: number): boolean => {
    const r = { x: cx - w / 2, y: cy - h / 2, w, h };
    const x0 = Math.floor(r.x / TILE);
    const x1 = Math.floor((r.x + r.w - 0.01) / TILE);
    const y0 = Math.floor(r.y / TILE);
    const y1 = Math.floor((r.y + r.h - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) if (!grid.isFloor(tx, ty)) return false;
    return !bodies.some((b) => overlaps(r, b));
  };
  const key = (x: number, y: number) => `${x},${y}`;
  const sx = Math.round(start.x / STEP) * STEP;
  const sy = Math.round(start.y / STEP) * STEP;
  if (!free(sx, sy)) throw new Error(`Start ${sx},${sy} is blocked`);
  const seen = new Set([key(sx, sy)]);
  const queue: Vec2[] = [{ x: sx, y: sy }];
  const out: Vec2[] = [];
  while (queue.length > 0) {
    const p = queue.pop();
    if (!p) break;
    out.push(p);
    for (const [dx, dy] of [
      [STEP, 0],
      [-STEP, 0],
      [0, STEP],
      [0, -STEP],
    ] as const) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const k = key(nx, ny);
      if (seen.has(k) || !free(nx, ny)) continue;
      seen.add(k);
      queue.push({ x: nx, y: ny });
    }
  }
  return out;
}
