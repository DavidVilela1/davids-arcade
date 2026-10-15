/**
 * Tiny offline chiptune synthesiser. Every sound effect and the ambient loop
 * are composed here from square/triangle/noise oscillators and written as
 * 16-bit mono WAV files. All melodies are original.
 */
import { rng } from '../lib/pixel.mjs';

export const SAMPLE_RATE = 22050;

const NOTE_INDEX = {
  C: -9,
  'C#': -8,
  D: -7,
  'D#': -6,
  E: -5,
  F: -4,
  'F#': -3,
  G: -2,
  'G#': -1,
  A: 0,
  'A#': 1,
  B: 2,
};

/** "A4" -> 440 Hz. */
export function freq(note) {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  if (!m) throw new Error(`Bad note ${note}`);
  const semis = NOTE_INDEX[m[1]] + (Number(m[2]) - 4) * 12;
  return 440 * 2 ** (semis / 12);
}

function oscillator(type, phase, duty = 0.5, noise) {
  const p = phase - Math.floor(phase);
  switch (type) {
    case 'square':
      return p < duty ? 1 : -1;
    case 'triangle':
      return 1 - 4 * Math.abs(p - 0.5);
    case 'saw':
      return 2 * p - 1;
    case 'noise':
      return noise() * 2 - 1;
    default:
      throw new Error(`Unknown oscillator ${type}`);
  }
}

function envelope(t, dur, { attack = 0.005, decay = 0.05, sustain = 0.6, release = 0.05 }) {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - ((t - attack) / decay) * (1 - sustain);
  if (t < dur) return sustain;
  if (t < dur + release) return sustain * (1 - (t - dur) / release);
  return 0;
}

/**
 * Adds a note into `buf`. `wrap` makes the tail wrap around (seamless loops).
 * `slide` is a frequency multiplier reached by the end of the note.
 */
export function addNote(buf, start, dur, hz, opts = {}) {
  const {
    type = 'square',
    vol = 0.2,
    duty = 0.5,
    env = {},
    slide = 1,
    wrap = false,
    seed = 1,
    lowpass = 0,
  } = opts;
  const noise = rng(seed);
  const release = env.release ?? 0.05;
  const total = Math.ceil((dur + release) * SAMPLE_RATE);
  const startIdx = Math.round(start * SAMPLE_RATE);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    const f = hz * (1 + (slide - 1) * Math.min(1, t / dur));
    phase += f / SAMPLE_RATE;
    let s = oscillator(type, phase, duty, noise) * envelope(t, dur, env) * vol;
    if (lowpass > 0) {
      lp += lowpass * (s - lp);
      s = lp;
    }
    let idx = startIdx + i;
    if (idx >= buf.length) {
      if (!wrap) break;
      idx %= buf.length;
    }
    buf[idx] += s;
  }
}

export function silence(seconds) {
  return new Float32Array(Math.ceil(seconds * SAMPLE_RATE));
}

/** Circular feedback echo, used on the ambient loop so the tail wraps cleanly. */
export function echo(buf, delaySec, feedback, mix) {
  const d = Math.round(delaySec * SAMPLE_RATE);
  const out = Float32Array.from(buf);
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < out.length; i++) {
      const j = (i - d + out.length) % out.length;
      out[i] += out[j] * feedback * (pass === 0 ? mix : mix * 0.5);
    }
  }
  return out;
}

export function normalize(buf, peak = 0.8) {
  let max = 0;
  for (const s of buf) max = Math.max(max, Math.abs(s));
  if (max === 0) return buf;
  const k = peak / max;
  return buf.map((s) => s * k);
}

/** Short fades at both ends to avoid clicks in one-shot effects. */
export function fadeEdges(buf, ms = 4) {
  const n = Math.min(buf.length / 2, Math.round((ms / 1000) * SAMPLE_RATE));
  for (let i = 0; i < n; i++) {
    buf[i] *= i / n;
    buf[buf.length - 1 - i] *= i / n;
  }
  return buf;
}

export function encodeWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) =>
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), i * 2),
  );
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
