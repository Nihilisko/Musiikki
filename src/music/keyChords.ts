// The chords of a key: stack every other note of the scale on each degree (1-3-5, and 7 for
// seventh chords) and see what kind of chord it makes.

import { CHORD_TYPES } from './chords';
import { pitchClass, SCALES, type Scale } from './scales';
import { spellScale } from './spelling';

export type KeyScaleId = 'major' | 'minor' | 'harmonic';

export const KEY_SCALES: { id: KeyScaleId; label: string; scale: Scale }[] = [
  { id: 'major', label: 'Major', scale: SCALES.find((s) => s.name === 'Major (Ionian)')! },
  { id: 'minor', label: 'Minor', scale: SCALES.find((s) => s.name === 'Minor (Aeolian)')! },
  {
    id: 'harmonic',
    label: 'Harmonic minor',
    scale: SCALES.find((s) => s.name === 'Harmonic minor')!,
  },
];

/** Tonic = rest (home), subdominant = moving away, dominant = tension that wants to go home. */
export type HarmonicFunction = 'Tonic' | 'Subdominant' | 'Dominant';

// Degrees 1 3 6 are tonic, 2 4 subdominant, 5 7 dominant.
const FUNCTIONS: HarmonicFunction[] = [
  'Tonic',
  'Subdominant',
  'Tonic',
  'Subdominant',
  'Dominant',
  'Tonic',
  'Dominant',
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Triads and sevenths by their intervals above the root. Chord symbols match the chord book
// where it has the chord; the two it doesn't have (m(maj7), +maj7) are written out.
const TRIADS: Record<string, { symbol: string; quality: 'major' | 'minor' | 'dim' | 'aug' }> = {
  '4,7': { symbol: '', quality: 'major' },
  '3,7': { symbol: 'm', quality: 'minor' },
  '3,6': { symbol: '°', quality: 'dim' },
  '4,8': { symbol: '+', quality: 'aug' },
};
const SEVENTHS: Record<string, string> = {
  '4,7,11': 'maj7',
  '4,7,10': '7',
  '3,7,10': 'm7',
  '3,6,10': 'm7♭5',
  '3,6,9': '°7',
  '3,7,11': 'm(maj7)',
  '4,8,11': '+maj7',
};

export type KeyChordInfo = {
  /** Roman numeral: capitals for major chords, small letters for minor, ° and + added. */
  numeral: string;
  root: number;
  rootName: string;
  triad: string;
  seventh: string;
  /** Index into CHORD_TYPES, when the chord book has this chord. */
  triadType?: number;
  seventhType?: number;
  function: HarmonicFunction;
};

export function keyChords(tonic: number, scale: Scale): KeyChordInfo[] {
  const steps = scale.intervals;
  const names = spellScale(tonic, scale).names;
  return steps.map((step, degree) => {
    const above = (n: number) => pitchClass(steps[(degree + n) % 7] - step);
    const third = above(2);
    const fifth = above(4);
    const seventh = above(6);
    const triad = TRIADS[`${third},${fifth}`];
    const seventhSymbol = SEVENTHS[`${third},${fifth},${seventh}`] ?? '7';
    const root = pitchClass(tonic + step);
    const rootName = names[root]!;
    const roman =
      triad.quality === 'major' || triad.quality === 'aug'
        ? ROMAN[degree]
        : ROMAN[degree].toLowerCase();
    const mark = triad.quality === 'dim' ? '°' : triad.quality === 'aug' ? '+' : '';
    const typeIndex = (symbol: string) => {
      const i = CHORD_TYPES.findIndex((c) => c.symbol === symbol);
      return i >= 0 ? i : undefined;
    };
    return {
      numeral: roman + mark,
      root,
      rootName,
      triad: rootName + triad.symbol,
      seventh: rootName + seventhSymbol,
      triadType: typeIndex(triad.symbol),
      seventhType: typeIndex(seventhSymbol),
      function: FUNCTIONS[degree],
    };
  });
}
