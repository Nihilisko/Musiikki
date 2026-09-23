// Open tunings: the open strings already make a chord, so one finger or a slide across all
// strings plays that chord higher up. Open G (D G D G B D) plays G open, C at the 5th fret and
// D at the 7th — the blues I–IV–V.

import type { KeyMode } from './circle';
import { DEGREE_COLORS, keyScale } from './progressions';
import { pitchClass } from './scales';
import { spellScale } from './spelling';

/** The chord of the open strings: its root and third (3 = minor, 4 = major, null = none). */
export type TuningChord = { root: number; third: 3 | 4 | null };

/**
 * The chord the open strings make, or null when they don't make a major, minor or
 * root-and-5th chord (e.g. standard tuning or DADGAD).
 */
export function tuningChord(strings: number[]): TuningChord | null {
  const pcs = [...new Set(strings.map((s) => pitchClass(s)))];
  if (pcs.length > 3) return null;
  // Try each note as the root, starting with the lowest string's note.
  const candidates = [...new Set([pitchClass(strings[0]), ...pcs])];
  for (const root of candidates) {
    const rel = pcs.map((pc) => pitchClass(pc - root));
    const allowed = rel.every((r) => r === 0 || r === 3 || r === 4 || r === 7);
    if (!allowed || (rel.includes(3) && rel.includes(4)) || !rel.includes(7)) continue;
    return { root, third: rel.includes(4) ? 4 : rel.includes(3) ? 3 : null };
  }
  return null;
}

export type SlideCell = { string: number; fret: number };

export type SlidePosition = {
  /** Where the slide (or a finger across all strings) goes. */
  fret: number;
  /** Strings that must be pressed one fret away to change major into minor (or back). */
  changed: SlideCell[];
  /** Strings that can't be played in this position. */
  muted: number[];
};

export type SlideChord = {
  numeral: string;
  name: string;
  color: string;
  /** I, IV and V (i, iv, v in minor): the chords most blues and folk songs use. */
  primary: boolean;
  positions: SlidePosition[];
};

const MAJOR_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const MINOR_NUMERALS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

/** Where each chord of the key sits in the open tuning, up to `frets`. */
export function slideChart(
  strings: number[],
  tonic: number,
  mode: KeyMode,
  frets: number,
): SlideChord[] {
  const tuning = tuningChord(strings);
  if (!tuning) return [];
  const scale = keyScale(mode).intervals;
  const names = spellScale(tonic, keyScale(mode)).names;
  const numerals = mode === 'major' ? MAJOR_NUMERALS : MINOR_NUMERALS;

  return scale.map((step, degree) => {
    const root = pitchClass(tonic + step);
    // The chord built on this degree from the key's own notes: third and fifth above it.
    const third = pitchClass(scale[(degree + 2) % 7] - step);
    const fifth = pitchClass(scale[(degree + 4) % 7] - step);
    const suffix = fifth === 6 ? '°' : third === 3 ? 'm' : '';
    const base = pitchClass(root - tuning.root);

    const positions: SlidePosition[] = [];
    for (let fret = base; fret <= frets; fret += 12) {
      const changed: SlideCell[] = [];
      const muted: number[] = [];
      strings.forEach((open, string) => {
        const rel = pitchClass(open - tuning.root);
        // Move the tuning's 3rd to this chord's 3rd, and its 5th to a diminished 5th.
        let shift = 0;
        if (tuning.third !== null && rel === tuning.third) shift = third - tuning.third;
        if (rel === 7 && fifth === 6) shift = -1;
        if (shift === 0) return;
        const target = fret + shift;
        if (target < 0 || target > frets) muted.push(string);
        else changed.push({ string, fret: target });
      });
      positions.push({ fret, changed, muted });
    }

    return {
      numeral: numerals[degree],
      name: `${names[root]}${suffix}`,
      color: DEGREE_COLORS[degree],
      primary: degree === 0 || degree === 3 || degree === 4,
      positions,
    };
  });
}
