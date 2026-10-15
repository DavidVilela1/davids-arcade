/**
 * Furniture, exhibits, decor, easter-egg objects and signage. Every prop is an
 * original drawing built from palette primitives and small ASCII stamps.
 * Animated props are emitted as `<name>_<frame>`.
 */
import { Canvas, box3d, drawDigits, drawText, rng, textWidth } from '../lib/pixel.mjs';
import { buildCardboardBox } from './player.mjs';

const ENGINE_TINTS = {
  godot: ['c', 'C', 't'],
  unity: ['s', 'S', 'v'],
  unreal: ['r', 'e', 'E'],
};

function disc(c, cx, cy, r, color) {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r + r * 0.6) c.set(cx + x, cy + y, color);
}

// ------------------------------------------------------------------ lobby --
function cabinet(variant, frame) {
  const c = new Canvas(16, 32);
  const [side, sideDark] = { red: ['e', 'R'], slate: ['S', 's'], teal: ['C', 'c'] }[variant];
  c.rect(0, 0, 16, 32, 'd');
  c.rect(1, 1, 2, 30, side);
  c.rect(13, 1, 2, 30, sideDark);
  // Marquee.
  c.rect(1, 1, 14, 5, frame === 0 ? 'Y' : 'y');
  c.hline(3, 3, 10, 'o');
  c.hline(1, 6, 14, 'k');
  // Screen.
  c.rect(1, 7, 14, 10, 'K');
  c.rect(3, 8, 10, 8, 'a');
  if (variant === 'red') {
    // A tiny road racing toward the horizon.
    c.hline(3, 10, 10, 'C');
    c.line(7, 11, 4, 15, 'A');
    c.line(8, 11, 11, 15, 'A');
    c.set(frame === 0 ? 7 : 8, frame === 0 ? 13 : 14, 'E');
  } else if (variant === 'slate') {
    // Falling blocks.
    c.rect(4, 13, 8, 2, 't');
    c.rect(5, 12, 2, 1, 'A');
    c.rect(8, frame === 0 ? 9 : 10, 2, 2, 'A');
  } else {
    // Paddles and a ball.
    c.vline(4, frame === 0 ? 9 : 11, 3, 'A');
    c.vline(11, frame === 0 ? 12 : 10, 3, 'A');
    c.set(frame === 0 ? 7 : 9, frame === 0 ? 11 : 12, 'W');
  }
  // Control deck.
  c.rect(0, 17, 16, 4, 'm');
  c.hline(1, 17, 14, 'M');
  c.vline(4, 15, 3, 'k');
  c.rect(3, 15, 2, 1, 'E');
  c.set(9, 19, 'f');
  c.set(11, 19, 'w');
  c.hline(0, 21, 16, 'k');
  // Coin door.
  c.rect(6, 24, 4, 5, 'D');
  c.hline(7, 25, 2, 'y');
  c.frame(0, 0, 16, 32, 'k');
  return c;
}

const BONFIRE_FLAMES = [
  [
    '......olo.......',
    '.....oElEo......',
    '....oEYlYEo.....',
    '....EYYlYYE.....',
    '...oEYWlWYEo....',
    '...oEYYlYYEo....',
    '....oEElEEo.....',
  ],
  [
    '.....o.l.o......',
    '.....EolEo......',
    '....oEYlYEo.....',
    '...oEYYlYYEo....',
    '...EYYWlWYYE....',
    '...oEYYlYYEo....',
    '....oEElEEo.....',
  ],
  [
    '......olo.......',
    '......ElE.......',
    '.....oYlYo......',
    '....oEYlYEo.....',
    '....EYWlWYE.....',
    '...oEYYlYYEo....',
    '....oEElEEo.....',
  ],
];

function bonfire(frame) {
  const c = new Canvas(16, 16);
  c.ascii(0, 0, [
    '................',
    '.......y........',
    '.......b........',
    '.....kgggk......',
    '.......l........',
    ...BONFIRE_FLAMES[frame],
    '..gmbbBlBbbmg...',
    '.gGmkkkkkkkmGg..',
    '..gg.mmmmm.gg...',
    '................',
  ]);
  return c;
}

function marquee(frame) {
  const text = "DAVID'S ARCADE";
  const w = textWidth(text) + 14;
  const c = new Canvas(w, 28);
  // Posts.
  c.rect(4, 18, 3, 10, 'b');
  c.rect(w - 7, 18, 3, 10, 'b');
  c.vline(4, 18, 10, 'B');
  c.vline(w - 7, 18, 10, 'B');
  // Board.
  c.rect(0, 0, w, 19, 'r');
  c.frame(1, 1, w - 2, 17, 'y');
  c.frame(0, 0, w, 19, 'k');
  drawText(c, 7, 6, text, 'Y');
  // Chase lights.
  for (let x = 3; x < w - 3; x += 3) {
    const on = (x / 3 + frame) % 2 === 0;
    c.set(x, 2, on ? 'Y' : 'o');
    c.set(x, 16, on ? 'o' : 'Y');
  }
  return c;
}

function couch() {
  const c = new Canvas(32, 16);
  c.rect(0, 0, 32, 16, 'e');
  c.rect(0, 0, 32, 6, 'R');
  c.hline(1, 1, 30, 'E');
  c.rect(0, 0, 4, 16, 'R');
  c.rect(28, 0, 4, 16, 'R');
  c.vline(16, 6, 9, 'R');
  c.hline(4, 7, 24, 'f');
  c.hline(0, 15, 32, 'k');
  c.frame(0, 0, 32, 16, 'k');
  return c;
}

function plant() {
  const c = new Canvas(16, 24);
  const leaves = [
    [8, 15, 3, 4],
    [8, 15, 13, 5],
    [8, 15, 8, 1],
    [8, 15, 4, 10],
    [8, 15, 12, 10],
  ];
  for (const [x0, y0, x1, y1] of leaves) c.line(x0, y0, x1, y1, 'C');
  for (const [, , x1, y1] of leaves) {
    c.rect(x1 - 1, y1, 3, 2, 't');
    c.set(x1, y1, 'C');
  }
  box3d(c, 4, 15, 8, 9, 2, { top: 'b', front: 'e', hi: 'f' });
  return c;
}

// --------------------------------------------------------------- exhibits --
function pedestal(engine, frame) {
  const [dark, mid, light] = ENGINE_TINTS[engine];
  const c = new Canvas(32, 32);
  box3d(c, 4, 18, 24, 14, 4, { top: 'M', front: 'm', hi: 'g' });
  c.hline(5, 26, 22, 'y');
  c.rect(12, 28, 8, 2, 'y');
  c.rect(14, 14, 4, 5, 'D');
  c.vline(14, 14, 5, 'M');
  // Display frame.
  c.rect(5, 1, 22, 15, 'y');
  c.frame(5, 1, 22, 15, 'k');
  c.hline(6, 2, 20, 'Y');
  c.rect(7, 3, 18, 11, dark);
  // "Thumbnail": horizon, sun and terrain in the wing colour.
  c.hline(7, 10, 18, mid);
  c.rect(7, 11, 18, 3, mid);
  disc(c, 19, 7, 2, light);
  c.line(8, 10, 12, 6, light);
  c.line(12, 6, 15, 10, light);
  for (let y = 3 + frame; y < 14; y += 2) c.hline(7, y, 18, [14, 11, 12, 60]);
  if (frame === 1) {
    c.set(23, 4, 'W');
    c.set(22, 4, 'w');
  }
  return c;
}

function marker(frame) {
  const c = new Canvas(7, 5);
  c.ascii(
    0,
    0,
    ['kkkkkkk', 'kYYYYyk', '.kYYyk.', '..kyk..', '...k...'],
    frame === 0 ? {} : { Y: 'y', y: 'o' },
  );
  return c;
}

// -------------------------------------------------------------- bedroom ----
function deskPc(frame) {
  const c = new Canvas(32, 24);
  box3d(c, 0, 10, 32, 14, 4, { top: 'n', front: 'B', hi: 'N' });
  c.frame(19, 16, 11, 5, 'b');
  c.set(24, 18, 'y');
  // Monitor.
  c.rect(8, 0, 16, 11, 'D');
  c.frame(8, 0, 16, 11, 'k');
  c.rect(10, 2, 12, 7, 'a');
  c.hline(11, 3, 6, 'A');
  c.hline(12, 5, 8, 't');
  c.hline(12, 7, 4, 'A');
  if (frame === 0) c.rect(17, 7, 2, 1, 'W');
  c.rect(15, 11, 2, 2, 'm');
  // Keyboard.
  c.rect(10, 12, 12, 2, 'm');
  for (let x = 11; x < 21; x += 2) c.set(x, 12, 'G');
  // Mug and a pizza slice.
  c.rect(26, 9, 3, 4, 'w');
  c.hline(26, 10, 3, 'e');
  c.set(29, 10, 'w');
  c.ascii(2, 10, ['nnnn', 'kYeY', '.kY.', '.k..']);
  return c;
}

function bed() {
  const c = new Canvas(24, 32);
  box3d(c, 0, 4, 24, 28, 3, { top: 'B', front: 'b', hi: 'n' });
  c.rect(0, 0, 24, 7, 'B');
  c.hline(1, 1, 22, 'n');
  c.frame(0, 0, 24, 7, 'k');
  c.rect(2, 7, 20, 22, 'w');
  c.rect(4, 8, 16, 5, 'W');
  c.frame(4, 8, 16, 5, 'l');
  c.rect(2, 14, 20, 15, 'e');
  c.hline(2, 14, 20, 'f');
  for (let y = 17; y < 29; y += 4) c.hline(2, y, 20, 'R');
  for (let x = 6; x < 22; x += 5) c.vline(x, 15, 14, 'R');
  c.hline(2, 29, 20, 'b');
  c.frame(0, 0, 24, 32, 'k');
  return c;
}

function bookshelf() {
  const c = new Canvas(32, 32);
  const rand = rng(77);
  c.rect(0, 0, 32, 32, 'b');
  c.rect(0, 0, 32, 3, 'B');
  c.hline(1, 1, 30, 'n');
  for (const y of [3, 12, 21]) {
    let x = 2;
    while (x < 29) {
      const bw = 2 + Math.floor(rand() * 2);
      const bh = 5 + Math.floor(rand() * 3);
      if (rand() < 0.15) {
        // Cartridge-shaped game boxes lying flat.
        c.rect(x, y + 8 - 2, 4, 2, 'g');
        c.hline(x, y + 8 - 2, 4, 'G');
        x += 5;
        continue;
      }
      const col = ['e', 'R', 'C', 'S', 'y', 'w', 't', 'n'][Math.floor(rand() * 8)];
      c.rect(x, y + 8 - bh, bw, bh, col);
      c.vline(x + bw, y + 8 - bh, bh, 'k');
      x += bw + 1;
    }
    c.rect(1, y + 8, 30, 1, 'B');
  }
  c.frame(0, 0, 32, 32, 'k');
  return c;
}

function pizzaBoxes() {
  const c = new Canvas(16, 16);
  box3d(c, 1, 10, 14, 6, 3, { top: 'N', front: 'n', hi: 'Y' });
  box3d(c, 2, 6, 14, 6, 3, { top: 'N', front: 'n', hi: 'Y' });
  box3d(c, 0, 2, 14, 6, 3, { top: 'N', front: 'n', hi: 'Y' });
  c.rect(5, 3, 3, 2, 'e');
  c.set(6, 3, 'f');
  return c;
}

function jetStand() {
  const c = new Canvas(16, 16);
  box3d(c, 1, 10, 14, 6, 3, { top: 'n', front: 'B', hi: 'N' });
  c.vline(7, 9, 2, 'g');
  c.ascii(0, 0, [
    '................',
    '.......kk.......',
    '......kllk......',
    '...kkkGllGkkk...',
    '..kGGGllllGGGk..',
    '...kkkGllGkkk...',
    '......kllk......',
    '.....keGGek.....',
    '......kkkk......',
  ]);
  return c;
}

function boardedWindow() {
  const c = new Canvas(16, 16);
  c.rect(1, 1, 14, 13, 'B');
  c.rect(3, 3, 10, 9, 'c');
  c.line(4, 4, 6, 4, 'C');
  c.frame(1, 1, 14, 13, 'k');
  for (const [y, tilt] of [
    [3, 0],
    [7, 1],
    [10, 0],
  ]) {
    c.line(0, y + tilt, 15, y, 'n');
    c.line(0, y + 1 + tilt, 15, y + 1, 'N');
    c.set(2, y + tilt, 'g');
    c.set(13, y, 'g');
  }
  return c;
}

function roundTable(c) {
  c.rect(3, 8, 10, 4, 'n');
  c.hline(4, 7, 8, 'n');
  c.hline(4, 8, 8, 'N');
  c.rect(3, 12, 10, 2, 'B');
  c.rect(7, 14, 2, 2, 'b');
  c.hline(4, 14, 8, 'k');
}

function d20Table() {
  const c = new Canvas(16, 16);
  roundTable(c);
  c.ascii(4, 1, [
    '..kkkk..',
    '.kfEEEk.',
    'kfffEEEk',
    'kfEwEEek',
    'kEEEEeek',
    'kEEEeeek',
    '.keeeek.',
    '..kkkk..',
  ]);
  return c;
}

function sweetroll() {
  const c = new Canvas(16, 16);
  roundTable(c);
  c.rect(3, 6, 10, 3, 'l');
  c.hline(4, 5, 8, 'w');
  c.rect(5, 2, 6, 5, 'n');
  c.hline(5, 6, 6, 'B');
  c.rect(6, 1, 4, 2, 'W');
  c.set(5, 3, 'W');
  c.set(10, 3, 'w');
  c.set(7, 4, 'N');
  return c;
}

function lamp() {
  const c = new Canvas(16, 24);
  c.ascii(3, 0, ['...kkkk...', '..kYYYYk..', '.kYYYYYYk.', 'kyyyyyyyyk', 'kkkkkkkkkk']);
  c.vline(7, 5, 15, 'g');
  c.vline(8, 5, 15, 'm');
  c.rect(4, 20, 8, 3, 'm');
  c.hline(4, 20, 8, 'M');
  c.hline(4, 23, 8, 'k');
  return c;
}

// ------------------------------------------------------------- workshop ----
function workbench(frame) {
  const c = new Canvas(32, 24);
  box3d(c, 0, 8, 32, 16, 5, { top: 'n', front: 'B', hi: 'N' });
  c.frame(3, 15, 12, 6, 'b');
  c.frame(17, 15, 12, 6, 'b');
  c.set(9, 17, 'y');
  c.set(23, 17, 'y');
  // Soldering station + iron.
  box3d(c, 2, 4, 8, 7, 2, { top: 'M', front: 'D' });
  c.set(4, 8, frame === 0 ? 'E' : 'r');
  c.set(7, 8, 'y');
  c.line(11, 3, 14, 9, 'l');
  c.set(14, 10, 'G');
  // Circuit board with traces, a chip and a blinking LED.
  c.rect(16, 8, 12, 5, 'C');
  c.hline(17, 9, 6, 'y');
  c.vline(22, 9, 3, 'y');
  c.rect(24, 9, 3, 2, 'k');
  c.set(18, 11, frame === 0 ? 'E' : 'R');
  c.frame(16, 8, 12, 5, 'k');
  // Solder spool.
  disc(c, 29, 6, 1, 'G');
  return c;
}

function oscilloscope(frame) {
  const c = new Canvas(16, 16);
  box3d(c, 1, 3, 14, 13, 3, { top: 'S', front: 's', hi: 'v' });
  c.rect(3, 7, 8, 7, 'a');
  for (let x = 0; x < 8; x++) {
    const y = Math.round(10 + 2 * Math.sin((x + frame * 2) * 0.8));
    c.set(3 + x, y, 'A');
  }
  c.set(12, 8, 'l');
  c.set(12, 11, 'y');
  c.set(13, 13, frame % 2 === 0 ? 'E' : 'r');
  return c;
}

function crate() {
  const c = new Canvas(16, 16);
  box3d(c, 0, 2, 16, 14, 4, { top: 'n', front: 'B', hi: 'N' });
  c.hline(1, 10, 14, 'b');
  c.line(1, 7, 14, 14, 'b');
  c.set(2, 8, 'g');
  c.set(13, 8, 'g');
  c.set(2, 13, 'g');
  c.set(13, 13, 'g');
  return c;
}

function grate(open) {
  const c = new Canvas(16, 16);
  c.rect(1, 2, 14, 12, 'k');
  c.frame(1, 2, 14, 12, 'g');
  if (!open) {
    for (let x = 3; x < 14; x += 3) c.vline(x, 3, 10, 'G');
    c.hline(2, 3, 12, 'l');
    c.set(13, 12, 'm');
  } else {
    for (let y = 5; y < 13; y += 3) c.hline(5, y, 6, 'D');
    c.vline(4, 4, 9, 'm');
    c.vline(11, 4, 9, 'm');
    // The grate cover slid aside.
    c.rect(11, 12, 5, 4, 'g');
    c.vline(12, 12, 4, 'G');
    c.vline(14, 12, 4, 'G');
  }
  return c;
}

function storageDoor() {
  const c = new Canvas(16, 32);
  c.rect(0, 0, 16, 32, 'b');
  c.rect(2, 2, 12, 28, 'B');
  c.frame(4, 4, 8, 9, 'b');
  c.frame(4, 16, 8, 10, 'b');
  c.set(11, 17, 'y');
  c.rect(5, 6, 3, 2, 'e');
  c.rect(2, 30, 12, 2, 'k');
  c.frame(0, 0, 16, 32, 'k');
  return c;
}

function lockers() {
  const c = new Canvas(16, 32);
  box3d(c, 0, 2, 16, 30, 3, { top: 'v', front: 'S', hi: 'w' });
  c.vline(8, 5, 26, 'K');
  for (const x of [2, 10]) for (let y = 8; y < 13; y += 2) c.hline(x, y, 4, 'K');
  c.vline(6, 16, 3, 'l');
  c.vline(10, 16, 3, 'l');
  c.hline(1, 30, 14, 'K');
  return c;
}

function noticeBoard() {
  const c = new Canvas(32, 24);
  c.rect(0, 0, 32, 24, 'b');
  c.rect(2, 2, 28, 20, 'n');
  const rand = rng(31);
  for (let i = 0; i < 40; i++)
    c.set(2 + Math.floor(rand() * 28), 2 + Math.floor(rand() * 20), rand() < 0.5 ? 'N' : 'B');
  // Pinned sheets: a skill list, a schematic and a sticky note.
  c.rect(4, 4, 9, 11, 'w');
  for (let y = 6; y < 14; y += 2) c.hline(5, y, 5 + (y % 3), 'g');
  c.set(8, 4, 'e');
  c.rect(15, 5, 10, 8, 'W');
  c.line(16, 7, 19, 7, 'C');
  c.line(19, 7, 19, 11, 'C');
  c.line(19, 11, 23, 11, 'C');
  c.rect(21, 6, 2, 2, 'k');
  c.set(20, 5, 'y');
  c.rect(24, 14, 5, 5, 'Y');
  c.hline(25, 16, 3, 'o');
  c.set(26, 14, 'e');
  c.rect(6, 17, 8, 3, 'w');
  c.frame(0, 0, 32, 24, 'k');
  return c;
}

function phoneTable() {
  const c = new Canvas(16, 24);
  box3d(c, 1, 12, 14, 12, 4, { top: 'n', front: 'B', hi: 'N' });
  c.ascii(3, 3, [
    '.kkkkkkkk.',
    'kEEEEEEEEk',
    'kfkkkkkkfk',
    '.keeeeeek.',
    'keewwwweek',
    'keewkkweek',
    'keewwwweek',
    'keeeeeeeek',
    '.kkkkkkkk.',
  ]);
  c.line(12, 9, 14, 12, 'k');
  return c;
}

function filingCabinet() {
  const c = new Canvas(16, 24);
  box3d(c, 1, 1, 14, 23, 3, { top: 'v', front: 'S', hi: 'w' });
  for (const y of [6, 12, 18]) {
    c.frame(3, y, 10, 5, 'K');
    c.hline(6, y + 2, 4, 'l');
    c.rect(4, y + 1, 2, 1, 'w');
  }
  c.rect(4, 0, 7, 3, 'Y');
  c.hline(5, 1, 4, 'y');
  return c;
}

// ------------------------------------------------------- wings and boss ----
function candelabra(frame) {
  const c = new Canvas(16, 32);
  c.rect(5, 28, 6, 3, 'y');
  c.hline(5, 28, 6, 'Y');
  c.hline(4, 31, 8, 'k');
  c.rect(7, 11, 2, 17, 'y');
  c.vline(7, 11, 17, 'Y');
  c.hline(2, 11, 12, 'y');
  for (const x of [2, 7, 12]) {
    c.rect(x, 9, 2, 2, 'y');
    c.rect(x, 5, 2, 4, 'w');
    const tall = (x + frame * 3) % 2 === 0;
    c.set(x + (frame === 0 ? 0 : 1), tall ? 2 : 3, 'Y');
    c.set(x, 4, 'o');
    c.set(x + 1, 4, 'Y');
    c.set(x + (frame === 0 ? 1 : 0), 3, tall ? 'Y' : 'o');
  }
  return c;
}

function banner() {
  const c = new Canvas(16, 32);
  c.hline(0, 0, 16, 'y');
  c.hline(0, 1, 16, 'k');
  c.rect(2, 2, 12, 24, 'e');
  c.vline(2, 2, 24, 'R');
  c.vline(13, 2, 24, 'R');
  c.vline(3, 2, 24, 'y');
  c.vline(12, 2, 24, 'y');
  // Swallowtail.
  for (let i = 0; i < 4; i++) {
    c.hline(2, 26 + i, 6 - i * 2 > 0 ? 6 - i : 1, 'e');
    c.hline(8 + i, 26 + i, 6 - i, 'e');
  }
  c.ascii(5, 11, ['..yy..', '.yYYy.', 'yYeeYy', 'yYeeYy', '.yYYy.', '..yy..']);
  return c;
}

function nodeSculpture() {
  const c = new Canvas(16, 32);
  box3d(c, 2, 22, 12, 10, 3, { top: 'M', front: 'm', hi: 'g' });
  c.line(8, 6, 8, 22, 'g');
  c.line(8, 6, 4, 14, 't');
  c.line(8, 6, 12, 14, 't');
  c.line(4, 14, 12, 14, 'C');
  for (const [x, y, r] of [
    [8, 5, 3],
    [4, 14, 2],
    [12, 14, 2],
  ]) {
    disc(c, x, y, r + 1, 'k');
    disc(c, x, y, r, 'C');
    c.set(x - 1, y - 1, 't');
  }
  return c;
}

function cubeStack() {
  const c = new Canvas(16, 24);
  box3d(c, 0, 14, 8, 10, 3, { top: 'v', front: 'S', hi: 'w' });
  box3d(c, 8, 14, 8, 10, 3, { top: 'v', front: 's', hi: 'S' });
  box3d(c, 4, 5, 8, 10, 3, { top: 'v', front: 'S', hi: 'w' });
  c.frame(2, 17, 4, 4, 'v');
  c.frame(10, 17, 4, 4, 'S');
  c.frame(6, 8, 4, 4, 'v');
  return c;
}

/** An original bipedal tank statue: the dormant "boss" of the Boss Room. */
function mech() {
  const c = new Canvas(48, 48);
  // Plinth.
  box3d(c, 4, 40, 40, 8, 3, { top: 'M', front: 'm', hi: 'g' });
  // Legs: reverse-jointed, thick, ink-outlined.
  for (const ox of [0, 20]) {
    c.rect(12 + ox, 22, 5, 9, 'k');
    c.rect(13 + ox, 23, 3, 8, 'g');
    c.rect(9 + ox, 30, 5, 4, 'k');
    c.rect(10 + ox, 31, 3, 2, 'G');
    c.rect(11 + ox, 33, 4, 6, 'k');
    c.rect(12 + ox, 34, 2, 5, 'm');
    c.rect(8 + ox, 38, 11, 3, 'k');
    c.rect(9 + ox, 38, 9, 2, 'M');
  }
  // Hull.
  c.rect(8, 9, 32, 15, 'k');
  c.rect(9, 10, 30, 13, 'm');
  c.rect(9, 10, 30, 4, 'M');
  c.hline(10, 10, 28, 'G');
  c.hline(9, 18, 30, 'D');
  c.vline(16, 14, 9, 'D');
  c.vline(31, 14, 9, 'D');
  // Cockpit slit with a single dormant red eye.
  c.rect(18, 15, 12, 3, 'k');
  c.hline(19, 16, 10, 'r');
  c.rect(23, 16, 2, 1, 'E');
  // Back missile pod.
  c.rect(1, 11, 9, 11, 'k');
  c.rect(2, 12, 7, 9, 'D');
  for (let y = 13; y < 20; y += 3) for (let x = 3; x < 8; x += 3) c.rect(x, y, 2, 2, 'k');
  // Long cannon over the shoulder.
  c.rect(30, 5, 18, 5, 'k');
  c.rect(31, 6, 16, 3, 'g');
  c.hline(31, 6, 16, 'G');
  c.rect(30, 9, 5, 2, 'k');
  // Antenna.
  c.vline(14, 3, 6, 'g');
  c.set(14, 2, 'E');
  return c;
}

function easel() {
  const c = new Canvas(16, 32);
  c.line(8, 3, 2, 31, 'B');
  c.line(8, 3, 13, 31, 'B');
  c.line(8, 6, 8, 30, 'b');
  c.rect(1, 5, 14, 15, 'B');
  c.rect(2, 6, 12, 13, 'w');
  c.rect(2, 6, 12, 7, 'l');
  c.hline(2, 13, 12, 'G');
  c.rect(7, 8, 2, 8, 'K');
  c.set(7, 8, 'm');
  drawDigits(c, 4, 7, '33', 'e');
  c.rect(2, 16, 12, 3, 'g');
  c.frame(1, 5, 14, 15, 'k');
  c.rect(1, 20, 14, 2, 'n');
  c.set(4, 20, 'e');
  c.set(7, 20, 'y');
  c.set(10, 20, 'C');
  return c;
}

function memorial() {
  const c = new Canvas(16, 24);
  c.rect(3, 3, 10, 15, 'g');
  c.hline(4, 2, 8, 'g');
  c.hline(5, 1, 6, 'g');
  c.vline(12, 3, 15, 'm');
  c.hline(5, 1, 6, 'k');
  c.set(4, 2, 'k');
  c.set(11, 2, 'k');
  c.vline(2, 3, 15, 'k');
  c.vline(13, 3, 15, 'k');
  for (const y of [4, 6]) c.hline(5, y, 6, 'm');
  // Wreath.
  for (let a = 0; a < 16; a++) {
    const x = Math.round(8 + 3 * Math.cos((a / 16) * Math.PI * 2));
    const y = Math.round(12 + 3 * Math.sin((a / 16) * Math.PI * 2));
    c.set(x, y, a % 3 === 0 ? 't' : 'C');
  }
  c.set(7, 15, 'e');
  c.set(9, 15, 'e');
  c.set(8, 16, 'E');
  box3d(c, 1, 18, 14, 6, 2, { top: 'M', front: 'm', hi: 'g' });
  return c;
}

function floorMessage(frame) {
  const c = new Canvas(16, 16);
  const glow = [184, 100, 47, 70];
  const strokes = [
    [2, 6, 5, 4],
    [5, 4, 7, 7],
    [7, 7, 10, 5],
    [10, 5, 13, 7],
    [3, 10, 6, 9],
    [6, 9, 9, 11],
    [9, 11, 12, 9],
  ];
  for (const [x0, y0, x1, y1] of strokes) c.line(x0, y0 + 1, x1, y1 + 1, glow);
  for (const [x0, y0, x1, y1] of strokes) c.line(x0, y0, x1, y1, 'o');
  for (const [x, y] of frame === 0
    ? [
        [5, 4],
        [10, 5],
        [9, 11],
      ]
    : [
        [7, 7],
        [3, 10],
        [13, 7],
      ])
    c.set(x, y, 'Y');
  return c;
}

// ------------------------------------------------------------ secret room --
function codecTerminal(frame) {
  const c = new Canvas(48, 32);
  box3d(c, 0, 16, 48, 16, 5, { top: 'D', front: 'm', hi: 'M' });
  for (let x = 4; x < 44; x += 5) c.set(x, 18, ['E', 'y', 'A', 'w'][(x + frame) % 4]);
  c.frame(4, 23, 40, 6, 'D');
  // Centre display: frequency readout.
  c.rect(11, 1, 26, 15, 'S');
  c.frame(11, 1, 26, 15, 'k');
  c.rect(13, 3, 22, 11, 'a');
  drawDigits(c, 14, 4, '140.85', 'A');
  for (let i = 0; i < 9; i++) {
    const h = 1 + ((i * 7 + frame * 3) % 4);
    c.rect(15 + i * 2, 13 - h, 1, h, 't');
  }
  // Side screens with two portrait silhouettes.
  for (const [x, flip] of [
    [1, false],
    [37, true],
  ]) {
    c.rect(x, 4, 10, 12, 'S');
    c.frame(x, 4, 10, 12, 'k');
    c.rect(x + 1, 5, 8, 10, 'a');
    const head = flip ? x + 4 : x + 3;
    c.rect(head, 7, 3, 3, frame === 0 ? 'A' : 't');
    c.rect(x + 2, 11, 6, 4, frame === 0 ? 't' : 'A');
  }
  return c;
}

function ladder() {
  const c = new Canvas(16, 32);
  c.vline(3, 0, 32, 'G');
  c.vline(4, 0, 32, 'g');
  c.vline(11, 0, 32, 'G');
  c.vline(12, 0, 32, 'g');
  for (let y = 3; y < 32; y += 5) {
    c.hline(5, y, 6, 'G');
    c.hline(5, y + 1, 6, 'm');
  }
  return c;
}

function alert() {
  const c = new Canvas(16, 16);
  c.ascii(0, 0, [
    '......kkkk......',
    '.....kEfEEk.....',
    '.....kEfEEk.....',
    '.....kEEEEk.....',
    '.....kEEEEk.....',
    '......kEEk......',
    '......kEEk......',
    '......kEEk......',
    '......kEek......',
    '.......kk.......',
    '................',
    '......kkkk......',
    '.....kEfEEk.....',
    '.....kEEeEk.....',
    '......kkkk......',
  ]);
  return c;
}

// ---------------------------------------------------------------- signage --
function plaque(text) {
  const w = textWidth(text) + 8;
  const c = new Canvas(w, 13);
  c.rect(0, 0, w, 13, 'r');
  c.frame(1, 1, w - 2, 11, 'y');
  c.frame(0, 0, w, 13, 'k');
  drawText(c, 4, 3, text, 'Y');
  return c;
}

function signpost(text) {
  const p = plaque(text);
  const c = new Canvas(p.w, 22);
  c.rect(Math.floor(p.w / 2) - 1, 12, 3, 10, 'b');
  c.vline(Math.floor(p.w / 2) - 1, 12, 10, 'B');
  c.hline(Math.floor(p.w / 2) - 2, 21, 5, 'k');
  c.blit(p, 0, 0);
  return c;
}

export function buildProps() {
  const frames = [];
  const add = (name, canvas) => frames.push({ name, canvas });
  const anim = (name, count, fn) => {
    for (let i = 0; i < count; i++) add(`${name}_${i}`, fn(i));
  };

  for (const v of ['red', 'slate', 'teal']) anim(`cabinet_${v}`, 2, (f) => cabinet(v, f));
  anim('bonfire', 3, bonfire);
  anim('marquee', 2, marquee);
  add('couch', couch());
  add('plant', plant());
  for (const engine of Object.keys(ENGINE_TINTS))
    anim(`pedestal_${engine}`, 2, (f) => pedestal(engine, f));
  anim('marker', 2, marker);
  anim('desk_pc', 2, deskPc);
  add('bed', bed());
  add('bookshelf', bookshelf());
  add('pizza_boxes', pizzaBoxes());
  add('jet_stand', jetStand());
  add('window_boarded', boardedWindow());
  add('d20_table', d20Table());
  add('sweetroll', sweetroll());
  add('lamp', lamp());
  anim('workbench', 2, workbench);
  anim('oscilloscope', 4, oscilloscope);
  add('crate', crate());
  add('grate_closed', grate(false));
  add('grate_open', grate(true));
  add('storage_door', storageDoor());
  add('lockers', lockers());
  add('notice_board', noticeBoard());
  add('phone_table', phoneTable());
  add('filing_cabinet', filingCabinet());
  anim('candelabra', 2, candelabra);
  add('banner', banner());
  add('node_sculpture', nodeSculpture());
  add('cube_stack', cubeStack());
  add('mech', mech());
  add('easel', easel());
  add('memorial', memorial());
  anim('floor_message', 2, floorMessage);
  anim('codec_terminal', 2, codecTerminal);
  add('cardboard_box', buildCardboardBox(0));
  add('ladder', ladder());
  add('alert', alert());
  add('sign_godot', plaque('GODOT'));
  add('sign_unity', plaque('UNITY'));
  add('sign_unreal', plaque('UNREAL'));
  add('sign_boss', plaque('BOSS ROOM'));
  add('signpost_bedroom', signpost('< DEV ROOM'));
  add('signpost_workshop', signpost('WORKSHOP >'));
  return frames;
}
