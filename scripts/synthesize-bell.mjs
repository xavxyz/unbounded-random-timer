// Synthesises each phase's sound into assets/: high sine partials, each with
// its own fast exponential decay, a near-instant strike, and short, quiet
// echoes. Replace a .wav with any recording to change that phase's sound.
//   assets/bell.wav   White: the soft bell, one high strike (D6).
//   assets/black.wav  Black: an octave lower (D5), struck twice, so it is
//                     told apart from the bell with eyes closed.
// Run: node scripts/synthesize-bell.mjs
import { writeFileSync } from 'node:fs';

const SAMPLE_RATE = 44100;
const PEAK = 0.7;
const ATTACK_S = 0.002; // near-instant strike, without a click
const FADE_OUT_S = 0.05; // taper the end to exact silence

// [frequency ratio, amplitude, decay time constant in seconds]
const PARTIALS = [
  [1, 1, 0.35],
  [2.01, 0.55, 0.22],
  [2.76, 0.4, 0.16],
  [4.07, 0.25, 0.1],
  [5.4, 0.15, 0.06],
];

const SOUNDS = [
  {
    file: 'bell.wav',
    durationS: 1.2,
    fundamentalHz: 1175, // D6: high enough to cut through a room
    decayScale: 1,
    // [delay in seconds, gain]: the strike and one short, quiet echo
    strikes: [
      [0, 1],
      [0.16, 0.25],
    ],
  },
  {
    file: 'black.wav',
    durationS: 1.6,
    fundamentalHz: 587, // D5: an octave below the bell, still clear on a phone speaker
    decayScale: 1.4, // a lower bell rings a little longer
    strikes: [
      [0, 1],
      [0.32, 0.85], // the second strike, a beat after the first
      [0.48, 0.2], // its echo
    ],
  },
];

function strike(t, { fundamentalHz, decayScale }) {
  if (t < 0) return 0;
  const attack = Math.min(1, t / ATTACK_S);
  let v = 0;
  for (const [ratio, amp, tau] of PARTIALS) {
    v += amp * Math.exp(-t / (tau * decayScale)) * Math.sin(2 * Math.PI * fundamentalHz * ratio * t);
  }
  return v * attack;
}

function synthesize(sound) {
  const n = Math.floor(SAMPLE_RATE * sound.durationS);
  const samples = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const fadeOut = Math.min(1, (sound.durationS - t) / FADE_OUT_S);
    let v = 0;
    for (const [delay, gain] of sound.strikes) v += gain * strike(t - delay, sound);
    samples[i] = v * fadeOut;
  }
  return samples;
}

function toWav(samples) {
  const n = samples.length;
  const max = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const pcm = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    pcm.writeInt16LE(Math.round((samples[i] / max) * PEAK * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

for (const sound of SOUNDS) {
  const out = new URL(`../assets/${sound.file}`, import.meta.url);
  writeFileSync(out, toWav(synthesize(sound)));
  console.log(`wrote ${out.pathname}`);
}
