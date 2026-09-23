// Scale degrees: where a note sits in relation to the root, e.g. 1, ♭3, 5, ♯4.

import { pitchClass, type Scale } from './scales';

/** Where each degree 1-7 is in the major scale. Other scales are described as changes to this. */
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

/** Names for all 12 semitones above the root, used when the scale gives no better answer. */
export const CHROMATIC_DEGREES = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'];

/**
 * Degree name for a note `interval` semitones above the root.
 * In 7-note scales each note gets its own number (1-7), so Lydian shows ♯4 and
 * Locrian ♭5. Other scales (pentatonics, blues) use the chromatic names.
 */
export function degreeName(interval: number, scale?: Scale): string {
  const semitones = pitchClass(interval);
  if (scale && scale.intervals.length === 7) {
    const position = scale.intervals.indexOf(semitones);
    if (position >= 0) {
      const difference = semitones - MAJOR_STEPS[position];
      const accidental = difference < 0 ? '♭'.repeat(-difference) : '♯'.repeat(difference);
      return accidental + (position + 1);
    }
  }
  return CHROMATIC_DEGREES[semitones];
}

/** Degree names for every pitch class (index 0 = C ... 11 = B) in the given key. */
export function degreeLabels(root: number, scale?: Scale): string[] {
  return Array.from({ length: 12 }, (_, pc) => degreeName(pc - root, scale));
}
