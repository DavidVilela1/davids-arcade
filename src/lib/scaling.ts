/**
 * Integer pixel scaling. Picks the smallest whole zoom factor that keeps the
 * logical view within MAX_VIEW, then sizes the logical canvas to cover the
 * window. Sprites are therefore always drawn at an exact whole multiple.
 */

export interface ViewportSize {
  /** Logical (game) pixels. */
  readonly width: number;
  readonly height: number;
  /** CSS pixels per game pixel. */
  readonly zoom: number;
}

export const MAX_VIEW = { width: 480, height: 440 } as const;
export const MIN_VIEW = { width: 160, height: 144 } as const;

export function computeViewport(cssWidth: number, cssHeight: number, max = MAX_VIEW): ViewportSize {
  const w = Math.max(1, Math.floor(cssWidth));
  const h = Math.max(1, Math.floor(cssHeight));
  let zoom = Math.max(1, Math.ceil(Math.max(w / max.width, h / max.height)));
  // Never zoom so far that a tiny window becomes unplayable.
  while (zoom > 1 && (w / zoom < MIN_VIEW.width || h / zoom < MIN_VIEW.height)) zoom--;
  return { width: Math.ceil(w / zoom), height: Math.ceil(h / zoom), zoom };
}
