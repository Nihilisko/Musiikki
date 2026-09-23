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
