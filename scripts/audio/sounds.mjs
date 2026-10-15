/**
 * Original sound effects and a 16-second ambient loop (A minor, 60 BPM,
 * Am - Fmaj7 - Dm7 - E). Composed for this project; no samples are used.
 */
import { addNote, echo, fadeEdges, freq, normalize, silence } from './synth.mjs';

function sequence(notes, { step, dur, ...opts }) {
  const buf = silence(notes.length * step + (dur ?? step) + 0.2);
  notes.forEach((n, i) => {
    if (n) addNote(buf, i * step, dur ?? step, freq(n), opts);
  });
  return buf;
}

function mix(...buffers) {
  const len = Math.max(...buffers.map((b) => b.length));
  const out = new Float32Array(len);
  for (const b of buffers) b.forEach((s, i) => (out[i] += s));
  return out;
}

const finish = (buf, peak = 0.7) => fadeEdges(normalize(buf, peak));

export function buildSounds() {
  const sfx = {};

  sfx.ui_open = finish(
    sequence(['E5', 'B5'], {
      step: 0.055,
      type: 'square',
      duty: 0.25,
      vol: 0.3,
      env: { decay: 0.04, sustain: 0.4 },
    }),
    0.5,
  );
  sfx.ui_close = finish(
    sequence(['B5', 'E5'], {
      step: 0.055,
      type: 'square',
      duty: 0.25,
      vol: 0.3,
      env: { decay: 0.04, sustain: 0.4 },
    }),
    0.45,
  );

  const interact = silence(0.12);
  addNote(interact, 0, 0.05, freq('G5'), { type: 'square', duty: 0.125, vol: 0.3, slide: 1.4 });
  sfx.interact = finish(interact, 0.45);

  const tune = silence(0.08);
  addNote(tune, 0, 0.03, freq('C6'), { type: 'square', duty: 0.25, vol: 0.2 });
  addNote(tune, 0, 0.03, 1, { type: 'noise', vol: 0.08, seed: 9, lowpass: 0.5 });
  sfx.tune = finish(tune, 0.35);

  sfx.secret = finish(
    mix(
      sequence(['A4', 'C5', 'E5', 'A5', null, 'E6'], {
        step: 0.075,
        dur: 0.07,
        type: 'square',
        duty: 0.25,
        vol: 0.25,
        env: { decay: 0.05, sustain: 0.5, release: 0.2 },
      }),
      sequence([null, null, null, null, null, 'A5'], {
        step: 0.075,
        dur: 0.35,
        type: 'triangle',
        vol: 0.35,
        env: { release: 0.3 },
      }),
    ),
    0.6,
  );

  const alert = silence(0.45);
  addNote(alert, 0, 0.05, freq('E6'), { type: 'square', duty: 0.5, vol: 0.35 });
  addNote(alert, 0.06, 0.22, freq('B6'), {
    type: 'square',
    duty: 0.5,
    vol: 0.35,
    slide: 0.98,
    env: { sustain: 0.7, release: 0.12 },
  });
  addNote(alert, 0, 0.12, 1, { type: 'noise', vol: 0.18, seed: 3, lowpass: 0.4 });
  sfx.alert = finish(alert, 0.7);

  const ring = silence(1.2);
  for (let i = 0; i < 6; i++)
    addNote(ring, i * 0.09 + (i >= 3 ? 0.35 : 0), 0.07, freq(i % 2 === 0 ? 'C6' : 'G5'), {
      type: 'square',
      duty: 0.25,
      vol: 0.2,
    });
  sfx.codec_ring = finish(ring, 0.55);

  const bonfire = silence(1.1);
  addNote(bonfire, 0, 0.8, 1, {
    type: 'noise',
    vol: 0.3,
    seed: 5,
    lowpass: 0.06,
    env: { attack: 0.35, decay: 0.2, sustain: 0.5, release: 0.3 },
  });
  addNote(bonfire, 0.05, 0.7, freq('A2'), {
    type: 'triangle',
    vol: 0.3,
    slide: 1.5,
    env: { attack: 0.3, release: 0.3 },
  });
  sfx.bonfire = finish(bonfire, 0.6);

  const dice = silence(0.75);
  [0, 0.07, 0.15, 0.25, 0.37, 0.5].forEach((t, i) =>
    addNote(dice, t, 0.02, 1, { type: 'noise', vol: 0.4 - i * 0.04, seed: 11 + i, lowpass: 0.7 }),
  );
  addNote(dice, 0.55, 0.12, freq('E5'), { type: 'triangle', vol: 0.25 });
  sfx.dice = finish(dice, 0.55);

  const vent = silence(0.6);
  addNote(vent, 0, 0.15, 1, { type: 'noise', vol: 0.35, seed: 21, lowpass: 0.3 });
  addNote(vent, 0, 0.3, freq('A3'), { type: 'square', duty: 0.125, vol: 0.18, slide: 0.5 });
  addNote(vent, 0.02, 0.2, freq('E4') * 1.01, {
    type: 'square',
    duty: 0.5,
    vol: 0.08,
    env: { decay: 0.1, sustain: 0.2 },
  });
  sfx.vent = finish(vent, 0.6);

  const box = silence(0.25);
  addNote(box, 0, 0.12, 120, { type: 'triangle', vol: 0.5, slide: 0.5 });
  addNote(box, 0, 0.06, 1, { type: 'noise', vol: 0.2, seed: 33, lowpass: 0.2 });
  sfx.box = finish(box, 0.55);

  const step = silence(0.05);
  addNote(step, 0, 0.018, 1, {
    type: 'noise',
    vol: 0.3,
    seed: 41,
    lowpass: 0.25,
    env: { decay: 0.01, sustain: 0.2, release: 0.01 },
  });
  sfx.step = finish(step, 0.25);

  return { sfx, music: { ambient: buildAmbientLoop() } };
}

function buildAmbientLoop() {
  const bar = 4; // seconds per bar at 60 BPM
  const buf = silence(bar * 4);
  const chords = [
    { bass: 'A2', pad: ['A3', 'C4', 'E4'], arp: ['A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'E5', 'C5'] },
    {
      bass: 'F2',
      pad: ['F3', 'A3', 'C4', 'E4'],
      arp: ['F4', 'A4', 'C5', 'E5', 'C5', 'A4', 'C5', 'A4'],
    },
    {
      bass: 'D2',
      pad: ['D3', 'F3', 'A3', 'C4'],
      arp: ['D4', 'F4', 'A4', 'C5', 'A4', 'F4', 'A4', 'F4'],
    },
    {
      bass: 'E2',
      pad: ['E3', 'G#3', 'B3', 'D4'],
      arp: ['E4', 'G#4', 'B4', 'D5', 'B4', 'G#4', 'B4', 'G#4'],
    },
  ];
  chords.forEach((ch, b) => {
    const t0 = b * bar;
    for (const half of [0, 2])
      addNote(buf, t0 + half, 1.8, freq(ch.bass), {
        type: 'triangle',
        vol: 0.22,
        wrap: true,
        env: { attack: 0.02, decay: 0.4, sustain: 0.6, release: 0.3 },
      });
    ch.pad.forEach((n, i) =>
      addNote(buf, t0, 3.6, freq(n) * (1 + i * 0.002), {
        type: 'triangle',
        vol: 0.05,
        wrap: true,
        env: { attack: 0.8, decay: 0.5, sustain: 0.8, release: 1.2 },
      }),
    );
    ch.arp.forEach((n, i) =>
      addNote(buf, t0 + i * 0.5, 0.3, freq(n), {
        type: 'square',
        duty: 0.25,
        vol: 0.05,
        lowpass: 0.25,
        wrap: true,
        env: { attack: 0.005, decay: 0.15, sustain: 0.15, release: 0.15 },
      }),
    );
    for (const beat of [1, 3])
      addNote(buf, t0 + beat, 0.02, 1, {
        type: 'noise',
        vol: 0.03,
        seed: 50 + b * 4 + beat,
        lowpass: 0.5,
        wrap: true,
      });
  });
  return normalize(echo(buf, 0.75, 0.35, 0.5), 0.6);
}
