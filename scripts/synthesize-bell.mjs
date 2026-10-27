// Synthesises each phase's sound into assets/: one singing bowl, struck with a
// soft mallet. Each partial is a sine with its own exponential decay; the
// lowest two come in detuned pairs, so they beat. Designed in the bell-sound
// prototype (branch prototype/bell-sounds). Replace a .wav with any recording
// to change that phase's sound.
//   assets/bell.wav   White: one strike, a long, slow-beating ring.
//   assets/black.wav  Black: struck twice, a shorter, fast-beating ring, so it
//                     is told apart from White with eyes closed.
// Run: node scripts/synthesize-bell.mjs
import { writeFileSync } from 'node:fs';

const SAMPLE_RATE = 48000;
const ATTACK_S = 0.002; // near-instant strike, without a click
const FADE_OUT_S = 0.05; // taper the end to exact silence
const TARGET_LUFS = -13; // both sounds equally loud, as loud as the earlier bells (max momentary)
const PEAK_CEILING_DB = -1;

// A Tibetan bowl's mode ratios (Csound modal table, 180 mm bowl).
// [frequency ratio, detune in Hz, amplitude, decay time constant in seconds]
const BOWL = [
  [1, 0, 1, 0.55],
  [1, 1.4, 0.8, 0.55],
  [2.78, 0, 0.6, 0.32],
  [2.78, 2.2, 0.5, 0.3],
  [5.18, 0, 0.3, 0.16],
  [8.16, 0, 0.15, 0.09],
  [11.66, 0, 0.08, 0.06],
];

const SOUNDS = [
  {
    file: 'bell.wav',
    durationS: 5,
    fundamentalHz: 302,
    decayScale: 3, // rings long
    beatScale: 0.3, // a slow beat, under 1 Hz
    softness: 0.25, // higher partials start quieter: amplitude × ratio^-softness
    // [delay in seconds, gain]
    strikes: [[0, 1]],
  },
  {
    file: 'black.wav',
    durationS: 5,
    fundamentalHz: 329,
    decayScale: 1.8,
    beatScale: 3, // a fast beat, about 4 Hz
    softness: 0.3,
    strikes: [
      [0, 1],
      [0.6, 0.8], // the second strike, a slow beat after the first
    ],
  },
];

function synthesize(sound) {
  const n = Math.floor(SAMPLE_RATE * sound.durationS);
  const partials = BOWL.map(([ratio, detune, amp, tau]) => [
    2 * Math.PI * (sound.fundamentalHz * ratio + detune * sound.beatScale),
    amp * ratio ** -sound.softness,
    tau * sound.decayScale,
  ]);
  const samples = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let v = 0;
    for (const [delay, gain] of sound.strikes) {
      const ts = t - delay;
      if (ts < 0) continue;
      let s = 0;
      for (const [w, amp, tau] of partials) s += amp * Math.exp(-ts / tau) * Math.sin(w * ts);
      v += gain * s * Math.min(1, ts / ATTACK_S);
    }
    samples[i] = v * Math.min(1, (sound.durationS - t) / FADE_OUT_S);
  }
  return samples;
}

function biquad(x, b, a) {
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}

// ITU-R BS.1770 K-weighting (48 kHz coefficients), 400 ms windows every 100 ms.
function maxMomentaryLufs(x) {
  const shelf = biquad(x, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]);
  const k = biquad(shelf, [1, -2, 1], [1, -1.99004745483398, 0.99007225036621]);
  const win = 0.4 * SAMPLE_RATE, hop = 0.1 * SAMPLE_RATE;
  let max = -Infinity;
  for (let start = 0; start + win <= k.length; start += hop) {
    let sum = 0;
    for (let i = start; i < start + win; i++) sum += k[i] * k[i];
    max = Math.max(max, -0.691 + 10 * Math.log10(sum / win));
  }
  return max;
}

// Gain to reach the target loudness, lowered if the peak would pass the ceiling.
function normalize(samples) {
  const peak = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const gain = Math.min(10 ** ((TARGET_LUFS - maxMomentaryLufs(samples)) / 20), 10 ** (PEAK_CEILING_DB / 20) / peak);
  return samples.map((v) => v * gain);
}

function toWav(samples) {
  const n = samples.length;
  const pcm = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
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
  writeFileSync(out, toWav(normalize(synthesize(sound))));
  console.log(`wrote ${out.pathname}`);
}
