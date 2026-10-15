/**
 * Turns the logical grid into tile indices for four render layers:
 * ground (floors), walls (3/4 faces and autotiled tops), carpets (9-slice)
 * and soft contact shadows. Pure functions; no Phaser.
 */
import type { AreaId, AreaDef, CarpetDef } from '../data/world';
import type { WorldGrid } from './WorldGrid';

export interface TilesetManifest {
  readonly tileSize: number;
  readonly columns: number;
  readonly floorVariants: number;
  readonly tiles: Readonly<Record<string, number>>;
}

export interface TileLayers {
  readonly ground: number[][];
  readonly walls: number[][];
  readonly carpets: number[][];
  readonly shadows: number[][];
}

export const EMPTY = -1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validates the generated tileset.json instead of trusting it blindly. */
export function parseTilesetManifest(value: unknown): TilesetManifest {
  if (!isRecord(value) || !isRecord(value.tiles)) throw new Error('tileset.json: malformed');
  const { tileSize, columns, floorVariants } = value;
  if (
    typeof tileSize !== 'number' ||
    typeof columns !== 'number' ||
    typeof floorVariants !== 'number'
  )
    throw new Error('tileset.json: missing dimensions');
  const tiles: Record<string, number> = {};
  for (const [name, index] of Object.entries(value.tiles)) {
    if (typeof index !== 'number') throw new Error(`tileset.json: bad index for ${name}`);
    tiles[name] = index;
  }
  return { tileSize, columns, floorVariants, tiles };
}

export type WallRender =
  | { readonly type: 'face'; readonly part: 'upper' | 'lower'; readonly area: AreaId }
  | { readonly type: 'top' }
  | { readonly type: 'none' };

/** Decides how a wall cell is drawn in 3/4 view. */
export function wallRender(grid: WorldGrid, x: number, y: number): WallRender {
  if (grid.kind(x, y) !== 'wall') return { type: 'none' };
  const below = grid.get(x, y + 1);
  if (below.kind === 'floor' && below.area)
    return { type: 'face', part: 'lower', area: below.area };
  const below2 = grid.get(x, y + 2);
  if (
    below.kind === 'wall' &&
    below2.kind === 'floor' &&
    below2.area &&
    grid.kind(x, y - 1) === 'wall'
  )
    return { type: 'face', part: 'upper', area: below2.area };
  return { type: 'top' };
}

/** Deterministic, mostly-plain floor variation. */
export function floorVariant(x: number, y: number): number {
  const h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0;
  const r = h % 10;
  return r < 7 ? 0 : r < 9 ? 1 : 2;
}

function lookup(manifest: TilesetManifest, name: string): number {
  const index = manifest.tiles[name];
  if (index === undefined) throw new Error(`Tile "${name}" is missing from tileset.json`);
  return index;
}

function grid2d(cols: number, rows: number): number[][] {
  return Array.from({ length: rows }, () => new Array<number>(cols).fill(EMPTY));
}

export function carpetPart(n: boolean, e: boolean, s: boolean, w: boolean): string {
  const v = !n ? 't' : !s ? 'b' : '';
  const h = !w ? 'l' : !e ? 'r' : '';
  return v + h || 'c';
}

export function buildTileLayers(
  grid: WorldGrid,
  manifest: TilesetManifest,
  areas: Readonly<Record<AreaId, AreaDef>>,
  carpets: readonly CarpetDef[],
): TileLayers {
  const { cols, rows } = grid;
  const layers: TileLayers = {
    ground: grid2d(cols, rows),
    walls: grid2d(cols, rows),
    carpets: grid2d(cols, rows),
    shadows: grid2d(cols, rows),
  };
  const opensInto = (x: number, y: number) => {
    const r = wallRender(grid, x, y);
    return grid.isFloor(x, y) || r.type === 'face';
  };

  for (let y = 0; y < rows; y++) {
    const ground = layers.ground[y];
    const walls = layers.walls[y];
    const shadows = layers.shadows[y];
    if (!ground || !walls || !shadows) continue;
    for (let x = 0; x < cols; x++) {
      const cell = grid.get(x, y);
      if (cell.kind === 'floor' && cell.area) {
        ground[x] = lookup(manifest, `floor_${areas[cell.area].floor}_${floorVariant(x, y)}`);
        const n = grid.kind(x, y - 1) === 'wall';
        const w = grid.kind(x - 1, y) === 'wall';
        if (n || w)
          shadows[x] = lookup(manifest, n && w ? 'shadow_nw' : n ? 'shadow_n' : 'shadow_w');
        continue;
      }
      const render = wallRender(grid, x, y);
      if (render.type === 'face') {
        walls[x] = lookup(manifest, `face_${areas[render.area].wall}_${render.part}`);
      } else if (render.type === 'top') {
        const mask =
          (opensInto(x, y - 1) ? 1 : 0) |
          (opensInto(x + 1, y) ? 2 : 0) |
          (opensInto(x, y + 1) ? 4 : 0) |
          (opensInto(x - 1, y) ? 8 : 0);
        walls[x] = lookup(manifest, `wall_top_${mask}`);
      }
    }
  }

  for (const style of ['red', 'rug'] as const) {
    const inStyle = (x: number, y: number) =>
      grid.isFloor(x, y) &&
      carpets.some(
        (c) =>
          c.style === style &&
          x >= c.rect.x &&
          x < c.rect.x + c.rect.w &&
          y >= c.rect.y &&
          y < c.rect.y + c.rect.h,
      );
    for (let y = 0; y < rows; y++) {
      const row = layers.carpets[y];
      if (!row) continue;
      for (let x = 0; x < cols; x++) {
        if (!inStyle(x, y)) continue;
        const part = carpetPart(
          inStyle(x, y - 1),
          inStyle(x + 1, y),
          inStyle(x, y + 1),
          inStyle(x - 1, y),
        );
        row[x] = lookup(manifest, `carpet_${style}_${part}`);
      }
    }
  }
  return layers;
}
