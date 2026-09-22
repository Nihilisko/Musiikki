// Blue notes: the "bent" notes of the blues, sung or played between major and minor.
// Each is a number of semitones above the root.

export type BlueNote = { label: string; interval: number };

export const BLUE_NOTES: BlueNote[] = [
  { label: '♭3', interval: 3 },
  { label: '♭5', interval: 6 },
  { label: '♭7', interval: 10 },
];
