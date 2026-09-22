// Chord types. Each tone has its interval above the root and its degree name,
// because chords name some intervals differently from scales (♯5 in augmented, ♭♭7 in dim7).

export type ChordTone = { interval: number; degree: string };

export type ChordType = {
  /** Written after the root: "" (C), "m" (Cm), "7" (C7)... */
  symbol: string;
  name: string;
  tones: ChordTone[];
};

function tones(...pairs: [number, string][]): ChordTone[] {
  return pairs.map(([interval, degree]) => ({ interval, degree }));
}

export const CHORD_TYPES: ChordType[] = [
  // Triads
  { symbol: '', name: 'Major', tones: tones([0, '1'], [4, '3'], [7, '5']) },
  { symbol: 'm', name: 'Minor', tones: tones([0, '1'], [3, '♭3'], [7, '5']) },
  { symbol: '°', name: 'Diminished', tones: tones([0, '1'], [3, '♭3'], [6, '♭5']) },
  { symbol: '+', name: 'Augmented', tones: tones([0, '1'], [4, '3'], [8, '♯5']) },
  { symbol: 'sus2', name: 'Sus2', tones: tones([0, '1'], [2, '2'], [7, '5']) },
  { symbol: 'sus4', name: 'Sus4', tones: tones([0, '1'], [5, '4'], [7, '5']) },
  // Sixths and sevenths
  { symbol: '6', name: 'Major 6', tones: tones([0, '1'], [4, '3'], [7, '5'], [9, '6']) },
  { symbol: 'm6', name: 'Minor 6', tones: tones([0, '1'], [3, '♭3'], [7, '5'], [9, '6']) },
  { symbol: '7', name: 'Dominant 7', tones: tones([0, '1'], [4, '3'], [7, '5'], [10, '♭7']) },
  { symbol: 'maj7', name: 'Major 7', tones: tones([0, '1'], [4, '3'], [7, '5'], [11, '7']) },
  { symbol: 'm7', name: 'Minor 7', tones: tones([0, '1'], [3, '♭3'], [7, '5'], [10, '♭7']) },
  { symbol: 'm7♭5', name: 'Half-diminished', tones: tones([0, '1'], [3, '♭3'], [6, '♭5'], [10, '♭7']) },
  { symbol: '°7', name: 'Diminished 7', tones: tones([0, '1'], [3, '♭3'], [6, '♭5'], [9, '♭♭7']) },
];
