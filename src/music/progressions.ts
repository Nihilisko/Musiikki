// Chord progressions, written as degrees of the key so they work in every key.

import { CHORD_TYPES, type ChordType } from './chords';
import { CIRCLE_ROOTS, type KeyMode } from './circle';
import { pitchClass, SCALES, type Scale } from './scales';
import { spellScale } from './spelling';

type ProgressionStep = {
  /** Scale degree the chord is built on, 1-7. */
  degree: number;
  numeral: string;
  /** Chord type symbol, see CHORD_TYPES: '' = major, 'm', '7'... */
  symbol: string;
};

export type Progression = {
  name: string;
  /** The different chords of the progression, in the order they first appear. */
  steps: ProgressionStep[];
  /** The form, one bar at a time, as indexes into `steps` (12-bar blues: I I I I IV IV…). */
  bars: number[];
  /** The backing groove that suits it (see GROOVES in backing.ts). */
  groove: string;
};

function step(degree: number, numeral: string, symbol: string): ProgressionStep {
  return { degree, numeral, symbol };
}

export const PROGRESSIONS: Record<KeyMode, Progression[]> = {
  major: [
    {
      name: '12-bar blues',
      steps: [step(1, 'I7', '7'), step(4, 'IV7', '7'), step(5, 'V7', '7')],
      bars: [0, 0, 0, 0, 1, 1, 0, 0, 2, 1, 0, 2],
      groove: 'shuffle',
    },
    {
      name: 'Pop I–V–vi–IV',
      steps: [step(1, 'I', ''), step(5, 'V', ''), step(6, 'vi', 'm'), step(4, 'IV', '')],
      bars: [0, 1, 2, 3],
      groove: 'pop',
    },
    {
      name: 'Jazz ii–V–I',
      steps: [step(2, 'ii7', 'm7'), step(5, 'V7', '7'), step(1, 'Imaj7', 'maj7')],
      bars: [0, 1, 2, 2],
      groove: 'swing',
    },
    {
      name: '50s I–vi–IV–V',
      steps: [step(1, 'I', ''), step(6, 'vi', 'm'), step(4, 'IV', ''), step(5, 'V', '')],
      bars: [0, 1, 2, 3],
      groove: 'pop',
    },
  ],
  minor: [
    {
      name: 'Minor blues',
      steps: [step(1, 'i7', 'm7'), step(4, 'iv7', 'm7'), step(5, 'V7', '7')],
      bars: [0, 0, 0, 0, 1, 1, 0, 0, 2, 1, 0, 2],
      groove: 'shuffle',
    },
    {
      name: 'Pop i–VI–III–VII',
      steps: [step(1, 'i', 'm'), step(6, 'VI', ''), step(3, 'III', ''), step(7, 'VII', '')],
      bars: [0, 1, 2, 3],
      groove: 'pop',
    },
    {
      name: 'Jazz iiø–V–i',
      steps: [step(2, 'iiø7', 'm7♭5'), step(5, 'V7', '7'), step(1, 'i7', 'm7')],
      bars: [0, 1, 2, 2],
      groove: 'swing',
    },
    {
      name: 'Andalusian i–VII–VI–V',
      steps: [step(1, 'i', 'm'), step(7, 'VII', ''), step(6, 'VI', ''), step(5, 'V', '')],
      bars: [0, 1, 2, 3],
      groove: 'rock',
    },
  ],
};

/**
 * One colour per degree, the same in every key: I is always red, IV green, V blue...
 * so the eye learns what "home" and "the V chord" look like on the neck.
 */
export const DEGREE_COLORS = [
  '#d93a3a', // I   red
  '#ef8a1f', // ii  orange
  '#d6b21c', // iii yellow
  '#2e9d57', // IV  green
  '#1e7be0', // V   blue
  '#8e44ad', // vi  purple
  '#8d6e63', // vii brown
];

/** The scale of the key: major, or natural minor for minor keys. */
export function keyScale(mode: KeyMode): Scale {
  return mode === 'major' ? SCALES[0] : SCALES.find((s) => s.name === 'Minor (Aeolian)')!;
}

/** Pitch class of the key's tonic for a position on the circle. */
export function keyTonic(index: number, mode: KeyMode): number {
  const root = CIRCLE_ROOTS[pitchClass(index)];
  return mode === 'major' ? root : pitchClass(root + 9); // relative minor is 9 semitones up
}

export type KeyChord = {
  numeral: string;
  /** e.g. "Dm7" */
  name: string;
  root: number;
  type: ChordType;
  color: string;
};

/** The progression's chords in a given key. */
export function progressionChords(
  tonic: number,
  mode: KeyMode,
  progression: Progression,
): KeyChord[] {
  const scale = keyScale(mode);
  const keyNames = spellScale(tonic, scale).names;
  return progression.steps.map(({ degree, numeral, symbol }) => {
    const root = pitchClass(tonic + scale.intervals[degree - 1]);
    return {
      numeral,
      name: `${keyNames[root]}${symbol}`,
      root,
      type: CHORD_TYPES.find((c) => c.symbol === symbol)!,
      color: DEGREE_COLORS[degree - 1],
    };
  });
}
