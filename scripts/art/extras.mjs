/**
 * Non-atlas images: codec portraits (DOM), sample project media (clearly
 * labelled placeholders) and the pixel favicon (emitted as SVG).
 */
import { Canvas, PALETTE, box3d, drawText, textWidth } from '../lib/pixel.mjs';

/** Luminance thresholds -> green phosphor ramp. */
const PHOSPHOR_RAMP = [
  [0.12, 'k'],
  [0.25, 'a'],
  [0.38, 'c'],
  [0.56, 't'],
  [0.78, 'A'],
  [Infinity, 'w'],
];

function luminance(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}

/** Converts a full-colour drawing into the green "codec" phosphor ramp. */
function phosphor(c) {
  c.recolor((key) => {
    const l = luminance(PALETTE[key]) / 255;
    return PHOSPHOR_RAMP.find(([max]) => l < max)[1];
  });
  for (let y = 1; y < c.h; y += 2) c.hline(0, y, c.w, [14, 11, 12, 70]);
  return c;
}

function ellipse(c, cx, cy, rx, ry, color) {
  for (let y = -ry; y <= ry; y++)
    for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.05) c.set(cx + x, cy + y, color);
}

function portraitDavid() {
  const c = new Canvas(32, 40);
  c.rect(0, 0, 32, 40, 'm');
  // Hoodie shoulders.
  ellipse(c, 16, 39, 15, 9, 'e');
  ellipse(c, 16, 38, 12, 6, 'E');
  c.vline(13, 32, 8, 'w');
  c.vline(18, 32, 8, 'w');
  // Neck and face.
  c.rect(13, 25, 6, 6, 'h');
  ellipse(c, 16, 18, 8, 10, 'H');
  ellipse(c, 19, 21, 4, 5, 'H');
  c.vline(8, 16, 6, 'h');
  // Hair: messy dark fringe.
  ellipse(c, 16, 11, 9, 6, 'K');
  for (const x of [9, 12, 15, 18, 21]) c.vline(x, 12, 3 + (x % 2), 'K');
  c.hline(12, 8, 6, 'm');
  // Eyes, brows, mouth.
  c.rect(12, 18, 2, 2, 'k');
  c.rect(19, 18, 2, 2, 'k');
  c.hline(11, 16, 3, 'K');
  c.hline(18, 16, 4, 'K');
  c.hline(14, 24, 5, 'h');
  c.set(19, 23, 'h');
  return phosphor(c);
}

function portraitControl() {
  const c = new Canvas(32, 40);
  c.rect(0, 0, 32, 40, 'm');
  // Dark jacket with a collar.
  ellipse(c, 16, 39, 15, 9, 'S');
  c.line(10, 31, 16, 38, 'w');
  c.line(22, 31, 16, 38, 'w');
  c.rect(13, 25, 6, 6, 'h');
  ellipse(c, 16, 18, 8, 10, 'H');
  // Grey swept-back hair.
  ellipse(c, 16, 10, 9, 5, 'l');
  c.hline(9, 12, 14, 'l');
  c.vline(8, 11, 6, 'l');
  c.vline(24, 11, 6, 'l');
  // Glasses and a headset boom.
  c.frame(10, 17, 5, 4, 'k');
  c.frame(17, 17, 5, 4, 'k');
  c.hline(15, 18, 2, 'k');
  c.rect(6, 15, 3, 7, 'k');
  c.line(8, 21, 13, 25, 'k');
  c.hline(13, 25, 6, 'h');
  c.hline(14, 26, 4, 'K');
  return phosphor(c);
}

function sampleMedia(engine) {
  const c = new Canvas(160, 90);
  const tint = { godot: ['c', 'C', 't'], unity: ['s', 'S', 'v'], unreal: ['K', 'e', 'E'] }[engine];
  c.rect(0, 0, 160, 90, tint[0]);
  // A simple scene so the media slot visibly works.
  c.rect(0, 58, 160, 32, tint[1]);
  for (let x = 0; x < 160; x += 8) c.vline(x, 58, 32, tint[0]);
  for (let i = 0; i < 6; i++)
    box3d(c, 12 + i * 24, 34 + (i % 2) * 8, 14, 24 - (i % 2) * 8, 4, {
      top: tint[2],
      front: tint[1],
    });
  ellipse(c, 128, 20, 9, 9, tint[2]);
  // Big "SAMPLE" banner so nobody mistakes it for real work.
  const label = 'SAMPLE MEDIA';
  const sub = 'REPLACE WITH YOUR WORK';
  const w = textWidth(sub) + 12;
  const x = Math.floor((160 - w) / 2);
  c.rect(x, 30, w, 26, 'k');
  c.frame(x + 1, 31, w - 2, 24, 'y');
  drawText(c, Math.floor((160 - textWidth(label)) / 2), 35, label, 'Y');
  drawText(c, Math.floor((160 - textWidth(sub)) / 2), 45, sub, 'w');
  return c;
}

function faviconCanvas() {
  const c = new Canvas(16, 16);
  c.rect(3, 0, 10, 16, 'd');
  c.rect(3, 0, 2, 16, 'e');
  c.rect(4, 1, 8, 2, 'Y');
  c.rect(5, 4, 6, 5, 'a');
  c.rect(6, 6, 2, 1, 'A');
  c.set(9, 5, 'E');
  c.rect(3, 10, 10, 2, 'm');
  c.set(6, 10, 'E');
  c.set(9, 11, 'w');
  c.frame(3, 0, 10, 16, 'k');
  return c;
}

/** Converts a canvas into a crisp SVG (one rect per horizontal colour run). */
export function canvasToSvg(c) {
  const parts = [];
  for (let y = 0; y < c.h; y++) {
    let x = 0;
    while (x < c.w) {
      const key = c.getKey(x, y);
      if (!key) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < c.w && c.getKey(x + run, y) === key) run++;
      parts.push(`<rect x="${x}" y="${y}" width="${run}" height="1" fill="${PALETTE[key]}"/>`);
      x += run;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${c.w} ${c.h}" shape-rendering="crispEdges">${parts.join('')}</svg>\n`;
}

export function buildExtras() {
  return {
    portraits: { david: portraitDavid(), control: portraitControl() },
    media: {
      godot: sampleMedia('godot'),
      unity: sampleMedia('unity'),
      unreal: sampleMedia('unreal'),
    },
    favicon: faviconCanvas(),
  };
}
