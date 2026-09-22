// A scale is a list of intervals: how many semitones (frets) each note is above the root.
// Example: major = 0, 2, 4, 5, 7, 9, 11 -> in C: C D E F G A B.

export type Scale = {
  name: string;
  intervals: number[];
};

export const SCALES: Scale[] = [
  // The seven modes of the major scale
  { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
  // Other minor scales
  { name: 'Harmonic minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'Melodic minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  // Pentatonic and blues
  { name: 'Major pentatonic', intervals: [0, 2, 4, 7, 9] },
  { name: 'Minor pentatonic', intervals: [0, 3, 5, 7, 10] },
  { name: 'Major blues', intervals: [0, 2, 3, 4, 7, 9] },
  { name: 'Minor blues', intervals: [0, 3, 5, 6, 7, 10] },
];

/** Pitch class = note without octave, 0-11 (C = 0, C# = 1 ... B = 11). */
export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Pitch classes that belong to the scale, e.g. C major -> [0, 2, 4, 5, 7, 9, 11]. */
export function scalePitchClasses(root: number, scale: Scale): number[] {
  return scale.intervals.map((interval) => pitchClass(root + interval));
}
