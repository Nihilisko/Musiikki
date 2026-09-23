// Pitch detection: finds the frequency of a played string in a piece of microphone sound.
//
// Uses the YIN method (de Cheveigné & Kawahara, 2002). A plucked string repeats the same wave
// shape over and over; YIN compares the sound with a slightly delayed copy of itself and
// looks for the smallest delay at which the two match. That delay is one period of the wave,
// and frequency = 1 / period.

export type PitchResult = {
  /** Frequency in Hz. */
  frequency: number;
  /** 0-1: how clearly the sound repeats. Low values mean noise or no single note. */
  clarity: number;
};

/** Below this loudness (RMS) the sound is treated as silence. */
const SILENCE = 0.01;
/** YIN's threshold: the first delay whose normalised difference falls below this wins. */
const THRESHOLD = 0.15;

/**
 * Finds the pitch in `samples` (mono, -1…1), looking only between `minFrequency` and
 * `maxFrequency` so the work stays small. Returns null for silence or no clear pitch.
 * `samples` must hold at least `sampleRate / minFrequency` × 2 values.
 */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
  minFrequency: number,
  maxFrequency: number,
): PitchResult | null {
  const maxTau = Math.min(Math.floor(sampleRate / minFrequency), Math.floor(samples.length / 2));
  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const window = samples.length - maxTau; // how many samples are compared for each delay
  if (maxTau <= minTau || window <= 0) return null;

  // Silence check: the average loudness of the part we look at.
  let energy = 0;
  for (let i = 0; i < window; i++) energy += samples[i] * samples[i];
  if (Math.sqrt(energy / window) < SILENCE) return null;

  // Step 1-2: difference between the sound and itself delayed by tau, for every tau.
  const diff = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const d = samples[i] - samples[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  // Step 3: normalise, so the threshold works for loud and quiet notes alike.
  const norm = new Float32Array(maxTau + 1);
  norm[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += diff[tau];
    norm[tau] = running === 0 ? 1 : (diff[tau] * tau) / running;
  }

  // Step 4: the first dip below the threshold, followed down to its lowest point.
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (norm[t] < THRESHOLD) {
      while (t + 1 <= maxTau && norm[t + 1] < norm[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return null;

  // Step 5: the real minimum is usually between two samples; fit a parabola to find it.
  let better = tau;
  if (tau > 1 && tau < maxTau) {
    const a = norm[tau - 1];
    const b = norm[tau];
    const c = norm[tau + 1];
    const shift = (a - c) / (2 * (a - 2 * b + c));
    if (Number.isFinite(shift) && Math.abs(shift) < 1) better = tau + shift;
  }

  return { frequency: sampleRate / better, clarity: 1 - norm[tau] };
}
