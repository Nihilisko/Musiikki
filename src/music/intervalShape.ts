// Where an interval's two notes are on the neck of the chosen instrument, so the ear training
// connects what you hear to what your hand plays.

import type { FretPosition } from './bassFingering';

export type IntervalShape = {
  low: FretPosition;
  high: FretPosition;
  /** Octaves the notes were moved so they fit the instrument (e.g. -1 on a bass). */
  octaves: number;
};

/** Highest fret looked at (low frets are preferred anyway: see the cost below). */
const MAX_FRET = 15;
/** The two notes must fit under one hand. */
const MAX_STRETCH = 4;

/**
 * Finds the easiest place to play two notes (MIDI numbers, low then high) on an instrument.
 * If the notes are out of the instrument's range they are moved by whole octaves; the shape
 * of an interval is the same in every octave.
 */
export function intervalShape(low: number, high: number, strings: number[]): IntervalShape | null {
  let best: (IntervalShape & { cost: number }) | undefined;
  for (const octaves of [0, -1, 1, -2, 2, -3, 3]) {
    const lo = low + octaves * 12;
    const hi = high + octaves * 12;
    strings.forEach((openLow, s) => {
      const f = lo - openLow;
      if (f < 0 || f > MAX_FRET) return;
      strings.forEach((openHigh, t) => {
        const g = hi - openHigh;
        if (g < 0 || g > MAX_FRET) return;
        const fretted = [f, g].filter((x) => x > 0);
        const stretch = fretted.length === 2 ? Math.abs(f - g) : 0;
        if (stretch > MAX_STRETCH) return;
        // Both notes on one string: only for small steps.
        if (s === t && Math.abs(g - f) > 4) return;
        const cost =
          Math.max(f, g) * 0.3 + // low on the neck
          stretch * 0.4 +
          (s === t ? 1.5 : 0) +
          (t < s ? 1 : 0) + // the higher note usually sits on a higher string
          Math.abs(s - t) * 0.2 +
          (2 - fretted.length) * 1.5 + // fretted shapes can be moved to any key; open ones can't
          Math.abs(octaves) * 1;
        if (!best || cost < best.cost) {
          best = { cost, low: { string: s, fret: f }, high: { string: t, fret: g }, octaves };
        }
      });
    });
  }
  if (!best) return null;
  return { low: best.low, high: best.high, octaves: best.octaves };
}
