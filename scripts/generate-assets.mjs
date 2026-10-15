#!/usr/bin/env node
/**
 * Regenerates every visual and audio asset in public/game from source code.
 *
 *   npm run assets
 *
 * The output is deterministic: running it twice produces identical files, and
 * ASSET_MANIFEST.json records a SHA-256 for each one.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canvasToSvg, buildExtras } from './art/extras.mjs';
import { PLAYER_FRAME, buildPlayerSheet } from './art/player.mjs';
import { buildProps } from './art/props.mjs';
import { buildTileset } from './art/tiles.mjs';
import { buildSounds } from './audio/sounds.mjs';
import { encodeWav } from './audio/synth.mjs';
import { PALETTE, encodePng, packAtlas } from './lib/pixel.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'game');
const written = [];

function write(relPath, data, description) {
  const file = join(OUT, relPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
  written.push({
    path: relative(join(ROOT, 'public'), file).split('\\').join('/'),
    bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
    description,
  });
}

const json = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

rmSync(OUT, { recursive: true, force: true });

// Tiles.
const tileset = buildTileset();
write('tiles/tileset.png', encodePng(tileset.canvas), '16x16 floor, wall, carpet and shadow tiles');
write('tiles/tileset.json', json(tileset.manifest), 'Tile name -> index lookup for the tileset');

// Player.
write(
  'sprites/player.png',
  encodePng(buildPlayerSheet()),
  'Player sprite sheet (idle, walk, interact, cardboard box)',
);
write('sprites/player.json', json(PLAYER_FRAME), 'Player sprite sheet frame layout');

// Props atlas.
const { atlas, json: atlasJson } = packAtlas(buildProps(), 256, 'props.png');
write('sprites/props.png', encodePng(atlas), 'Furniture, exhibits, decor and signage atlas');
write('sprites/props.json', json(atlasJson), 'Phaser JSON-hash atlas for props.png');

// Portraits, sample media and favicon.
const extras = buildExtras();
for (const [name, canvas] of Object.entries(extras.portraits))
  write(`portraits/${name}.png`, encodePng(canvas), `Codec portrait: ${name}`);
for (const [engine, canvas] of Object.entries(extras.media))
  write(
    `projects/sample-${engine}.png`,
    encodePng(canvas),
    `Placeholder media for the sample ${engine} project`,
  );

const faviconSvg = Buffer.from(canvasToSvg(extras.favicon));
writeFileSync(join(ROOT, 'public', 'favicon.svg'), faviconSvg);
written.push({
  path: 'favicon.svg',
  bytes: faviconSvg.length,
  sha256: createHash('sha256').update(faviconSvg).digest('hex'),
  description: 'Pixel arcade-cabinet favicon',
});

// Audio.
const sounds = buildSounds();
for (const [name, samples] of Object.entries(sounds.sfx))
  write(`audio/${name}.wav`, encodeWav(samples), `Sound effect: ${name}`);
for (const [name, samples] of Object.entries(sounds.music))
  write(`audio/music_${name}.wav`, encodeWav(samples), `Seamless music loop: ${name}`);

// Manifest (provenance + integrity).
const manifest = {
  generator: 'scripts/generate-assets.mjs',
  license:
    "All rights reserved. Original assets created for David's Arcade; see LICENSE and ASSET_CREDITS.md.",
  thirdPartyAssets: [],
  palette: PALETTE,
  files: written.sort((a, b) => a.path.localeCompare(b.path)),
};
write('ASSET_MANIFEST.json', json(manifest), 'This manifest');

const total = written.reduce((sum, f) => sum + f.bytes, 0);
console.info(
  `Generated ${written.length} assets (${(total / 1024).toFixed(0)} KiB) in public/game`,
);
