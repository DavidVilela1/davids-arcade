/**
 * The arcade's layout, declared as data.
 *
 * Coordinates are in tiles (16 px). Rooms are floor rectangles; walls are
 * generated automatically around them (three tiles tall on north sides so the
 * 3/4 wall faces have room). Doors are floor rectangles carved through walls.
 *
 *              +-----------+-------------+-----------+
 *              |  GODOT    |   UNREAL    |  UNITY    |   <- the Boss Room
 *              |  wing     | (boss wing) |  wing     |
 *              +----+------+------+------+-----+-----+
 *   +--------+ |            LOBBY (hub)              | +----------+
 *   |  DEV   |=|  bonfire, marquee, cabinets         |=| WORKSHOP |
 *   | BEDROOM| |                                     | |          |
 *   +--------+ +-------------------------------------+ +----------+
 *                         ... and something below the workshop.
 */
import type { EngineId } from './types';
import type { InfoPanelId } from './infoPanels';
import type { PropId } from './props';

export const TILE = 16;
export const WORLD_COLS = 60;
export const WORLD_ROWS = 64;

export type AreaId =
  'hub' | 'bedroom' | 'workshop' | 'godot' | 'unreal' | 'unity' | 'duct' | 'secret';
export type FloorTheme =
  'hub' | 'bedroom' | 'workshop' | 'godot' | 'unity' | 'unreal' | 'duct' | 'secret';
export type WallTheme = 'hub' | 'bedroom' | 'workshop' | 'godot' | 'unity' | 'unreal' | 'metal';
export type RegionId = 'main' | 'secret';

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface AreaDef {
  readonly id: AreaId;
  readonly name: string;
  readonly subtitle: string;
  readonly floor: FloorTheme;
  readonly wall: WallTheme;
  readonly region: RegionId;
  /** Movement multiplier (the crawlspace is slow). */
  readonly speed?: number;
}

export const AREAS: Readonly<Record<AreaId, AreaDef>> = {
  hub: {
    id: 'hub',
    name: 'The Lobby',
    subtitle: "David's Arcade",
    floor: 'hub',
    wall: 'hub',
    region: 'main',
  },
  bedroom: {
    id: 'bedroom',
    name: 'Dev Bedroom',
    subtitle: 'About',
    floor: 'bedroom',
    wall: 'bedroom',
    region: 'main',
  },
  workshop: {
    id: 'workshop',
    name: 'Workshop',
    subtitle: 'Skills · Contact · CV',
    floor: 'workshop',
    wall: 'workshop',
    region: 'main',
  },
  godot: {
    id: 'godot',
    name: 'Godot Wing',
    subtitle: 'The Boss Room · west',
    floor: 'godot',
    wall: 'godot',
    region: 'main',
  },
  unreal: {
    id: 'unreal',
    name: 'Unreal Wing',
    subtitle: 'The Boss Room',
    floor: 'unreal',
    wall: 'unreal',
    region: 'main',
  },
  unity: {
    id: 'unity',
    name: 'Unity Wing',
    subtitle: 'The Boss Room · east',
    floor: 'unity',
    wall: 'unity',
    region: 'main',
  },
  duct: {
    id: 'duct',
    name: 'Crawlspace',
    subtitle: 'Keep your head down',
    floor: 'duct',
    wall: 'metal',
    region: 'secret',
    speed: 0.55,
  },
  secret: {
    id: 'secret',
    name: '???',
    subtitle: 'The back channel',
    floor: 'secret',
    wall: 'metal',
    region: 'secret',
  },
};

/** Camera bounds per region, in pixels. Each is at least as large as the biggest viewport. */
export const REGIONS: Readonly<Record<RegionId, Rect>> = {
  main: { x: 0, y: 0, w: WORLD_COLS * TILE, h: 32 * TILE },
  secret: { x: 0, y: 33 * TILE, w: WORLD_COLS * TILE, h: 31 * TILE },
};

export interface FloorRect {
  readonly area: AreaId;
  readonly rect: Rect;
}

export const ROOMS: readonly FloorRect[] = [
  { area: 'godot', rect: { x: 1, y: 3, w: 18, h: 11 } },
  { area: 'unreal', rect: { x: 20, y: 3, w: 20, h: 11 } },
  { area: 'unity', rect: { x: 41, y: 3, w: 18, h: 11 } },
  { area: 'hub', rect: { x: 14, y: 17, w: 32, h: 13 } },
  { area: 'bedroom', rect: { x: 1, y: 19, w: 11, h: 11 } },
  { area: 'workshop', rect: { x: 48, y: 19, w: 11, h: 11 } },
  { area: 'duct', rect: { x: 40, y: 47, w: 13, h: 1 } },
  { area: 'duct', rect: { x: 40, y: 47, w: 1, h: 5 } },
  { area: 'secret', rect: { x: 22, y: 48, w: 16, h: 8 } },
];

export const DOORS: readonly FloorRect[] = [
  { area: 'hub', rect: { x: 15, y: 14, w: 2, h: 3 } }, // Lobby <-> Godot wing
  { area: 'hub', rect: { x: 29, y: 14, w: 2, h: 3 } }, // Lobby <-> Unreal wing
  { area: 'hub', rect: { x: 43, y: 14, w: 2, h: 3 } }, // Lobby <-> Unity wing
  { area: 'godot', rect: { x: 19, y: 7, w: 1, h: 3 } }, // Godot <-> Unreal
  { area: 'unity', rect: { x: 40, y: 7, w: 1, h: 3 } }, // Unreal <-> Unity
  { area: 'hub', rect: { x: 12, y: 24, w: 2, h: 2 } }, // Lobby <-> Bedroom
  { area: 'hub', rect: { x: 46, y: 24, w: 2, h: 2 } }, // Lobby <-> Workshop
  { area: 'duct', rect: { x: 38, y: 51, w: 2, h: 1 } }, // Crawlspace <-> hidden room
];

export interface CarpetDef {
  readonly style: 'red' | 'rug';
  readonly rect: Rect;
}

export const CARPETS: readonly CarpetDef[] = [
  { style: 'red', rect: { x: 28, y: 9, w: 4, h: 21 } },
  { style: 'rug', rect: { x: 3, y: 22, w: 6, h: 5 } },
];

export type InteractionRef =
  | { readonly kind: 'info'; readonly id: InfoPanelId; readonly prompt: string }
  | { readonly kind: 'egg'; readonly id: string };

export interface Placement {
  readonly prop: PropId;
  /** Sprite top-left, in tiles (fractions allowed for fine positioning). */
  readonly x: number;
  readonly y: number;
  readonly interact?: InteractionRef;
  /** Essential content gets a bobbing marker so it is never hidden. */
  readonly marker?: boolean;
  /** Hidden until a condition is met (see MainScene). */
  readonly id?: string;
}

const egg = (id: string): InteractionRef => ({ kind: 'egg', id });

export const PLACEMENTS: readonly Placement[] = [
  // --- Lobby -----------------------------------------------------------------
  { prop: 'sign_godot', x: 17.2, y: 15.6 },
  { prop: 'sign_boss', x: 24.85, y: 15.6 },
  { prop: 'sign_unreal', x: 31.3, y: 15.6 },
  { prop: 'sign_unity', x: 40.5, y: 15.6 },
  { prop: 'cabinet_red', x: 20, y: 16.6, interact: egg('cabinet') },
  { prop: 'cabinet_teal', x: 21, y: 16.6, interact: egg('cabinet') },
  { prop: 'cabinet_slate', x: 22, y: 16.6, interact: egg('cabinet') },
  { prop: 'cabinet_slate', x: 35, y: 16.6, interact: egg('cabinet') },
  { prop: 'cabinet_red', x: 36, y: 16.6, interact: egg('cabinet') },
  { prop: 'cabinet_teal', x: 37, y: 16.6, interact: egg('cabinet') },
  { prop: 'marquee', x: 26.97, y: 19.5 },
  { prop: 'bonfire', x: 25, y: 25.5, interact: egg('bonfire') },
  { prop: 'floor_message', x: 22.6, y: 27.2, interact: egg('message-lobby') },
  { prop: 'memorial', x: 44.5, y: 27.5, interact: egg('memorial') },
  { prop: 'couch', x: 16, y: 27.5 },
  { prop: 'lamp', x: 18.2, y: 26.9 },
  { prop: 'couch', x: 38, y: 27.5 },
  { prop: 'lamp', x: 40.2, y: 26.9 },
  { prop: 'plant', x: 33.8, y: 18.4 },
  { prop: 'plant', x: 14, y: 28.4 },
  { prop: 'plant', x: 45, y: 18.4 },
  { prop: 'signpost_bedroom', x: 14.3, y: 21.6 },
  { prop: 'signpost_workshop', x: 41.8, y: 21.6 },

  // --- Boss Room: Godot wing -------------------------------------------------
  { prop: 'node_sculpture', x: 3, y: 2.5 },
  { prop: 'node_sculpture', x: 15, y: 2.5 },
  { prop: 'plant', x: 1, y: 11.5 },
  { prop: 'easel', x: 17, y: 10, interact: egg('easel') },

  // --- Boss Room: Unreal wing ------------------------------------------------
  { prop: 'mech', x: 28.5, y: 2.75, interact: egg('mech') },
  { prop: 'banner', x: 23, y: 1 },
  { prop: 'banner', x: 26, y: 1 },
  { prop: 'banner', x: 33, y: 1 },
  { prop: 'banner', x: 36, y: 1 },
  { prop: 'candelabra', x: 21, y: 2.75 },
  { prop: 'candelabra', x: 38, y: 2.75 },
  { prop: 'candelabra', x: 21, y: 10.5 },
  { prop: 'candelabra', x: 38, y: 10.5 },

  // --- Boss Room: Unity wing -------------------------------------------------
  { prop: 'cube_stack', x: 42, y: 3.5 },
  { prop: 'cube_stack', x: 56, y: 3.5 },
  { prop: 'floor_message', x: 57, y: 12, interact: egg('message-unity') },
  { prop: 'plant', x: 41, y: 11.5 },

  // --- Dev Bedroom (About) ---------------------------------------------------
  { prop: 'bed', x: 1, y: 18.6 },
  { prop: 'window_boarded', x: 3.2, y: 17.4, interact: egg('boarded-window') },
  {
    prop: 'desk_pc',
    x: 4.6,
    y: 18.4,
    marker: true,
    interact: { kind: 'info', id: 'about', prompt: 'Read about David' },
  },
  { prop: 'bookshelf', x: 8.3, y: 17.6 },
  { prop: 'lamp', x: 10.5, y: 18.8 },
  { prop: 'd20_table', x: 1.2, y: 22.5, interact: egg('d20') },
  { prop: 'jet_stand', x: 1, y: 28, interact: egg('model-jet') },
  { prop: 'pizza_boxes', x: 10.8, y: 28, interact: egg('pizza-tower') },
  { prop: 'plant', x: 11, y: 26.6 },

  // --- Workshop (Skills, Contact, CV) ----------------------------------------
  {
    prop: 'notice_board',
    x: 48.4,
    y: 17.3,
    marker: true,
    interact: { kind: 'info', id: 'skills', prompt: 'Read the notice board' },
  },
  { prop: 'workbench', x: 50.8, y: 18.6 },
  { prop: 'oscilloscope', x: 52.9, y: 18.9 },
  { prop: 'storage_door', x: 54.6, y: 17, interact: egg('storage-door') },
  { prop: 'lockers', x: 56.6, y: 17.4 },
  { prop: 'lockers', x: 57.6, y: 17.4 },
  {
    prop: 'phone_table',
    x: 48.2,
    y: 21.5,
    marker: true,
    interact: { kind: 'info', id: 'contact', prompt: 'Pick up the phone' },
  },
  {
    prop: 'filing_cabinet',
    x: 48.2,
    y: 27.4,
    marker: true,
    interact: { kind: 'info', id: 'cv', prompt: 'Open the CV drawer' },
  },
  { prop: 'sweetroll', x: 52.5, y: 24.5, interact: egg('sweetroll') },
  { prop: 'crate', x: 55.6, y: 26.8 },
  { prop: 'crate', x: 58, y: 26.6 },
  { prop: 'floor_message', x: 54.2, y: 28.4, interact: egg('message-workshop') },
  { prop: 'grate_closed', x: 57, y: 28.3, id: 'grate', interact: egg('grate') },
  { prop: 'plant', x: 58.2, y: 23 },

  // --- The crawlspace and the hidden room ------------------------------------
  { prop: 'ladder', x: 52, y: 45, interact: egg('ladder') },
  { prop: 'codec_terminal', x: 28.5, y: 46.6, interact: egg('codec') },
  { prop: 'cardboard_box', x: 22.3, y: 54, interact: egg('cardboard-box') },
  { prop: 'lockers', x: 36.6, y: 47.2 },
  { prop: 'crate', x: 22.2, y: 48.2 },
];

/**
 * Pedestal positions per wing, in priority order: centre first (featured),
 * then left, then right. Projects fill them automatically; add more positions
 * here if a wing needs more exhibits.
 */
export const EXHIBIT_SLOTS: Readonly<Record<EngineId, readonly { x: number; y: number }[]>> = {
  godot: [
    { x: 9, y: 5 },
    { x: 4, y: 8 },
    { x: 14, y: 8 },
  ],
  unreal: [
    { x: 29, y: 6.5 },
    { x: 23, y: 7 },
    { x: 35, y: 7 },
  ],
  unity: [
    { x: 49, y: 5 },
    { x: 44, y: 8 },
    { x: 54, y: 8 },
  ],
};

/** Key positions in pixels (player feet). */
export const POINTS = {
  spawn: { x: 480, y: 456 },
  bonfire: { x: 408, y: 440 },
  ductEntry: { x: 840, y: 764 },
  grateExit: { x: 896, y: 470 },
} as const;
