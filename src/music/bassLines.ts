// Bass lines for the backing grooves: which note the bass plays on which step of the bar.
// Each groove has the pattern bass players use in that style.

import type { ChordType } from './chords';
import { pitchClass } from './scales';

/** One bass note: step of the bar (0-7, see STEPS_PER_BAR), MIDI note and how loud (0-1). */
export type BassNote = { step: number; midi: number; volume: number };

/** Lowest and highest bass notes there are sounds for: E1 (open low E) to E3. */
export const BASS_LOW = 28;
export const BASS_HIGH = 52;

/** The root in the lowest octave of the bass: E1 up to D♯2. */
export function bassRoot(root: number): number {
  return BASS_LOW + pitchClass(root - BASS_LOW);
}

/** Interval of the chord's 3rd (4 = major, 3 = minor) and 5th (7, or 6 in m7♭5). */
function third(chord: ChordType): number {
  return chord.tones.find((t) => t.interval === 3 || t.interval === 4)?.interval ?? 4;
}
function fifth(chord: ChordType): number {
  return chord.tones.find((t) => t.interval >= 6 && t.interval <= 8)?.interval ?? 7;
}
/** Interval of the 7th: 10 (♭7) or 11 (maj7); triads get the ♭7. */
function seventh(chord: ChordType): number {
  return chord.tones.find((t) => t.interval === 10 || t.interval === 11)?.interval ?? 10;
}

const notes = (low: number, pattern: [number, number, number][]): BassNote[] =>
  pattern.map(([step, interval, volume]) => ({ step, midi: low + interval, volume }));

/**
 * The bass line for one bar.
 * @param root, chord  the chord of this bar
 * @param nextRoot     the root of the next bar's chord, for walking lines that lead into it
 */
export function bassLine(
  grooveId: string,
  root: number,
  chord: ChordType,
  nextRoot: number,
): BassNote[] {
  const low = bassRoot(root);
  const t3 = third(chord);
  const t5 = fifth(chord);
  switch (grooveId) {
    case 'shuffle':
      // Boogie: up the chord and the 6th to the ♭7, and back down: 1 3 5 6 ♭7 6 5 3.
      return notes(low, [
        [0, 0, 0.9],
        [1, t3, 0.6],
        [2, t5, 0.8],
        [3, 9, 0.6],
        [4, 10, 0.8],
        [5, 9, 0.6],
        [6, t5, 0.8],
        [7, t3, 0.6],
      ]);
    case 'pop':
      // Root and 5th, with a push on the "and" of 2.
      return notes(low, [
        [0, 0, 0.9],
        [3, 0, 0.6],
        [4, t5, 0.8],
        [6, t5, 0.6],
      ]);
    case 'swing': {
      // Walking bass: a note on every beat, and the last one a half step away from the next
      // chord's root, so the line leads into it. If the next root is higher, walk up
      // (1 3 5); if it is lower, walk down through the 7th and 5th below.
      const target = bassRoot(nextRoot);
      // Walking down needs room below: the 5th below must stay above the lowest bass note.
      const walkDown = target < low && low - 12 + t5 > BASS_LOW;
      const line = walkDown
        ? [low, low - 12 + seventh(chord), low - 12 + t5]
        : [low, low + t3, low + t5];
      const last = line[2];
      const approach = target + 1 < last || target === BASS_LOW ? target + 1 : target - 1;
      return [...line, approach].map((midi, beat) => ({
        step: beat * 2,
        midi,
        volume: beat === 0 ? 0.9 : 0.75,
      }));
    }
    default:
      // Rock: steady eighth notes on the root, the beats a little stronger.
      return notes(
        low,
        [0, 1, 2, 3, 4, 5, 6, 7].map((step) => [step, 0, step % 2 === 0 ? 0.85 : 0.6]),
      );
  }
}
