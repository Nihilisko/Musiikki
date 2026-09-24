// Chord type ear training: levels of chord types, playing styles and random questions.
// Chord types are used by their index in CHORD_TYPES, the same list the chord book uses.

import { CHORD_TYPES } from './chords';

const typeIndex = (symbol: string) => CHORD_TYPES.findIndex((c) => c.symbol === symbol);

/** Short label for a chord type: "maj" for the plain major chord, else its symbol. */
export function chordShort(index: number): string {
  return CHORD_TYPES[index].symbol || 'maj';
}

/**
 * Levels add chord types a few at a time: major and minor first (happy and sad), then the
 * tense diminished and augmented, the open-sounding sus chords, the common 7th chords and
 * finally the more colourful ones.
 */
export const CHORD_LEVELS: { name: string; types: number[] }[] = [
  ['', 'm'],
  ['', 'm', '°', '+'],
  ['', 'm', '°', '+', 'sus2', 'sus4'],
  ['', 'm', '°', '+', 'sus2', 'sus4', 'maj7', '7', 'm7'],
  ['', 'm', '°', '+', 'sus2', 'sus4', 'maj7', '7', 'm7', 'm7♭5', '°7', '6', 'm6'],
].map((symbols, i) => ({ name: `Level ${i + 1}`, types: symbols.map(typeIndex) }));

/** Custom mode starts with major, minor and dominant 7. */
export const DEFAULT_CUSTOM = ['', 'm', '7'].map(typeIndex);

/** Chord types that can be picked in Custom mode: all that the levels use. */
export const QUIZ_CHORD_TYPES = CHORD_LEVELS[CHORD_LEVELS.length - 1].types;

export type PlayStyle = 'together' | 'broken';
export const PLAY_STYLES: { id: PlayStyle | 'mixed'; label: string }[] = [
  { id: 'together', label: 'Together' },
  { id: 'broken', label: 'Broken (up)' },
  { id: 'mixed', label: 'Mixed' },
];

/** Time between the notes of a broken chord. */
export const BROKEN_GAP_MS = 380;

export type ChordQuestion = {
  type: number;
  /** MIDI notes of the chord, lowest first. */
  notes: number[];
  style: PlayStyle;
};

/**
 * A random question from the given chord types, in close position with the root at the
 * bottom, the root somewhere between E3 and E4.
 */
export function makeChordQuestion(
  types: number[],
  style: PlayStyle | 'mixed',
  previous?: ChordQuestion,
  random: () => number = Math.random,
): ChordQuestion {
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  const choices = types.length > 1 && previous ? types.filter((t) => t !== previous.type) : types;
  const type = pick(choices);
  const root = 52 + Math.floor(random() * 13); // E3 .. E4
  const notes = CHORD_TYPES[type].tones.map((t) => root + t.interval);
  return { type, notes, style: style === 'mixed' ? pick(['together', 'broken']) : style };
}
