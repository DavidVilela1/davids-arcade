import { describe, expect, it } from 'vitest';
import { PLAYER_BODY } from '../src/game/config/constants';
import { EASTER_EGGS } from '../src/game/data/easterEggs';
import { PROP_DEFS, propFrameNames, type PropId } from '../src/game/data/props';
import {
  AREAS,
  CARPETS,
  PLACEMENTS,
  POINTS,
  REGIONS,
  TILE,
  WORLD_COLS,
  WORLD_ROWS,
} from '../src/game/data/world';
import { distanceToRect } from '../src/game/interactions/interactions';
import { buildTileLayers, parseTilesetManifest } from '../src/game/world/autotile';
import { MAX_VIEW } from '../src/lib/scaling';
import { atlas, buildWorld, reachableFrom, readPublicJson } from './helpers/world';

const { grid, layout } = buildWorld();
const bodies = layout.placements.flatMap((p) => p.bodies);
const centre = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - PLAYER_BODY.h / 2 });

describe('world layout', () => {
  it('encloses every floor tile (no gaps into the void)', () => {
    for (let y = 0; y < WORLD_ROWS; y++)
      for (let x = 0; x < WORLD_COLS; x++) {
        if (!grid.isFloor(x, y)) continue;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            expect(grid.kind(x + dx, y + dy), `${x + dx},${y + dy}`).not.toBe('void');
      }
  });

  it('has key points on walkable floor', () => {
    for (const [name, p] of Object.entries(POINTS)) {
      expect(grid.isFloor(Math.floor(p.x / TILE), Math.floor((p.y - 3) / TILE)), name).toBe(true);
    }
  });

  it('keeps every region at least as large as the biggest viewport', () => {
    for (const r of Object.values(REGIONS)) {
      expect(r.w).toBeGreaterThanOrEqual(MAX_VIEW.width + 1);
      expect(r.h).toBeGreaterThanOrEqual(MAX_VIEW.height + 1);
    }
  });

  it('keeps each area inside its camera region', () => {
    for (let y = 0; y < WORLD_ROWS; y++)
      for (let x = 0; x < WORLD_COLS; x++) {
        const area = grid.areaAt(x, y);
        if (!area) continue;
        const r = REGIONS[AREAS[area].region];
        expect(
          x * TILE >= r.x &&
            (x + 1) * TILE <= r.x + r.w &&
            y * TILE >= r.y &&
            (y + 1) * TILE <= r.y + r.h,
        ).toBe(true);
      }
  });

  it('places one pedestal per visible project and reports no overflow', () => {
    expect(layout.warnings).toEqual([]);
    expect(layout.placements.filter((p) => p.interactable?.action.kind === 'project')).toHaveLength(
      3,
    );
  });

  it('gives every interactable a unique id', () => {
    const ids = layout.placements.flatMap((p) => (p.interactable ? [p.interactable.id] : []));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references only existing easter eggs and atlas frames', () => {
    for (const p of PLACEMENTS) {
      if (p.interact?.kind === 'egg')
        expect(
          EASTER_EGGS.some((e) => e.id === p.interact?.id),
          p.interact.id,
        ).toBe(true);
    }
    for (const id of Object.keys(PROP_DEFS) as PropId[])
      for (const frame of propFrameNames(id)) expect(atlas.frames[frame], frame).toBeDefined();
  });

  it('builds every tile layer from the generated tileset', () => {
    const manifest = parseTilesetManifest(readPublicJson('game/tiles/tileset.json'));
    expect(() => buildTileLayers(grid, manifest, AREAS, CARPETS)).not.toThrow();
  });
});

describe('reachability (no softlocks)', () => {
  const mainReach = reachableFrom(grid, bodies, centre(POINTS.spawn));
  const secretReach = reachableFrom(grid, bodies, centre(POINTS.ductEntry));
  const inRegion = (y: number, region: 'main' | 'secret') =>
    y >= REGIONS[region].y && y < REGIONS[region].y + REGIONS[region].h;

  it('can reach every interactable from where it lives', () => {
    for (const p of layout.placements) {
      const it = p.interactable;
      if (!it) continue;
      const pool = inRegion(it.rect.y, 'secret') ? secretReach : mainReach;
      const ok = pool.some((pos) => distanceToRect(pos, it.rect) <= it.reach);
      expect(ok, `${it.id} (${it.prompt}) is unreachable`).toBe(true);
    }
  });

  it('can reach every room in the main region from the spawn point', () => {
    const areas = new Set(
      mainReach.map((p) => grid.areaAt(Math.floor(p.x / TILE), Math.floor(p.y / TILE))),
    );
    for (const id of ['hub', 'bedroom', 'workshop', 'godot', 'unreal', 'unity'] as const)
      expect(areas.has(id), id).toBe(true);
  });

  it('connects the crawlspace to the hidden room', () => {
    const areas = new Set(
      secretReach.map((p) => grid.areaAt(Math.floor(p.x / TILE), Math.floor(p.y / TILE))),
    );
    expect(areas.has('secret')).toBe(true);
  });

  it('lets the player return to the lobby from the bonfire point and the grate exit', () => {
    for (const p of [POINTS.bonfire, POINTS.grateExit]) {
      expect(() => reachableFrom(grid, bodies, centre(p))).not.toThrow();
    }
    const fromGrate = reachableFrom(grid, bodies, centre(POINTS.grateExit));
    expect(
      fromGrate.some((p) => grid.areaAt(Math.floor(p.x / TILE), Math.floor(p.y / TILE)) === 'hub'),
    ).toBe(true);
  });
});
