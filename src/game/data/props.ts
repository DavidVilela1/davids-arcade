/**
 * How each atlas sprite behaves in the world: animation, draw layer and solid
 * footprint. Body rectangles are in pixels relative to the sprite's top-left.
 */

export type PropLayer = 'floor' | 'wall' | 'object';

export interface BodyRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface PropDef {
  /** Atlas frame, or the frame prefix for animated props (`<frame>_<n>`). */
  readonly frame: string;
  readonly anim?: { readonly frames: number; readonly fps: number };
  readonly layer: PropLayer;
  readonly bodies?: readonly BodyRect[];
}

const obj = (frame: string, bodies: BodyRect[], anim?: PropDef['anim']): PropDef =>
  anim ? { frame, layer: 'object', bodies, anim } : { frame, layer: 'object', bodies };

export const PROP_DEFS = {
  cabinet_red: obj('cabinet_red', [{ x: 1, y: 20, w: 14, h: 12 }], { frames: 2, fps: 2 }),
  cabinet_slate: obj('cabinet_slate', [{ x: 1, y: 20, w: 14, h: 12 }], { frames: 2, fps: 1.5 }),
  cabinet_teal: obj('cabinet_teal', [{ x: 1, y: 20, w: 14, h: 12 }], { frames: 2, fps: 2.5 }),
  bonfire: obj('bonfire', [{ x: 3, y: 10, w: 10, h: 6 }], { frames: 3, fps: 7 }),
  marquee: obj(
    'marquee',
    [
      { x: 3, y: 23, w: 5, h: 5 },
      { x: 89, y: 23, w: 5, h: 5 },
    ],
    { frames: 2, fps: 2 },
  ),
  couch: obj('couch', [{ x: 0, y: 4, w: 32, h: 12 }]),
  plant: obj('plant', [{ x: 4, y: 17, w: 8, h: 7 }]),
  pedestal_godot: obj('pedestal_godot', [{ x: 4, y: 20, w: 24, h: 12 }], { frames: 2, fps: 1.5 }),
  pedestal_unity: obj('pedestal_unity', [{ x: 4, y: 20, w: 24, h: 12 }], { frames: 2, fps: 1.5 }),
  pedestal_unreal: obj('pedestal_unreal', [{ x: 4, y: 20, w: 24, h: 12 }], { frames: 2, fps: 1.5 }),
  desk_pc: obj('desk_pc', [{ x: 0, y: 12, w: 32, h: 12 }], { frames: 2, fps: 1.5 }),
  bed: obj('bed', [{ x: 0, y: 2, w: 24, h: 30 }]),
  bookshelf: obj('bookshelf', [{ x: 0, y: 18, w: 32, h: 14 }]),
  pizza_boxes: obj('pizza_boxes', [{ x: 1, y: 6, w: 14, h: 10 }]),
  jet_stand: obj('jet_stand', [{ x: 1, y: 10, w: 14, h: 6 }]),
  d20_table: obj('d20_table', [{ x: 3, y: 8, w: 10, h: 8 }]),
  sweetroll: obj('sweetroll', [{ x: 3, y: 8, w: 10, h: 8 }]),
  lamp: obj('lamp', [{ x: 4, y: 19, w: 8, h: 5 }]),
  workbench: obj('workbench', [{ x: 0, y: 12, w: 32, h: 12 }], { frames: 2, fps: 1.2 }),
  oscilloscope: obj('oscilloscope', [{ x: 1, y: 6, w: 14, h: 10 }], { frames: 4, fps: 6 }),
  crate: obj('crate', [{ x: 0, y: 4, w: 16, h: 12 }]),
  lockers: obj('lockers', [{ x: 0, y: 16, w: 16, h: 16 }]),
  phone_table: obj('phone_table', [{ x: 1, y: 14, w: 14, h: 10 }]),
  filing_cabinet: obj('filing_cabinet', [{ x: 1, y: 8, w: 14, h: 16 }]),
  candelabra: obj('candelabra', [{ x: 4, y: 27, w: 8, h: 5 }], { frames: 2, fps: 3 }),
  node_sculpture: obj('node_sculpture', [{ x: 2, y: 24, w: 12, h: 8 }]),
  cube_stack: obj('cube_stack', [{ x: 0, y: 16, w: 16, h: 8 }]),
  mech: obj('mech', [{ x: 4, y: 36, w: 40, h: 12 }]),
  easel: obj('easel', [{ x: 2, y: 24, w: 12, h: 8 }]),
  memorial: obj('memorial', [{ x: 1, y: 16, w: 14, h: 8 }]),
  codec_terminal: obj('codec_terminal', [{ x: 0, y: 18, w: 48, h: 14 }], { frames: 2, fps: 2 }),
  cardboard_box: obj('cardboard_box', [{ x: 1, y: 4, w: 14, h: 12 }]),
  signpost_bedroom: obj('signpost_bedroom', [{ x: 31, y: 18, w: 5, h: 4 }]),
  signpost_workshop: obj('signpost_workshop', [{ x: 31, y: 18, w: 5, h: 4 }]),
  grate_closed: { frame: 'grate_closed', layer: 'floor' },
  grate_open: { frame: 'grate_open', layer: 'floor' },
  floor_message: { frame: 'floor_message', layer: 'floor', anim: { frames: 2, fps: 1.5 } },
  window_boarded: { frame: 'window_boarded', layer: 'wall' },
  storage_door: { frame: 'storage_door', layer: 'wall' },
  notice_board: { frame: 'notice_board', layer: 'wall' },
  banner: { frame: 'banner', layer: 'wall' },
  ladder: { frame: 'ladder', layer: 'wall' },
  sign_godot: { frame: 'sign_godot', layer: 'wall' },
  sign_unity: { frame: 'sign_unity', layer: 'wall' },
  sign_unreal: { frame: 'sign_unreal', layer: 'wall' },
  sign_boss: { frame: 'sign_boss', layer: 'wall' },
} as const satisfies Record<string, PropDef>;

export type PropId = keyof typeof PROP_DEFS;

/** Atlas frames used outside PROP_DEFS (overlays). */
export const OVERLAY_FRAMES = { marker: 'marker', alert: 'alert' } as const;

export function propFrameNames(id: PropId): string[] {
  const def: PropDef = PROP_DEFS[id];
  if (!def.anim) return [def.frame];
  return Array.from({ length: def.anim.frames }, (_, i) => `${def.frame}_${i}`);
}
