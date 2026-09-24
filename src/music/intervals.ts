// Interval ear training: the intervals, the levels that add them a few at a time, and making
// a random question.

export type IntervalInfo = {
  semitones: number;
  short: string;
  name: string;
  /** A well-known tune that starts with this interval, going up (and down), to help remember it. */
  songUp?: string;
  songDown?: string;
};

export const INTERVALS: IntervalInfo[] = [
  { semitones: 1, short: 'm2', name: 'Minor 2nd', songUp: 'Jaws', songDown: 'Für Elise' },
  { semitones: 2, short: 'M2', name: 'Major 2nd', songUp: 'Happy Birthday', songDown: 'Yesterday' },
  { semitones: 3, short: 'm3', name: 'Minor 3rd', songUp: 'Greensleeves', songDown: 'Hey Jude' },
  {
    semitones: 4,
    short: 'M3',
    name: 'Major 3rd',
    songUp: 'When the Saints Go Marching In',
    songDown: 'Swing Low, Sweet Chariot',
  },
  {
    semitones: 5,
    short: 'P4',
    name: 'Perfect 4th',
    songUp: 'Here Comes the Bride',
    songDown: 'Eine kleine Nachtmusik',
  },
  { semitones: 6, short: 'TT', name: 'Tritone', songUp: 'The Simpsons theme' },
  {
    semitones: 7,
    short: 'P5',
    name: 'Perfect 5th',
    songUp: 'Star Wars',
    songDown: 'The Flintstones',
  },
  { semitones: 8, short: 'm6', name: 'Minor 6th', songUp: 'The Entertainer' },
  {
    semitones: 9,
    short: 'M6',
    name: 'Major 6th',
    songUp: 'My Bonnie Lies over the Ocean',
    songDown: "Nobody Knows the Trouble I've Seen",
  },
  { semitones: 10, short: 'm7', name: 'Minor 7th', songUp: 'Somewhere (West Side Story)' },
  { semitones: 11, short: 'M7', name: 'Major 7th', songUp: 'Take On Me (chorus)' },
  {
    semitones: 12,
    short: 'P8',
    name: 'Octave',
    songUp: 'Somewhere Over the Rainbow',
    songDown: 'Willow Weep for Me',
  },
];

export function intervalInfo(semitones: number): IntervalInfo {
  return INTERVALS.find((i) => i.semitones === semitones)!;
}

/**
 * Levels add intervals a few at a time, the easiest to tell apart first: the "open" sounding
 * 4th, 5th and octave, then the 3rds that make chords major or minor, and so on.
 */
export const INTERVAL_LEVELS: { name: string; intervals: number[] }[] = [
  { name: 'Level 1', intervals: [5, 7, 12] },
  { name: 'Level 2', intervals: [3, 4, 5, 7, 12] },
  { name: 'Level 3', intervals: [2, 3, 4, 5, 7, 9, 12] },
  { name: 'Level 4', intervals: [1, 2, 3, 4, 5, 7, 9, 10, 12] },
  { name: 'Level 5', intervals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
];

export type Direction = 'up' | 'down' | 'together';
export const DIRECTIONS: { id: Direction | 'mixed'; label: string }[] = [
  { id: 'up', label: 'Up' },
  { id: 'down', label: 'Down' },
  { id: 'together', label: 'Together' },
  { id: 'mixed', label: 'Mixed' },
];

export type IntervalQuestion = {
  semitones: number;
  /** The two notes as MIDI numbers, lower first. */
  low: number;
  high: number;
  direction: Direction;
};

/** Time between the two notes of an interval played up or down. */
export const INTERVAL_GAP_MS = 850;

/** The notes of a question in playing order, and the gap between them (0 = together). */
export function questionNotes(q: IntervalQuestion): { notes: number[]; gapMs: number } {
  if (q.direction === 'together') return { notes: [q.low, q.high], gapMs: 0 };
  return {
    notes: q.direction === 'down' ? [q.high, q.low] : [q.low, q.high],
    gapMs: INTERVAL_GAP_MS,
  };
}

/** Lowest and highest piano notes there are sounds for (C3 and C6). */
export const QUESTION_LOW = 48;
export const QUESTION_HIGH = 84;

/**
 * A random question from the given intervals. The lower note is kept in the middle of the
 * piano (E3 to C5), where the ear hears intervals most clearly. `random` can be replaced in
 * tests.
 */
export function makeQuestion(
  intervals: number[],
  direction: Direction | 'mixed',
  previous?: IntervalQuestion,
  random: () => number = Math.random,
): IntervalQuestion {
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  // Avoid asking the same interval twice in a row when there is a choice.
  const choices =
    intervals.length > 1 && previous
      ? intervals.filter((i) => i !== previous.semitones)
      : intervals;
  const semitones = pick(choices);
  const dir: Direction = direction === 'mixed' ? pick(['up', 'down', 'together']) : direction;
  const lowest = 52;
  const highest = Math.min(72, QUESTION_HIGH - semitones);
  const low = lowest + Math.floor(random() * (highest - lowest + 1));
  return { semitones, low, high: low + semitones, direction: dir };
}
