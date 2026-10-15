/**
 * Asset keys and paths. All files are generated locally by
 * scripts/generate-assets.mjs into public/game.
 */
import { ASSET_ROOT } from './constants';

export const TEXTURES = {
  tileset: { key: 'tileset', url: `${ASSET_ROOT}/tiles/tileset.png` },
  player: { key: 'player', url: `${ASSET_ROOT}/sprites/player.png` },
  props: {
    key: 'props',
    url: `${ASSET_ROOT}/sprites/props.png`,
    atlas: `${ASSET_ROOT}/sprites/props.json`,
  },
} as const;

export const DATA = {
  tileset: { key: 'tileset-manifest', url: `${ASSET_ROOT}/tiles/tileset.json` },
} as const;

export const SFX_KEYS = [
  'ui_open',
  'ui_close',
  'interact',
  'tune',
  'secret',
  'alert',
  'codec_ring',
  'bonfire',
  'dice',
  'vent',
  'box',
  'step',
] as const;

export type SfxKey = (typeof SFX_KEYS)[number];

export const MUSIC = {
  key: 'music_ambient',
  url: `${ASSET_ROOT}/audio/music_ambient.wav`,
} as const;

export const sfxUrl = (key: SfxKey): string => `${ASSET_ROOT}/audio/${key}.wav`;
