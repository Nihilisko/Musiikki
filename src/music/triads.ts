// Triad shapes on three neighbouring strings, in root position and both inversions.
//
// A triad has three notes; on three strings each string plays one of them. Which note is at
// the bottom decides the inversion: the root (root position), the 3rd (1st inversion) or the
// 5th (2nd inversion). Going up the neck the three inversions follow each other in turn.

import type { ChordType } from './chords';
import type { Cell } from './positions';
import { pitchClass } from './scales';

/** 0 = root position, 1 = 1st inversion, 2 = 2nd inversion. */
export type Inversion = 0 | 1 | 2;

export const INVERSION_NAMES = ['Root position', '1st inversion', '2nd inversion'];

export type TriadShape = {
  cells: Cell[];
  inversion: Inversion;
  /** Lowest fret of the shape, used to order shapes up the neck. */
  fret: number;
};

/** The widest a triad shape may be, in frets (lowest to highest pressed). */
const MAX_SPAN = 4;

/** The groups of three neighbouring strings, lowest group first, as string indices. */
export function stringSets(stringCount: number): number[][] {
  return Array.from({ length: Math.max(0, stringCount - 2) }, (_, i) => [i, i + 1, i + 2]);
}

/**
 * Name for a string group, counting strings from the highest (1) like guitarists do:
 * on a guitar the highest group [3, 4, 5] is "Strings 1–3".
 */
export function stringSetName(set: number[], stringCount: number): string {
  const numbers = set.map((i) => stringCount - i).sort((a, b) => a - b);
  return `Strings ${numbers[0]}–${numbers[numbers.length - 1]}`;
}

/**
 * Every shape of a three-note chord on the given three strings, up to `frets`, lowest first.
 * @param strings all open strings of the tuning (MIDI, lowest first)
 * @param set the three string indices to use
 */
export function triadShapes(
  strings: number[],
  set: number[],
  root: number,
  chord: ChordType,
  frets: number,
): TriadShape[] {
  const tones = chord.tones.slice(0, 3).map((t) => pitchClass(root + t.interval));
  const fretsFor = (string: number) =>
    Array.from({ length: frets + 1 }, (_, f) => f).filter((f) =>
      tones.includes(pitchClass(strings[string] + f)),
    );
  const [a, b, c] = set;
  const shapes: TriadShape[] = [];

  for (const fa of fretsFor(a)) {
    for (const fb of fretsFor(b)) {
      for (const fc of fretsFor(c)) {
        const fretList = [fa, fb, fc];
        const pressed = fretList.filter((f) => f > 0);
        const low = pressed.length ? Math.min(...pressed) : 0;
        const high = pressed.length ? Math.max(...pressed) : 0;
        if (high - low >= MAX_SPAN) continue;
        // Open strings only in shapes near the nut, where they can ring with pressed notes.
        if (fretList.includes(0) && high >= MAX_SPAN) continue;
        // Each string plays a different note of the triad.
        const pcs = set.map((s, i) => pitchClass(strings[s] + fretList[i]));
        if (new Set(pcs).size !== 3) continue;
        // The inversion comes from the lowest-sounding note (on re-entrant ukulele that's
        // not always the lowest string).
        const pitches = set.map((s, i) => strings[s] + fretList[i]);
        const bass = pcs[pitches.indexOf(Math.min(...pitches))];
        shapes.push({
          cells: set.map((string, i) => ({ string, fret: fretList[i] })),
          inversion: tones.indexOf(bass) as Inversion,
          fret: Math.min(...fretList),
        });
      }
    }
  }

  return shapes.sort((x, y) => x.fret - y.fret || spanOf(x) - spanOf(y));
}

function spanOf(shape: TriadShape): number {
  const f = shape.cells.map((c) => c.fret);
  return Math.max(...f) - Math.min(...f);
}
