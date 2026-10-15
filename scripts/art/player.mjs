/**
 * The player character: David in a red hoodie. 16x24 frames assembled from an
 * upper body (17 rows) and legs (7 rows) so walk cycles stay consistent.
 *
 * Sheet layout (7 columns x 4 rows):
 *   columns: idle0, idle1, walk0, walk1, walk2, walk3, interact
 *   rows:    down, up, side (faces right; flipped at runtime for left), box
 */
import { Canvas } from '../lib/pixel.mjs';

export const PLAYER_FRAME = { w: 16, h: 24, columns: 7 };

const FRONT = [
  '................',
  '................',
  '.....kkkkkk.....',
  '....kKKKKKKk....',
  '...kKKmmKKKKk...',
  '...kKKKKKKKKk...',
  '...kKHHKKHHKk...',
  '...kHHHHHHHHk...',
  '...kHkHHHHkHk...',
  '...khHHHHHHhk...',
  '....khHHHHhk....',
  '....kEkhhkEk....',
  '..kEEEEwwEEEEk..',
  '..kfEEEwwEEEek..',
  '..kfEkEEEEkEek..',
  '..kHkEEEEEEkHk..',
  '...kkeeeeeekk...',
];
const FRONT_INTERACT = [
  ...FRONT.slice(0, 13),
  '..kfEEEwwEEEek..',
  '..kfEEkHHkEEek..',
  '..kkEEEkkEEEkk..',
  '...kkeeeeeekk...',
];

const BACK = [
  '................',
  '................',
  '.....kkkkkk.....',
  '....kKKKKKKk....',
  '...kKKKKKKKKk...',
  '...kKKmKKKKKk...',
  '...kKKKKKKKKk...',
  '...kKKKKKKKKk...',
  '...kKKKKKKKKk...',
  '...khKKKKKKhk...',
  '....kKKKKKKk....',
  '...kkeEEEEekk...',
  '..kEeEEEEEEeEk..',
  '..kfEEeeeeEEek..',
  '..kfEkEEEEkEek..',
  '..kHkEEEEEEkHk..',
  '...kkeeeeeekk...',
];

const SIDE = [
  '................',
  '................',
  '......kkkkk.....',
  '.....kKKKKKk....',
  '....kKKmKKKKk...',
  '....kKKKKKKKk...',
  '....kKKKKHHHk...',
  '....kKKKHHHHHk..',
  '....kKKhHHHkHk..',
  '....kKKHHHHHHk..',
  '.....kKhHHHhk...',
  '.....kEkhhkk....',
  '....kEEEEEEEk...',
  '....kEEfEEEEk...',
  '....kEEfEEEek...',
  '....kEEkHkEek...',
  '.....keeeeek....',
];
const SIDE_INTERACT = [
  ...SIDE.slice(0, 13),
  '....kEEEEEEHk...',
  '....kEEEEEEEk...',
  '....kEEEEEEek...',
  '.....keeeeek....',
];

const LEGS_FRONT_STAND = [
  '....kDDDDDDk....',
  '....kDmkkmDk....',
  '....kDDkkDDk....',
  '....kDDkkDDk....',
  '...kwwwkkwwwk...',
  '...klllkklllk...',
  '....kkk..kkk....',
];
const LEGS_FRONT_STEP = [
  '....kDDDDDDk....',
  '....kDmkkmDk....',
  '....kDDkkDDk....',
  '....kDDkkwwwk...',
  '...kwwwkklllk...',
  '...klllk.kkk....',
  '....kkk.........',
];
const LEGS_SIDE_STAND = [
  '.....kDDDDk.....',
  '.....kDDDDk.....',
  '.....kDmDDk.....',
  '.....kDDDDk.....',
  '.....kwwwwwk....',
  '.....klllllk....',
  '......kkkkk.....',
];
const LEGS_SIDE_STEP_A = [
  '.....kDDDDk.....',
  '....kDDkkDDk....',
  '...kDDk..kDDk...',
  '...kDk....kDDk..',
  '..kwwwk...kwwwk.',
  '..klllk...klllk.',
  '...kkk.....kkk..',
];
const LEGS_SIDE_STEP_B = [
  '.....kDDDDk.....',
  '.....kDDDDk.....',
  '....kDDkDDk.....',
  '....kDk.kDDk....',
  '...kwwwkkwwwk...',
  '...klllkklllk...',
  '....kkk..kkk....',
];

const BOX = [
  '................',
  '..kkkkkkkkkkkk..',
  '.knnnnnllnnnnnk.',
  '.kNNNNNllNNNNNk.',
  '.kNNNNNllNNNNNk.',
  '.kNNNNNllNNNNNk.',
  '.kbbbbbbbbbbbbk.',
  '.kBBBBBBBBBBBBk.',
  '.kBBBBkkkkBBBBk.',
  '.kBBBBBBBBBBBBk.',
  '.kBBbbbBBBBBBBk.',
  '.kBBbBbBBBBBBBk.',
  '.kBBbbbBBBBBBBk.',
  '.kBBBBBBBBBBBbk.',
  '.kbbbbbbbbbbbbk.',
  '..kkkkkkkkkkkk..',
];

const mirror = (rows) => rows.map((r) => [...r].reverse().join(''));

function compose(upper, legs, bob) {
  const c = new Canvas(16, 24);
  c.ascii(0, 17, legs);
  c.ascii(0, bob, upper);
  return c;
}

export function buildCardboardBox(squash = 0) {
  const c = new Canvas(16, 16);
  c.ascii(0, squash, BOX);
  return c;
}

export function buildPlayerSheet() {
  const { w, h, columns } = PLAYER_FRAME;
  const sheet = new Canvas(w * columns, h * 4);
  const rows = [
    // down
    [
      compose(FRONT, LEGS_FRONT_STAND, 0),
      compose(FRONT, LEGS_FRONT_STAND, 1),
      compose(FRONT, LEGS_FRONT_STEP, 0),
      compose(FRONT, LEGS_FRONT_STAND, 1),
      compose(FRONT, mirror(LEGS_FRONT_STEP), 0),
      compose(FRONT, LEGS_FRONT_STAND, 1),
      compose(FRONT_INTERACT, LEGS_FRONT_STAND, 0),
    ],
    // up
    [
      compose(BACK, LEGS_FRONT_STAND, 0),
      compose(BACK, LEGS_FRONT_STAND, 1),
      compose(BACK, LEGS_FRONT_STEP, 0),
      compose(BACK, LEGS_FRONT_STAND, 1),
      compose(BACK, mirror(LEGS_FRONT_STEP), 0),
      compose(BACK, LEGS_FRONT_STAND, 1),
      compose(BACK, LEGS_FRONT_STAND, 1),
    ],
    // side (right)
    [
      compose(SIDE, LEGS_SIDE_STAND, 0),
      compose(SIDE, LEGS_SIDE_STAND, 1),
      compose(SIDE, LEGS_SIDE_STEP_A, 0),
      compose(SIDE, LEGS_SIDE_STAND, 1),
      compose(SIDE, LEGS_SIDE_STEP_B, 0),
      compose(SIDE, LEGS_SIDE_STAND, 1),
      compose(SIDE_INTERACT, LEGS_SIDE_STAND, 0),
    ],
  ];
  rows.forEach((frames, row) => frames.forEach((f, col) => sheet.blit(f, col * w, row * h)));
  // Cardboard-box disguise row: idle, shuffle A, shuffle B.
  [0, 1, 0].forEach((squash, col) => {
    const box = buildCardboardBox(squash);
    sheet.blit(box, col * w, 3 * h + 8, { flipX: col === 2 });
  });
  return sheet;
}
