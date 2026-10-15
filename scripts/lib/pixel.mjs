/**
 * Minimal, dependency-free pixel-art toolkit used by the asset generator.
 *
 * - A fixed 33-colour palette (dark / maroon / off-white / brass, no neon).
 * - An RGBA canvas with palette-aware drawing helpers and ASCII sprite stamping.
 * - A deterministic PNG encoder (zlib from Node core) and a seeded RNG, so the
 *   generated files are byte-for-byte reproducible.
 */
import { deflateSync } from 'node:zlib';

/** The single source of truth for every colour in the game. */
export const PALETTE = {
  k: '#0e0b0c', // ink
  K: '#1b1517',
  d: '#261d20',
  D: '#33282b',
  m: '#45383b',
  M: '#5a4a4c',
  g: '#75645f',
  G: '#978780',
  l: '#bcaea5',
  w: '#e2d9cf', // off-white
  W: '#f4eee6',
  r: '#3b1116', // maroon
  R: '#5e171d',
  e: '#87222a', // crimson
  E: '#ad3434',
  f: '#cf6655',
  b: '#33201a', // wood
  B: '#523424',
  n: '#7a5135',
  N: '#9c6f48',
  y: '#b08d4f', // brass
  Y: '#e0c58e', // candle light
  o: '#b8642f', // ember
  h: '#b9805f', // skin
  H: '#dba582',
  c: '#1d2b2e', // teal (Godot wing)
  C: '#33494a',
  t: '#5f7f74',
  s: '#232633', // slate (Unity wing)
  S: '#3b4057',
  v: '#646c8a',
  a: '#16211a', // phosphor (terminals)
  A: '#84a86b',
};

export function hexToRgba(hex, alpha = 255) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
}

const RGBA = Object.fromEntries(Object.entries(PALETTE).map(([k, hex]) => [k, hexToRgba(hex)]));

/** Resolves a palette key (or an explicit RGBA tuple) to RGBA. Returns null for "transparent". */
export function resolveColor(color) {
  if (color === null || color === undefined || color === '.' || color === ' ') return null;
  if (Array.isArray(color)) return color;
  const rgba = RGBA[color];
  if (!rgba) throw new Error(`Unknown palette key "${color}"`);
  return rgba;
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4);
  }

  set(x, y, color) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const rgba = resolveColor(color);
    if (!rgba) return;
    const i = (y * this.w + x) * 4;
    if (rgba[3] === 255) {
      this.data.set(rgba, i);
      return;
    }
    // Alpha-composite over whatever is already there (used for shadows).
    const a = rgba[3] / 255;
    const da = this.data[i + 3] / 255;
    const outA = a + da * (1 - a);
    for (let ch = 0; ch < 3; ch++) {
      const src = rgba[ch];
      const dst = this.data[i + ch];
      this.data[i + ch] = outA === 0 ? 0 : Math.round((src * a + dst * da * (1 - a)) / outA);
    }
    this.data[i + 3] = Math.round(outA * 255);
  }

  getKey(x, y) {
    const i = (y * this.w + x) * 4;
    if (this.data[i + 3] === 0) return null;
    const [r, g, b] = [this.data[i], this.data[i + 1], this.data[i + 2]];
    for (const [k, v] of Object.entries(RGBA)) if (v[0] === r && v[1] === g && v[2] === b) return k;
    return null;
  }

  rect(x, y, w, h, color) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, color);
  }

  frame(x, y, w, h, color) {
    this.hline(x, y, w, color);
    this.hline(x, y + h - 1, w, color);
    this.vline(x, y, h, color);
    this.vline(x + w - 1, y, h, color);
  }

  hline(x, y, len, color) {
    for (let i = 0; i < len; i++) this.set(x + i, y, color);
  }

  vline(x, y, len, color) {
    for (let j = 0; j < len; j++) this.set(x, y + j, color);
  }

  /** Bresenham line. */
  line(x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, color);
      if (x0 === x1 && y0 === y1) return;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** Stamps rows of palette keys. '.' and ' ' are transparent. `map` remaps characters. */
  ascii(x, y, rows, map = {}) {
    rows.forEach((row, j) => {
      [...row].forEach((ch, i) => {
        const key = ch in map ? map[ch] : ch;
        this.set(x + i, y + j, key);
      });
    });
  }

  blit(src, dx, dy, { flipX = false } = {}) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const si = (y * src.w + (flipX ? src.w - 1 - x : x)) * 4;
        if (src.data[si + 3] === 0) continue;
        this.set(dx + x, dy + y, [
          src.data[si],
          src.data[si + 1],
          src.data[si + 2],
          src.data[si + 3],
        ]);
      }
    }
  }

  /** Re-colours every opaque pixel through `fn(paletteKey) => paletteKey`. */
  recolor(fn) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const key = this.getKey(x, y);
        if (key) this.set(x, y, fn(key));
      }
    }
  }

  clone() {
    const c = new Canvas(this.w, this.h);
    c.data.set(this.data);
    return c;
  }
}

/** Draws a 3/4-view box: lit top face, front face, ink outline. */
export function box3d(c, x, y, w, h, topH, { top, front, hi, edge = 'k', outline = 'k' }) {
  c.rect(x, y, w, h, front);
  c.rect(x, y, w, topH, top);
  if (hi) c.hline(x + 1, y + 1, w - 2, hi);
  c.hline(x, y + topH, w, edge);
  c.frame(x, y, w, h, outline);
}

// ---------------------------------------------------------------------------
// 5x7 bitmap font (original glyph set) and a 3x5 digit font.
// ---------------------------------------------------------------------------
const FONT_5X7 = {
  A: '01110 10001 10001 11111 10001 10001 10001',
  B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110',
  D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111',
  F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111',
  H: '10001 10001 10001 11111 10001 10001 10001',
  I: '01110 00100 00100 00100 00100 00100 01110',
  J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001',
  L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001',
  N: '10001 10001 11001 10101 10011 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110',
  P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101',
  R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110',
  T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110',
  V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 10101 01010',
  X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100',
  Z: '11111 00001 00010 00100 01000 10000 11111',
  0: '01110 10001 10011 10101 11001 10001 01110',
  1: '00100 01100 00100 00100 00100 00100 01110',
  2: '01110 10001 00001 00010 00100 01000 11111',
  3: '11111 00010 00100 00010 00001 10001 01110',
  4: '00010 00110 01010 10010 11111 00010 00010',
  5: '11111 10000 11110 00001 00001 10001 01110',
  6: '00110 01000 10000 11110 10001 10001 01110',
  7: '11111 00001 00010 00100 01000 01000 01000',
  8: '01110 10001 10001 01110 10001 10001 01110',
  9: '01110 10001 10001 01111 00001 00010 01100',
  "'": '00100 00100 01000 00000 00000 00000 00000',
  '.': '00000 00000 00000 00000 00000 01100 01100',
  '!': '00100 00100 00100 00100 00100 00000 00100',
  '-': '00000 00000 00000 11111 00000 00000 00000',
  ':': '00000 01100 01100 00000 01100 01100 00000',
  '<': '00010 00100 01000 10000 01000 00100 00010',
  '>': '01000 00100 00010 00001 00010 00100 01000',
  ' ': '00000 00000 00000 00000 00000 00000 00000',
};

const DIGITS_3X5 = {
  0: '111 101 101 101 111',
  1: '010 110 010 010 111',
  2: '111 001 111 100 111',
  3: '111 001 111 001 111',
  4: '101 101 111 001 001',
  5: '111 100 111 001 111',
  6: '111 100 111 101 111',
  7: '111 001 010 010 010',
  8: '111 101 111 101 111',
  9: '111 101 111 001 111',
  '.': '000 000 000 000 010',
};

export function textWidth(text) {
  return text.length * 6 - 1;
}

export function drawText(c, x, y, text, color) {
  [...text.toUpperCase()].forEach((ch, idx) => {
    const glyph = FONT_5X7[ch];
    if (!glyph) throw new Error(`No glyph for "${ch}"`);
    glyph.split(' ').forEach((row, j) => {
      [...row].forEach((bit, i) => {
        if (bit === '1') c.set(x + idx * 6 + i, y + j, color);
      });
    });
  });
  return textWidth(text);
}

export function drawDigits(c, x, y, text, color) {
  let cx = x;
  for (const ch of text) {
    const glyph = DIGITS_3X5[ch];
    if (!glyph) throw new Error(`No 3x5 glyph for "${ch}"`);
    const width = ch === '.' ? 3 : 3;
    glyph.split(' ').forEach((row, j) => {
      [...row].forEach((bit, i) => {
        if (bit === '1') c.set(cx + i, y + j, color);
      });
    });
    cx += width + 1;
  }
  return cx - x - 1;
}

// ---------------------------------------------------------------------------
// PNG encoding
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

export function encodePng(canvas) {
  const { w, h, data } = canvas;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    Buffer.from(data.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Shelf-packs named frames into one atlas canvas and returns a Phaser
 * "JSON Hash" texture atlas description.
 */
export function packAtlas(frames, width, imageName, padding = 1) {
  const sorted = [...frames].sort(
    (a, b) => b.canvas.h - a.canvas.h || a.name.localeCompare(b.name),
  );
  let x = padding;
  let y = padding;
  let shelfH = 0;
  const placed = [];
  for (const f of sorted) {
    if (x + f.canvas.w + padding > width) {
      x = padding;
      y += shelfH + padding;
      shelfH = 0;
    }
    placed.push({ ...f, x, y });
    x += f.canvas.w + padding;
    shelfH = Math.max(shelfH, f.canvas.h);
  }
  const height = y + shelfH + padding;
  const atlas = new Canvas(width, height);
  const json = {
    frames: {},
    meta: { image: imageName, size: { w: width, h: height }, scale: '1' },
  };
  for (const p of placed.sort((a, b) => a.name.localeCompare(b.name))) {
    atlas.blit(p.canvas, p.x, p.y);
    json.frames[p.name] = {
      frame: { x: p.x, y: p.y, w: p.canvas.w, h: p.canvas.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: p.canvas.w, h: p.canvas.h },
      sourceSize: { w: p.canvas.w, h: p.canvas.h },
    };
  }
  return { atlas, json };
}
