// CAGED: the five open major chords C, A, G, E and D used as movable shapes. In any key the
// five shapes follow each other up the neck (in C: C shape open, A at 3, G at 5, E at 8,
// D at 10), and each one has its own scale position around it.

import type { Cell } from './positions';
import { pitchClass } from './scales';

export type CagedShapeName = 'C' | 'A' | 'G' | 'E' | 'D';

type Template = {
  name: CagedShapeName;
  /** The string the shape's root is on (0 = low E). */
  rootString: number;
  /** Fret of each string relative to the root's fret; null = not played. */
  frets: (number | null)[];
};

// The open chords, written relative to where their root is:
// C x32010, A x02220, G 320003, E 022100, D xx0232.
const TEMPLATES: Template[] = [
  { name: 'C', rootString: 1, frets: [null, 0, -1, -3, -2, -3] },
  { name: 'A', rootString: 1, frets: [null, 0, 2, 2, 2, 0] },
  { name: 'G', rootString: 0, frets: [0, -1, -3, -3, -3, 0] },
  { name: 'E', rootString: 0, frets: [0, 2, 2, 1, 0, 0] },
  { name: 'D', rootString: 2, frets: [null, null, 0, 2, 3, 2] },
];

export const CAGED_ORDER: CagedShapeName[] = ['C', 'A', 'G', 'E', 'D'];

/** Gaps between neighbouring strings in standard tuning (E A D G B E): 5 5 5 4 5. */
const STANDARD_GAPS = [5, 5, 5, 4, 5];

/** CAGED only works with standard tuning's string gaps (E standard, E♭ standard, D standard…). */
export function supportsCaged(strings: number[]): boolean {
  return (
    strings.length === 6 && strings.slice(1).every((s, i) => s - strings[i] === STANDARD_GAPS[i])
  );
}

export type CagedShape = {
  name: CagedShapeName;
  /** The notes of the chord shape. */
  cells: Cell[];
  /** Lowest and highest fret used, for the scale area around it. */
  low: number;
  high: number;
};

/**
 * Every CAGED shape of the major chord `root` that fits on the neck, lowest first.
 * Shapes repeat 12 frets higher when there is room.
 */
export function cagedShapes(strings: number[], root: number, frets: number): CagedShape[] {
  const shapes: CagedShape[] = [];
  for (const t of TEMPLATES) {
    const lowestRel = Math.min(...t.frets.filter((f): f is number => f !== null));
    let base = pitchClass(root - strings[t.rootString]);
    if (base + lowestRel < 0) base += 12;
    for (; base + Math.max(...t.frets.map((f) => f ?? 0)) <= frets; base += 12) {
      const cells = t.frets.flatMap((rel, string) =>
        rel === null ? [] : [{ string, fret: base + rel }],
      );
      const fretList = cells.map((c) => c.fret);
      shapes.push({ name: t.name, cells, low: Math.min(...fretList), high: Math.max(...fretList) });
    }
  }
  return shapes.sort((a, b) => a.low - b.low);
}

/**
 * The notes of `pitchClasses` in the area around a shape: from a fret below its lowest note to
 * a fret above its highest, which is where its scale position lies.
 */
export function notesAroundShape(
  strings: number[],
  shape: CagedShape,
  pitchClasses: number[],
  frets: number,
): Cell[] {
  const from = Math.max(0, shape.low - 1);
  const to = Math.min(frets, Math.max(shape.high + 1, from + 4));
  const cells: Cell[] = [];
  strings.forEach((open, string) => {
    for (let fret = from; fret <= to; fret++) {
      if (pitchClasses.includes(pitchClass(open + fret))) cells.push({ string, fret });
    }
  });
  return cells;
}
