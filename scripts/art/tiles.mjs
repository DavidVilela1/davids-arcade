/**
 * 16x16 environment tiles: themed floors (3 variants each), autotiled wall
 * tops (16 neighbour masks), two-row wall faces per theme, 9-slice carpets and
 * soft contact shadows. Everything is drawn procedurally from the palette.
 */
import { Canvas, rng } from '../lib/pixel.mjs';

export const TILE = 16;
export const FLOOR_THEMES = [
  'hub',
  'bedroom',
  'workshop',
  'godot',
  'unity',
  'unreal',
  'duct',
  'secret',
];
export const WALL_THEMES = ['hub', 'bedroom', 'workshop', 'godot', 'unity', 'unreal', 'metal'];
export const CARPET_STYLES = ['red', 'rug'];
const CARPET_PARTS = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br'];
const SHADOW = [14, 11, 12, 110];
const SHADOW_SOFT = [14, 11, 12, 55];

function speckle(c, rand, chance, color) {
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) if (rand() < chance) c.set(x, y, color);
}

// ---------------------------------------------------------------- floors ---
const FLOORS = {
  hub(c, rand, v) {
    // Dark parquet: horizontal planks with staggered seams.
    c.rect(0, 0, TILE, TILE, 'b');
    speckle(c, rand, 0.07, 'B');
    for (let row = 0; row < 4; row++) {
      const y = row * 4 + 3;
      c.hline(0, y, TILE, 'K');
      const seam = (row * 7 + v * 5 + 3) % TILE;
      c.vline(seam, row * 4, 3, 'K');
      c.set((seam + 1) % TILE, row * 4, 'B');
    }
  },
  bedroom(c, rand, v) {
    // Warmer vertical planks.
    c.rect(0, 0, TILE, TILE, 'B');
    speckle(c, rand, 0.06, 'n');
    speckle(c, rand, 0.04, 'b');
    for (let col = 0; col < 4; col++) {
      c.vline(col * 4 + 3, 0, TILE, 'b');
      const seam = (col * 5 + v * 7 + 2) % TILE;
      c.hline(col * 4, seam, 3, 'b');
    }
  },
  workshop(c, rand, v) {
    // Concrete with speckles, a faint slab grid and the occasional crack.
    c.rect(0, 0, TILE, TILE, 'm');
    speckle(c, rand, 0.1, 'D');
    speckle(c, rand, 0.05, 'M');
    c.hline(0, 0, TILE, 'D');
    c.vline(0, 0, TILE, 'D');
    if (v === 2) {
      c.line(4, 5, 8, 8, 'D');
      c.line(8, 8, 11, 7, 'D');
      c.line(8, 8, 9, 12, 'D');
    }
  },
  godot(c, rand, v) {
    // Teal tiles with an inlaid node-graph motif.
    c.rect(0, 0, TILE, TILE, 'c');
    speckle(c, rand, 0.04, 'C');
    c.hline(0, 0, TILE, 'K');
    c.vline(0, 0, TILE, 'K');
    if (v === 0) c.rect(1, 1, 2, 2, 'C');
    if (v === 1) {
      c.hline(1, 8, 15, 't');
      c.rect(7, 7, 3, 3, 'C');
      c.set(8, 8, 't');
    }
    if (v === 2) {
      c.vline(8, 1, 15, 'C');
      c.rect(7, 4, 3, 3, 't');
    }
  },
  unity(c, rand, v) {
    // Modular slate panels with bevels and bolts.
    c.rect(0, 0, TILE, TILE, 's');
    c.hline(0, 0, TILE, 'S');
    c.vline(0, 0, TILE, 'S');
    c.hline(0, 15, TILE, 'K');
    c.vline(15, 0, TILE, 'K');
    for (const [x, y] of [
      [2, 2],
      [13, 2],
      [2, 13],
      [13, 13],
    ])
      c.set(x, y, 'v');
    if (v === 1) for (let i = 0; i < 4; i++) c.hline(5, 5 + i * 2, 6, 'K');
    if (v === 2) {
      c.frame(4, 4, 8, 8, 'S');
      c.set(4, 4, 'v');
    }
    speckle(c, rand, 0.02, 'S');
  },
  unreal(c, rand, v) {
    // Near-black stone slabs; rare maroon veins.
    c.rect(0, 0, TILE, TILE, 'd');
    speckle(c, rand, 0.08, 'D');
    speckle(c, rand, 0.04, 'K');
    c.hline(0, 15, TILE, 'k');
    c.vline(15, 0, TILE, 'k');
    c.hline(0, 0, 15, 'D');
    if (v === 2) {
      c.line(2, 12, 6, 9, 'r');
      c.line(6, 9, 10, 10, 'r');
    }
  },
  duct(c, rand) {
    c.rect(0, 0, TILE, TILE, 'm');
    for (let y = 1; y < TILE; y += 4) c.hline(0, y, TILE, 'g');
    for (let y = 3; y < TILE; y += 4) c.hline(0, y, TILE, 'D');
    speckle(c, rand, 0.03, 'M');
  },
  secret(c) {
    c.rect(0, 0, TILE, TILE, 'K');
    for (let y = 1; y < TILE; y += 4) for (let x = 1; x < TILE; x += 4) c.rect(x, y, 2, 2, 'k');
    c.hline(0, 0, TILE, 'd');
    c.vline(0, 0, TILE, 'd');
  },
};

// ----------------------------------------------------------------- walls ---
/** mask bits: 1 = north open, 2 = east open, 4 = south open, 8 = west open. */
function wallTop(c, mask, rand) {
  c.rect(0, 0, TILE, TILE, 'K');
  speckle(c, rand, 0.05, 'd');
  if (mask & 1) c.hline(0, 0, TILE, 'M');
  if (mask & 8) c.vline(0, 0, TILE, 'M');
  if (mask & 2) c.vline(15, 0, TILE, 'm');
  if (mask & 4) {
    c.hline(0, 15, TILE, 'g');
    c.hline(0, 14, TILE, 'D');
  }
}

const FACES = {
  hub: {
    upper(c) {
      c.rect(0, 0, TILE, TILE, 'b');
      c.vline(0, 0, TILE, 'K');
      c.frame(2, 2, 12, 13, 'K');
      c.hline(3, 3, 10, 'B');
      c.vline(3, 3, 11, 'B');
      c.hline(0, 0, TILE, 'K');
    },
    lower(c) {
      c.rect(0, 0, TILE, TILE, 'B');
      c.hline(0, 0, TILE, 'n');
      c.hline(0, 1, TILE, 'b');
      c.hline(0, 2, TILE, 'R');
      c.frame(2, 4, 12, 8, 'b');
      c.hline(3, 5, 10, 'n');
      c.vline(0, 0, TILE, 'b');
      c.hline(0, 13, TILE, 'K');
      c.rect(0, 14, TILE, 2, 'k');
    },
  },
  bedroom: {
    upper(c) {
      c.rect(0, 0, TILE, TILE, 'R');
      for (let x = 0; x < TILE; x += 4) c.vline(x, 0, TILE, 'r');
      for (let y = 2; y < TILE; y += 6) c.set(2, y, 'e');
      for (let y = 5; y < TILE; y += 6) c.set(10, y, 'e');
    },
    lower(c) {
      c.rect(0, 0, TILE, 12, 'R');
      for (let x = 0; x < TILE; x += 4) c.vline(x, 0, 12, 'r');
      c.set(2, 3, 'e');
      c.set(10, 8, 'e');
      c.hline(0, 11, TILE, 'n');
      c.rect(0, 12, TILE, 3, 'B');
      c.hline(0, 15, TILE, 'k');
    },
  },
  workshop: {
    upper(c) {
      bricks(c, 0, TILE);
    },
    lower(c) {
      bricks(c, 0, 13);
      c.rect(0, 13, TILE, 3, 'K');
      c.hline(0, 13, TILE, 'g');
    },
  },
  godot: {
    upper(c) {
      c.rect(0, 0, TILE, TILE, 'C');
      c.vline(0, 0, TILE, 'c');
      // Small hexagon outline motif.
      c.hline(6, 4, 4, 't');
      c.hline(6, 11, 4, 't');
      c.line(5, 5, 4, 7, 't');
      c.line(4, 8, 5, 10, 't');
      c.line(10, 5, 11, 7, 't');
      c.line(11, 8, 10, 10, 't');
    },
    lower(c) {
      c.rect(0, 0, TILE, TILE, 'c');
      c.hline(0, 0, TILE, 't');
      c.hline(0, 1, TILE, 'C');
      c.vline(0, 0, TILE, 'K');
      c.rect(0, 13, TILE, 3, 'K');
      c.set(8, 7, 'C');
    },
  },
  unity: {
    upper(c) {
      c.rect(0, 0, TILE, TILE, 'S');
      c.frame(1, 1, 14, 14, 'v');
      c.frame(0, 0, TILE, TILE, 's');
      c.set(3, 3, 'w');
      c.set(12, 3, 'w');
    },
    lower(c) {
      c.rect(0, 0, TILE, TILE, 's');
      c.hline(0, 0, TILE, 'v');
      c.frame(2, 3, 12, 8, 'S');
      c.vline(0, 0, TILE, 'K');
      c.rect(0, 13, TILE, 3, 'K');
    },
  },
  unreal: {
    upper(c) {
      c.rect(0, 0, TILE, TILE, 'd');
      c.hline(0, 7, TILE, 'k');
      c.vline(5, 0, 7, 'k');
      c.vline(12, 8, 8, 'k');
      c.hline(0, 0, TILE, 'D');
      c.hline(6, 1, 5, 'D');
      c.hline(0, 8, 11, 'D');
    },
    lower(c) {
      c.rect(0, 0, TILE, TILE, 'd');
      c.hline(0, 0, TILE, 'k');
      c.rect(0, 1, TILE, 2, 'e');
      c.hline(0, 3, TILE, 'R');
      c.vline(9, 4, 9, 'k');
      c.hline(0, 4, 9, 'D');
      c.rect(0, 13, TILE, 3, 'k');
    },
  },
  metal: {
    upper(c) {
      c.rect(0, 0, TILE, TILE, 'm');
      c.frame(0, 0, TILE, TILE, 'D');
      for (const [x, y] of [
        [2, 2],
        [13, 2],
        [2, 13],
        [13, 13],
      ])
        c.set(x, y, 'G');
    },
    lower(c) {
      c.rect(0, 0, TILE, TILE, 'm');
      c.hline(0, 0, TILE, 'g');
      for (let x = 2; x < 14; x += 3) c.vline(x, 4, 6, 'D');
      c.vline(0, 0, TILE, 'D');
      c.rect(0, 13, TILE, 3, 'K');
    },
  },
};

function bricks(c, y0, h) {
  c.rect(0, y0, TILE, h, 'D');
  for (let row = 0; row * 4 < h; row++) {
    const offset = row % 2 === 0 ? 0 : 4;
    for (let x = -offset; x < TILE; x += 8) {
      const top = y0 + row * 4;
      const bh = Math.min(3, y0 + h - top);
      if (bh <= 0) continue;
      c.rect(
        Math.max(x, 0),
        top,
        Math.min(7, x + 7) - Math.max(x, 0),
        bh,
        row % 3 === 1 ? 'm' : 'M',
      );
      if (x >= 0) c.set(x, top, 'g');
    }
  }
}

// --------------------------------------------------------------- carpets ---
function carpet(c, style, part) {
  const colors =
    style === 'red'
      ? { base: 'e', pattern: 'R', border: 'R', trim: 'y' }
      : { base: 'S', pattern: 'v', border: 'K', trim: 'w' };
  c.rect(0, 0, TILE, TILE, colors.base);
  // Diamond lattice pattern in the field.
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++)
      if ((x + y) % 8 === 0 || (x - y + 16) % 8 === 0) c.set(x, y, colors.pattern);
  const n = part.startsWith('t');
  const s = part.startsWith('b');
  const w = part.endsWith('l');
  const e = part.endsWith('r');
  if (n) {
    c.rect(0, 0, TILE, 3, colors.border);
    c.hline(0, 3, TILE, colors.trim);
  }
  if (s) {
    c.rect(0, 13, TILE, 3, colors.border);
    c.hline(0, 12, TILE, colors.trim);
  }
  if (w) {
    c.rect(0, 0, 3, TILE, colors.border);
    c.vline(3, n ? 3 : 0, TILE - (n ? 3 : 0) - (s ? 3 : 0), colors.trim);
  }
  if (e) {
    c.rect(13, 0, 3, TILE, colors.border);
    c.vline(12, n ? 3 : 0, TILE - (n ? 3 : 0) - (s ? 3 : 0), colors.trim);
  }
  // Ink edge on the outer rim.
  if (n) c.hline(0, 0, TILE, 'k');
  if (s) c.hline(0, 15, TILE, 'k');
  if (w) c.vline(0, 0, TILE, 'k');
  if (e) c.vline(15, 0, TILE, 'k');
}

// ---------------------------------------------------------------- build ----
export function buildTileset() {
  const tiles = [];
  const add = (name, draw) => {
    const c = new Canvas(TILE, TILE);
    draw(c);
    tiles.push({ name, canvas: c });
  };

  add('void', (c) => c.rect(0, 0, TILE, TILE, 'k'));
  FLOOR_THEMES.forEach((theme, ti) => {
    for (let v = 0; v < 3; v++)
      add(`floor_${theme}_${v}`, (c) => FLOORS[theme](c, rng(1000 + ti * 10 + v), v));
  });
  for (let mask = 0; mask < 16; mask++)
    add(`wall_top_${mask}`, (c) => wallTop(c, mask, rng(500 + mask)));
  for (const theme of WALL_THEMES) {
    add(`face_${theme}_upper`, (c) => FACES[theme].upper(c));
    add(`face_${theme}_lower`, (c) => FACES[theme].lower(c));
  }
  for (const style of CARPET_STYLES)
    for (const part of CARPET_PARTS) add(`carpet_${style}_${part}`, (c) => carpet(c, style, part));
  add('shadow_n', (c) => {
    c.rect(0, 0, TILE, 3, SHADOW);
    c.hline(0, 3, TILE, SHADOW_SOFT);
  });
  add('shadow_w', (c) => {
    c.rect(0, 0, 2, TILE, SHADOW);
    c.vline(2, 0, TILE, SHADOW_SOFT);
  });
  add('shadow_nw', (c) => {
    c.rect(0, 0, TILE, 3, SHADOW);
    c.hline(2, 3, TILE - 2, SHADOW_SOFT);
    c.rect(0, 3, 2, TILE - 3, SHADOW);
    c.vline(2, 4, TILE - 4, SHADOW_SOFT);
  });

  const columns = 16;
  const rows = Math.ceil(tiles.length / columns);
  const sheet = new Canvas(columns * TILE, rows * TILE);
  const index = {};
  tiles.forEach((t, i) => {
    sheet.blit(t.canvas, (i % columns) * TILE, Math.floor(i / columns) * TILE);
    index[t.name] = i;
  });
  return {
    canvas: sheet,
    manifest: {
      tileSize: TILE,
      columns,
      floorThemes: FLOOR_THEMES,
      wallThemes: WALL_THEMES,
      carpetStyles: CARPET_STYLES,
      floorVariants: 3,
      tiles: index,
    },
  };
}
