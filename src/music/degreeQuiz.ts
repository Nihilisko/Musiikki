// Scale degree ear training: a short chord progression sets the key, then one note plays and
// you name its degree. Degrees are counted in semitones above the key's root (0-11), so the
// same answer buttons work in major and minor.

/** Degree names by semitones above the root, and movable-do solfège as a memory aid. */
export const DEGREES: { semitones: number; short: string; solfege: string }[] = [
  { semitones: 0, short: '1', solfege: 'Do' },
  { semitones: 1, short: '♭2', solfege: 'Ra' },
  { semitones: 2, short: '2', solfege: 'Re' },
  { semitones: 3, short: '♭3', solfege: 'Me' },
  { semitones: 4, short: '3', solfege: 'Mi' },
  { semitones: 5, short: '4', solfege: 'Fa' },
  { semitones: 6, short: '♯4', solfege: 'Fi' },
  { semitones: 7, short: '5', solfege: 'Sol' },
  { semitones: 8, short: '♭6', solfege: 'Le' },
  { semitones: 9, short: '6', solfege: 'La' },
  { semitones: 10, short: '♭7', solfege: 'Te' },
  { semitones: 11, short: '7', solfege: 'Ti' },
];

export type KeyMode = 'major' | 'minor';

/** The seven notes of each key, as semitones above the root (natural minor). */
const SCALE: Record<KeyMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

/**
 * Levels by scale degree number: the notes of the home chord (1 3 5) first, as they are the
 * easiest to hear against the key, then 4 and 6, then 2 and 7, then all seven, and finally
 * the notes outside the key too.
 */
export const DEGREE_LEVELS: { name: string; degrees: number[] | 'chromatic' }[] = [
  { name: 'Level 1', degrees: [1, 3, 5] },
  { name: 'Level 2', degrees: [1, 3, 4, 5, 6] },
  { name: 'Level 3', degrees: [1, 2, 3, 5, 7] },
  { name: 'Level 4', degrees: [1, 2, 3, 4, 5, 6, 7] },
  { name: 'Level 5', degrees: 'chromatic' },
];

export const KEY_MODES: { id: KeyMode | 'mixed'; label: string }[] = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'mixed', label: 'Mixed' },
];

/** Semitones a level asks about in one key mode. */
export function levelSemitones(level: number, mode: KeyMode): number[] {
  const { degrees } = DEGREE_LEVELS[level];
  if (degrees === 'chromatic') return DEGREES.map((d) => d.semitones);
  return degrees.map((d) => SCALE[mode][d - 1]);
}

/** The answer buttons: everything the level can ask in the chosen mode(s), low to high. */
export function answerSemitones(level: number, mode: KeyMode | 'mixed'): number[] {
  const modes: KeyMode[] = mode === 'mixed' ? ['major', 'minor'] : [mode];
  const all = new Set(modes.flatMap((m) => levelSemitones(level, m)));
  return [...all].sort((a, b) => a - b);
}

export type DegreeQuestion = {
  mode: KeyMode;
  /** MIDI note of the key's root. */
  tonic: number;
  /** The note to name, and its degree in semitones above the root. */
  note: number;
  semitones: number;
};

/**
 * A random question. `pool(mode)` gives the semitones that may be asked in that mode: a level's
 * degrees, or the custom selection.
 */
export function makeDegreeQuestion(
  pool: (mode: KeyMode) => number[],
  mode: KeyMode | 'mixed',
  previous?: DegreeQuestion,
  random: () => number = Math.random,
): DegreeQuestion {
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  const m: KeyMode = mode === 'mixed' ? pick(['major', 'minor']) : mode;
  const options = pool(m);
  const choices =
    options.length > 1 && previous ? options.filter((s) => s !== previous.semitones) : options;
  const semitones = pick(choices);
  const tonic = 52 + Math.floor(random() * 12); // E3 .. D♯4
  return { mode: m, tonic, note: tonic + semitones, semitones };
}

/**
 * The chords that set the key, voiced close together like a pianist would play them:
 * I – IV – V – I (in minor i – iv – V – i, with the major V that pulls strongly home).
 */
export function cadence(tonic: number, mode: KeyMode): number[][] {
  const third = mode === 'major' ? 4 : 3;
  const sixth = mode === 'major' ? 9 : 8;
  const home = [tonic, tonic + third, tonic + 7];
  return [home, [tonic, tonic + 5, tonic + sixth], [tonic - 1, tonic + 2, tonic + 7], home];
}
