/**
 * Resolves the declarative placements (plus projects on pedestals) into
 * world-space sprites, solid bodies and interactables. Pure: the caller
 * supplies sprite sizes, so this runs identically in tests and in Phaser.
 */
import { PROP_DEFS, type PropId } from '../data/props';
import type { EngineId, ProjectRecord } from '../data/types';
import { TILE, type Placement } from '../data/world';
import {
  DEFAULT_REACH,
  type Interactable,
  type InteractionAction,
  type PixelRect,
} from '../interactions/interactions';

export interface ResolvedPlacement {
  readonly key: string;
  readonly prop: PropId;
  /** Sprite top-left in world pixels. */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly bodies: readonly PixelRect[];
  readonly interactable: Interactable | null;
  readonly marker: boolean;
  /** Optional stable handle used by effects (e.g. the grate). */
  readonly handle: string | null;
}

export interface LayoutInput {
  readonly placements: readonly Placement[];
  readonly projects: readonly ProjectRecord[];
  readonly slots: Readonly<Record<EngineId, readonly { x: number; y: number }[]>>;
  readonly frameSize: (prop: PropId) => { w: number; h: number };
  readonly eggPrompt: (eggId: string) => string;
}

export interface LayoutResult {
  readonly placements: ResolvedPlacement[];
  readonly warnings: string[];
}

/** Floor decals (messages, the grate) are used by standing on or right next to them. */
export const FLOOR_REACH = 8;

const PEDESTAL: Record<EngineId, PropId> = {
  godot: 'pedestal_godot',
  unity: 'pedestal_unity',
  unreal: 'pedestal_unreal',
};

/** Featured first, then registry order — a stable assignment of projects to slots. */
export function assignProjectsToSlots(
  projects: readonly ProjectRecord[],
  slots: LayoutInput['slots'],
): { placements: Placement[]; projectBySlot: Map<string, string>; warnings: string[] } {
  const placements: Placement[] = [];
  const projectBySlot = new Map<string, string>();
  const warnings: string[] = [];
  for (const engine of Object.keys(PEDESTAL) as EngineId[]) {
    const queue = projects
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.engine === engine && p.status !== 'hidden')
      .sort((a, b) => Number(b.p.featured ?? false) - Number(a.p.featured ?? false) || a.i - b.i)
      .map(({ p }) => p);
    const engineSlots = slots[engine];
    queue.forEach((project, index) => {
      const slot = engineSlots[index];
      if (!slot) {
        warnings.push(
          `No free pedestal in the ${engine} wing for "${project.id}" — add a slot in world.ts`,
        );
        return;
      }
      const key = `exhibit:${project.id}`;
      projectBySlot.set(key, project.id);
      placements.push({ prop: PEDESTAL[engine], x: slot.x, y: slot.y, marker: true, id: key });
    });
  }
  return { placements, projectBySlot, warnings };
}

function union(rects: readonly PixelRect[]): PixelRect {
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w));
  const y1 = Math.max(...rects.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function layoutWorld(input: LayoutInput): LayoutResult {
  const exhibits = assignProjectsToSlots(input.projects, input.slots);
  const all: Placement[] = [...input.placements, ...exhibits.placements];
  const counts = new Map<string, number>();

  const placements = all.map((p): ResolvedPlacement => {
    const def = PROP_DEFS[p.prop];
    const { w, h } = input.frameSize(p.prop);
    const x = Math.round(p.x * TILE);
    const y = Math.round(p.y * TILE);
    const bodies = ('bodies' in def ? def.bodies : []).map((b) => ({
      x: x + b.x,
      y: y + b.y,
      w: b.w,
      h: b.h,
    }));
    const baseKey = p.id ?? `${p.prop}@${p.x},${p.y}`;
    const n = counts.get(baseKey) ?? 0;
    counts.set(baseKey, n + 1);
    const key = n === 0 ? baseKey : `${baseKey}#${n}`;

    let action: InteractionAction | null = null;
    let prompt = '';
    const projectId = exhibits.projectBySlot.get(key);
    if (projectId) {
      action = { kind: 'project', projectId };
      prompt = 'Explore exhibit';
    } else if (p.interact?.kind === 'info') {
      action = { kind: 'info', panelId: p.interact.id };
      prompt = p.interact.prompt;
    } else if (p.interact?.kind === 'egg') {
      action = { kind: 'egg', eggId: p.interact.id };
      prompt = input.eggPrompt(p.interact.id);
    }

    let interactable: Interactable | null = null;
    if (action) {
      const spriteRect = { x, y, w, h };
      const rect = def.layer === 'object' && bodies.length > 0 ? union(bodies) : spriteRect;
      const reach = def.layer === 'floor' ? FLOOR_REACH : DEFAULT_REACH;
      interactable = { id: key, rect, reach, prompt, action, enabled: true };
    }
    return {
      key,
      prop: p.prop,
      x,
      y,
      w,
      h,
      bodies,
      interactable,
      marker: p.marker ?? false,
      handle: p.id ?? null,
    };
  });

  return { placements, warnings: exhibits.warnings };
}
