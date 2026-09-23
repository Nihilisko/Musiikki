// Metronome rules with no sound or screen: time signatures, accents and timing.

/** How strongly a beat is played: the first beat of the bar is strong. */
export type Accent = 'strong' | 'medium' | 'weak';

export type TimeSignature = {
  label: string;
  /** One entry per beat (per light), e.g. 3/4 -> strong, weak, weak. */
  accents: Accent[];
};

const S = 'strong';
const M = 'medium';
const W = 'weak';

export const TIME_SIGNATURES: TimeSignature[] = [
  { label: '2/4', accents: [S, W] },
  { label: '3/4', accents: [S, W, W] },
  { label: '4/4', accents: [S, W, W, W] },
  { label: '5/4', accents: [S, W, W, M, W] }, // counted 3 + 2
  // In 6/8 and 12/8 every eighth note is a beat, grouped in threes.
  { label: '6/8', accents: [S, W, W, M, W, W] },
  { label: '7/8', accents: [S, W, M, W, M, W, W] }, // counted 2 + 2 + 3
  { label: '12/8', accents: [S, W, W, M, W, W, M, W, W, M, W, W] },
];

export const DEFAULT_TIME_SIGNATURE = 2; // 4/4

export const MIN_BPM = 30;
export const MAX_BPM = 250;

export function clampBpm(bpm: number): number {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm)));
}

/** Milliseconds between two beats. 60 000 ms in a minute, shared by the beats. */
export function beatInterval(bpm: number): number {
  return 60000 / bpm;
}

/** Extra clicks between the beats. `count` = clicks per beat, the beat itself included. */
export type Subdivision = { label: string; count: number };

export const SUBDIVISIONS: Subdivision[] = [
  { label: 'Off', count: 1 },
  { label: '8ths', count: 2 },
  { label: 'Triplets', count: 3 },
  { label: '16ths', count: 4 },
];

/** Speed trainer: raise the tempo by `step` BPM every `everyBars` bars, up to `target`. */
export type TempoRamp = { step: number; everyBars: number; target: number };

/** The tempo after a ramp step, never past the target. */
export function rampedBpm(bpm: number, ramp: TempoRamp): number {
  return Math.min(ramp.target, bpm + ramp.step);
}

/** Taps further apart than this start a new count. */
export const TAP_RESET_MS = 2000;
/** How many of the latest taps are averaged. */
const TAPS_AVERAGED = 4;

/**
 * Tempo from tap times (milliseconds, oldest first), or null with fewer than two taps.
 * Averages the gaps between the last few taps, so one uneven tap doesn't throw it off.
 */
export function tapTempo(times: number[]): number | null {
  const recent = times.slice(-TAPS_AVERAGED - 1);
  if (recent.length < 2) return null;
  const average = (recent[recent.length - 1] - recent[0]) / (recent.length - 1);
  return clampBpm(60000 / average);
}
