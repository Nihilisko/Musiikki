// Correct note names for a key and scale, e.g. B♭ in F major instead of A♯.
//
// Rule: in a 7-note scale every letter C D E F G A B is used exactly once.
// The degree number tells which letter a note gets (degree 4 of F = the 4th letter from F = B),
// and the accidental (♯/♭) makes the letter match the actual pitch.

import { degreeName } from './degrees';
import { noteName } from './notes';
import { pitchClass, SCALES, type Scale } from './scales';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
/** Pitch class of each letter without accidentals. */
const NATURAL = [0, 2, 4, 5, 7, 9, 11];

/** A note written as a letter (0 = C ... 6 = B) plus sharps (+) or flats (-). */
type Spelling = { letter: number; accidental: number };

function format({ letter, accidental }: Spelling): string {
  const sign = accidental > 0 ? '♯' : '♭';
  return LETTERS[letter] + sign.repeat(Math.abs(accidental));
}

/** How far `pc` is from the letter's natural note, as the smallest step up or down. */
function accidentalFor(pc: number, letter: number): number {
  const difference = pitchClass(pc - NATURAL[letter]);
  return difference > 6 ? difference - 12 : difference;
}

/** Ways to write a root: C only as "C", but pitch class 1 as C♯ or D♭. */
function rootSpellings(pc: number): Spelling[] {
  const natural = NATURAL.indexOf(pc);
  if (natural >= 0) {
    return [{ letter: natural, accidental: 0 }];
  }
  return LETTERS.map((_, letter) => ({ letter, accidental: accidentalFor(pc, letter) })).filter(
    (s) => Math.abs(s.accidental) === 1,
  );
}

/** The number part of a degree name: "♭3" -> 3. */
function degreeNumber(interval: number, scale?: Scale): number {
  return Number(degreeName(interval, scale).replace(/[♭♯]/g, ''));
}

export type SpelledScale = {
  /** Name of the root, e.g. "E♭". */
  rootName: string;
  /** Name for each pitch class in the scale (index 0 = C ... 11 = B); undefined if not in the scale. */
  names: (string | undefined)[];
};

/**
 * Names the notes of a scale. Without a scale, names all 12 notes around the root.
 * When the root can be written two ways (C♯/D♭), picks the one with fewer ♯/♭.
 */
export function spellScale(root: number, scale?: Scale): SpelledScale {
  if (!scale) {
    // No scale: the letter rule doesn't apply, so give every note its simplest name,
    // using flats in flat keys (E♭, B♭...) and sharps otherwise.
    const major = spellScale(root, SCALES[0]);
    const flats = major.names.some((name) => name?.includes('♭'));
    return {
      rootName: major.rootName,
      names: Array.from({ length: 12 }, (_, pc) => noteName(pc, flats)),
    };
  }
  const intervals = scale.intervals;

  let best: { score: number; result: SpelledScale } | undefined;
  for (const rootSpelling of rootSpellings(root)) {
    const names: (string | undefined)[] = new Array(12).fill(undefined);
    let score = 0;
    for (const interval of intervals) {
      const pc = pitchClass(root + interval);
      const letter = (rootSpelling.letter + degreeNumber(interval, scale) - 1) % 7;
      const accidental = accidentalFor(pc, letter);
      names[pc] = format({ letter, accidental });
      // Every ♯/♭ costs a point; double ♯♯/♭♭ are hard to read, so they cost much more.
      score += Math.abs(accidental) + (Math.abs(accidental) > 1 ? 10 : 0);
    }
    if (!best || score < best.score) {
      best = { score, result: { rootName: format(rootSpelling), names } };
    }
  }
  return best!.result;
}
