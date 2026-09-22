// Instruments and their tunings.
// Strings are listed from the lowest (thickest) string to the highest (thinnest),
// as MIDI numbers. Reference: E2 = 40, A2 = 45, D3 = 50, G3 = 55, B3 = 59, E4 = 64.

export type Tuning = {
  name: string;
  strings: number[];
};

export type Instrument = {
  id: string;
  name: string;
  frets: number;
  tunings: Tuning[];
  /** 12-string: how many of the lowest courses have an octave string paired with them. */
  octaveCourses?: number;
};

export const INSTRUMENTS: Instrument[] = [
  {
    id: 'guitar',
    name: 'Guitar',
    frets: 15,
    tunings: [
      { name: 'Standard', strings: [40, 45, 50, 55, 59, 64] },
      { name: 'Drop D', strings: [38, 45, 50, 55, 59, 64] },
      { name: 'Double Drop D', strings: [38, 45, 50, 55, 59, 62] },
      { name: 'Eb Standard', strings: [39, 44, 49, 54, 58, 63] },
      { name: 'D Standard', strings: [38, 43, 48, 53, 57, 62] },
      { name: 'DADGAD', strings: [38, 45, 50, 55, 57, 62] },
      { name: 'Open G', strings: [38, 43, 50, 55, 59, 62] },
      { name: 'Open D', strings: [38, 45, 50, 54, 57, 62] },
      { name: 'Open E', strings: [40, 47, 52, 56, 59, 64] },
      { name: 'Open C', strings: [36, 43, 48, 55, 60, 64] },
    ],
  },
  {
    id: 'bass',
    name: 'Bass',
    frets: 15,
    tunings: [
      { name: '4-string Standard', strings: [28, 33, 38, 43] },
      { name: '4-string Drop D', strings: [26, 33, 38, 43] },
      { name: '5-string', strings: [23, 28, 33, 38, 43] },
      { name: '6-string', strings: [23, 28, 33, 38, 43, 48] },
    ],
  },
  {
    id: 'ukulele',
    name: 'Ukulele',
    frets: 15,
    tunings: [
      // High G is re-entrant: the G string is higher than the C string next to it.
      { name: 'Standard (High G)', strings: [67, 60, 64, 69] },
      { name: 'Low G', strings: [55, 60, 64, 69] },
      { name: 'Baritone', strings: [50, 55, 59, 64] },
    ],
  },
  {
    id: 'twelve',
    name: '12-string',
    frets: 15,
    octaveCourses: 4,
    tunings: [{ name: 'Standard', strings: [40, 45, 50, 55, 59, 64] }],
  },
  {
    id: 'cigarbox',
    name: 'Cigar box',
    frets: 15,
    tunings: [
      { name: '3-string Open G (GDG)', strings: [43, 50, 55] },
      { name: '3-string Open D (DGD)', strings: [50, 55, 62] },
      { name: '3-string Open A (AEA)', strings: [45, 52, 57] },
      { name: '4-string Open G (DGBD)', strings: [50, 55, 59, 62] },
      { name: '4-string Open G (GDGB)', strings: [43, 50, 55, 59] },
    ],
  },
  {
    id: 'slide',
    name: 'Slide',
    frets: 15,
    tunings: [
      { name: 'Open G', strings: [38, 43, 50, 55, 59, 62] },
      { name: 'Open D', strings: [38, 45, 50, 54, 57, 62] },
      { name: 'Open E', strings: [40, 47, 52, 56, 59, 64] },
      { name: 'C6 (lap steel)', strings: [48, 52, 55, 57, 60, 64] },
    ],
  },
];
