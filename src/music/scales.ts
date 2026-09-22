// A scale is a list of intervals: how many semitones (frets) each note is above the root.
// Example: major = 0, 2, 4, 5, 7, 9, 11 -> in C: C D E F G A B.

export type Scale = {
  name: string;
  intervals: number[];
};

export const MAJOR: Scale = { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] };

/** Pitch class = note without octave, 0-11 (C = 0, C# = 1 ... B = 11). */
export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Pitch classes that belong to the scale, e.g. C major -> [0, 2, 4, 5, 7, 9, 11]. */
export function scalePitchClasses(root: number, scale: Scale): number[] {
  return scale.intervals.map((interval) => pitchClass(root + interval));
}
