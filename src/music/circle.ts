// The circle of fifths: the 12 major keys, each a fifth (7 semitones) above the previous.
// Neighbours share six of their seven notes, which is why I, IV and V sit side by side.

import { pitchClass, SCALES } from './scales';
import { spellScale } from './spelling';

/** Pitch classes of the major keys, clockwise from C at the top: C G D A E B F♯ D♭ A♭ E♭ B♭ F. */
export const CIRCLE_ROOTS = Array.from({ length: 12 }, (_, i) => pitchClass(i * 7));

export type KeyMode = 'major' | 'minor';

export type CircleSegment = {
  /** Outer ring: the major key, e.g. "C". */
  major: string;
  /** Middle ring: its relative minor, e.g. "Am". */
  minor: string;
  /** Inner ring: the diminished chord of the key, e.g. "B°". */
  diminished: string;
};

const MAJOR = SCALES[0];

/** Chord names for one position on the circle (0 = C at the top). */
export function circleSegment(index: number): CircleSegment {
  const root = CIRCLE_ROOTS[pitchClass(index)];
  const names = spellScale(root, MAJOR).names;
  return {
    major: names[root]!,
    minor: `${names[pitchClass(root + 9)]}m`,
    diminished: `${names[pitchClass(root + 11)]}°`,
  };
}

export type DiatonicChord = { numeral: string; name: string };

/**
 * The seven chords that belong to the key at `index`, in scale order.
 * Major: I ii iii IV V vi vii°. Minor (the relative minor): i ii° III iv v VI VII.
 */
export function diatonicChords(index: number, mode: KeyMode): DiatonicChord[] {
  const here = circleSegment(index);
  const left = circleSegment(index - 1); // a fifth down: IV
  const right = circleSegment(index + 1); // a fifth up: V
  const major = [
    { numeral: 'I', name: here.major },
    { numeral: 'ii', name: left.minor },
    { numeral: 'iii', name: right.minor },
    { numeral: 'IV', name: left.major },
    { numeral: 'V', name: right.major },
    { numeral: 'vi', name: here.minor },
    { numeral: 'vii°', name: here.diminished },
  ];
  if (mode === 'major') return major;
  // The relative minor uses the same chords, starting from vi.
  const minorNumerals = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
  return [5, 6, 0, 1, 2, 3, 4].map((from, i) => ({
    numeral: minorNumerals[i],
    name: major[from].name,
  }));
}

/** Name of the key, e.g. "C major" or "A minor". */
export function keyName(index: number, mode: KeyMode): string {
  const segment = circleSegment(index);
  return mode === 'major' ? `${segment.major} major` : `${segment.minor.slice(0, -1)} minor`;
}
