/**
 * The interaction contract shared by every exhibit, panel and easter egg, and
 * the pure function that decides which one the player is addressing.
 */
import type { PixelRect, Vec2 } from '../../lib/geometry';
import type { InfoPanelId } from '../data/infoPanels';

export type { PixelRect, Vec2 };

export type InteractionAction =
  | { readonly kind: 'project'; readonly projectId: string }
  | { readonly kind: 'info'; readonly panelId: InfoPanelId }
  | { readonly kind: 'egg'; readonly eggId: string };

export interface Interactable {
  /** Unique per world object. */
  readonly id: string;
  /** Area the player must be close to, in world pixels. */
  readonly rect: PixelRect;
  /** Maximum distance (px) from the player's feet to `rect`. */
  readonly reach: number;
  readonly prompt: string;
  readonly action: InteractionAction;
  enabled: boolean;
}

export const DEFAULT_REACH = 14;
/** How strongly facing an object beats a slightly closer object behind you. */
export const FACING_WEIGHT = 6;

export function distanceToRect(p: Vec2, r: PixelRect): number {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

/**
 * Picks the interactable the player most plausibly means: within reach,
 * nearest first, with a bonus for the one they are facing. Ties break by id,
 * so the result is deterministic.
 */
export function resolveInteraction<T extends Interactable>(
  origin: Vec2,
  facing: Vec2,
  candidates: readonly T[],
): T | null {
  let best: T | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const c of candidates) {
    if (!c.enabled) continue;
    const dist = distanceToRect(origin, c.rect);
    if (dist > c.reach) continue;
    const cx = c.rect.x + c.rect.w / 2 - origin.x;
    const cy = c.rect.y + c.rect.h / 2 - origin.y;
    const len = Math.hypot(cx, cy) || 1;
    const facingDot = (cx / len) * facing.x + (cy / len) * facing.y;
    const score = dist - facingDot * FACING_WEIGHT;
    if (
      score < bestScore - 1e-9 ||
      (Math.abs(score - bestScore) < 1e-9 && best && c.id < best.id)
    ) {
      best = c;
      bestScore = score;
    }
  }
  return best;
}
