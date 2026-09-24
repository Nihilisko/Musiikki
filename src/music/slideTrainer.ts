// Slide intonation training: a target note from a key's scale, somewhere on your neck, that you
// play with the slide and hold in tune. With a slide there are no frets to help, so the ear
// and the eye (the slide straight over the fret wire) do all the work.

import { cellKey } from './positions';
import { pitchClass, SCALES, type Scale } from './scales';

export const SLIDE_SCALES: { label: string; scale: Scale }[] = [
  'Major pentatonic',
  'Minor pentatonic',
  'Minor blues',
  'Major (Ionian)',
].map((name) => ({
  label: name.replace(' (Ionian)', ''),
  scale: SCALES.find((s) => s.name === name)!,
}));

/** How close counts as in tune. A slide is harder than frets, so it starts looser than a tuner. */
export const TOLERANCES = [
  { label: 'Easy ±15', cents: 15 },
  { label: 'Normal ±8', cents: 8 },
  { label: 'Hard ±4', cents: 4 },
];

/** Stay in tune this long to hit the target. */
export const HOLD_MS = 1000;

/** Frets the targets are taken from: fret 0 is an open string, which needs no slide. */
const LOWEST_FRET = 1;
const HIGHEST_FRET = 12;

export type SlideTarget = {
  string: number;
  fret: number;
  midi: number;
  /** Semitones above the key's root (0-11), for the degree name. */
  degree: number;
};

/** Every place on the neck (frets 1-12) where a note of the scale is. */
export function slideTargets(strings: number[], root: number, scale: Scale): SlideTarget[] {
  const targets: SlideTarget[] = [];
  strings.forEach((open, string) => {
    for (let fret = LOWEST_FRET; fret <= HIGHEST_FRET; fret++) {
      const midi = open + fret;
      const degree = pitchClass(midi - root);
      if (scale.intervals.includes(degree)) targets.push({ string, fret, midi, degree });
    }
  });
  return targets;
}

/** A random target, not the same place as last time. */
export function pickTarget(
  targets: SlideTarget[],
  previous?: SlideTarget | null,
  random: () => number = Math.random,
): SlideTarget {
  const same = (t: SlideTarget) =>
    previous && cellKey(t.string, t.fret) === cellKey(previous.string, previous.fret);
  const options = targets.length > 1 ? targets.filter((t) => !same(t)) : targets;
  return options[Math.floor(random() * options.length)];
}

/**
 * Keeps track of how long the note has stayed in tune. Returns the new start time (null when
 * out of tune) and whether it has been held long enough.
 */
export function updateHold(
  since: number | null,
  inTune: boolean,
  now: number,
): { since: number | null; held: boolean } {
  if (!inTune) return { since: null, held: false };
  const start = since ?? now;
  return { since: start, held: now - start >= HOLD_MS };
}
