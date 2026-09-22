// Scale positions: one playable area of the neck instead of the whole fretboard.
//
// Pentatonic scales use the classic 5 "boxes" (2 notes per string).
// 7-note scales use 3 notes per string (3NPS), one position starting from each degree.
// Blues scales use the matching pentatonic box plus their extra note where it falls inside the box.

import { pitchClass, SCALES, type Scale } from './scales';

/** A spot on the neck: string index (0 = lowest string) and fret. */
export type Cell = { string: number; fret: number };

/** Key for a cell, e.g. "2:7" = third string, 7th fret. Used to look cells up quickly. */
export function cellKey(string: number, fret: number): string {
  return `${string}:${fret}`;
}

const MINOR_PENTATONIC = SCALES.find((s) => s.name === 'Minor pentatonic')!;
const MAJOR_PENTATONIC = SCALES.find((s) => s.name === 'Major pentatonic')!;

/** The scale whose shape the positions follow: blues scales follow their pentatonic. */
function shapeScale(scale: Scale): Scale | undefined {
  if (scale.name === 'Minor blues') return MINOR_PENTATONIC;
  if (scale.name === 'Major blues') return MAJOR_PENTATONIC;
  if (scale.intervals.length === 5 || scale.intervals.length === 7) return scale;
  return undefined;
}

/** How many positions the scale has (0 = positions not available for this scale). */
export function positionCount(scale: Scale): number {
  return shapeScale(scale)?.intervals.length ?? 0;
}

/** Name for a position in the picker, e.g. "Box 1" or "3NPS 2". */
export function positionName(scale: Scale, index: number): string {
  return positionCount(scale) === 5 ? `Box ${index + 1}` : `3NPS ${index + 1}`;
}

/**
 * The cells of one position.
 * @param strings  open strings from lowest to highest, as MIDI numbers
 * @param root     pitch class of the root
 * @param index    which position, 0 = starting from the root
 * @param extraPitchClasses notes to add when they fall inside the box (e.g. blue notes)
 */
export function scalePosition(
  strings: number[],
  root: number,
  scale: Scale,
  index: number,
  extraPitchClasses: number[] = [],
): Cell[] {
  const shape = shapeScale(scale);
  if (!shape) return [];
  const steps = shape.intervals;
  const notesPerString = steps.length === 5 ? 2 : 3;

  // Start on the lowest string, at the lowest fret where this position's first note is.
  let degree = index;
  let pitch = strings[0] + pitchClass(root + steps[degree] - strings[0]);

  const cells: Cell[] = [];
  strings.forEach((open, string) => {
    for (let n = 0; n < notesPerString; n++) {
      let fret = pitch - open;
      while (fret < 0) fret += 12; // re-entrant tunings (e.g. ukulele high G) wrap up an octave
      cells.push({ string, fret });

      // Move to the next note of the scale, always upwards.
      const current = steps[degree % steps.length];
      degree++;
      const next = steps[degree % steps.length];
      pitch += pitchClass(next - current) || 12;
    }
  });

  // Blues notes and blue notes: add them where they fall inside the box's frets.
  const minFret = Math.min(...cells.map((c) => c.fret));
  const maxFret = Math.max(...cells.map((c) => c.fret));
  const shapePitchClasses = steps.map((i) => pitchClass(root + i));
  const extras = [...scale.intervals.map((i) => pitchClass(root + i)), ...extraPitchClasses].filter(
    (pc) => !shapePitchClasses.includes(pc),
  );
  strings.forEach((open, string) => {
    for (let fret = minFret; fret <= maxFret; fret++) {
      if (extras.includes(pitchClass(open + fret))) {
        cells.push({ string, fret });
      }
    }
  });

  return cells;
}
