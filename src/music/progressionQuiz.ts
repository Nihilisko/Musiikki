// Harmony ear training: a four-chord progression plays (the first chord is always the home
// chord I), and you name the other three by their degree (IV, V, vi...).
// Chords are identified by their scale degree 1-7; the key decides what chord that is.

export type KeyMode = 'major' | 'minor';

type DegreeChord = { numeral: string; semitones: number; third: number; fifth: number };

/** The chord on each degree 1-7 (index 0 = degree 1). Minor uses the major V, as songs do. */
export const KEY_CHORDS: Record<KeyMode, DegreeChord[]> = {
  major: [
    { numeral: 'I', semitones: 0, third: 4, fifth: 7 },
    { numeral: 'ii', semitones: 2, third: 3, fifth: 7 },
    { numeral: 'iii', semitones: 4, third: 3, fifth: 7 },
    { numeral: 'IV', semitones: 5, third: 4, fifth: 7 },
    { numeral: 'V', semitones: 7, third: 4, fifth: 7 },
    { numeral: 'vi', semitones: 9, third: 3, fifth: 7 },
    { numeral: 'vii°', semitones: 11, third: 3, fifth: 6 },
  ],
  minor: [
    { numeral: 'i', semitones: 0, third: 3, fifth: 7 },
    { numeral: 'ii°', semitones: 2, third: 3, fifth: 6 },
    { numeral: 'III', semitones: 3, third: 4, fifth: 7 },
    { numeral: 'iv', semitones: 5, third: 3, fifth: 7 },
    { numeral: 'V', semitones: 7, third: 4, fifth: 7 },
    { numeral: 'VI', semitones: 8, third: 4, fifth: 7 },
    { numeral: 'VII', semitones: 10, third: 4, fifth: 7 },
  ],
};

/**
 * Levels by degree: the three main chords first (I, IV, V: most songs can be played with
 * them), then vi, ii, iii and finally the rare vii°.
 */
export const PROGRESSION_LEVELS: { name: string; degrees: number[] }[] = [
  { name: 'Level 1', degrees: [1, 4, 5] },
  { name: 'Level 2', degrees: [1, 4, 5, 6] },
  { name: 'Level 3', degrees: [1, 2, 4, 5, 6] },
  { name: 'Level 4', degrees: [1, 2, 3, 4, 5, 6] },
  { name: 'Level 5', degrees: [1, 2, 3, 4, 5, 6, 7] },
];

export const PROGRESSION_MODES: { id: KeyMode | 'mixed'; label: string }[] = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'mixed', label: 'Mixed' },
];

/** Chords after the first one; the first is always the home chord. */
export const GUESSED_CHORDS = 3;

export type ProgressionQuestion = {
  mode: KeyMode;
  /** Pitch class of the key's root. */
  tonic: number;
  /** Four degrees (1-7); the first is 1. */
  degrees: number[];
};

/** A random progression: the home chord, then three chords from `degrees`, no chord twice in a row. */
export function makeProgressionQuestion(
  degrees: number[],
  mode: KeyMode | 'mixed',
  random: () => number = Math.random,
): ProgressionQuestion {
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  const m: KeyMode = mode === 'mixed' ? pick(['major', 'minor']) : mode;
  const chosen = [1];
  for (let i = 0; i < GUESSED_CHORDS; i++) {
    const options = degrees.filter((d) => d !== chosen[chosen.length - 1]);
    chosen.push(pick(options.length ? options : degrees));
  }
  return { mode: m, tonic: Math.floor(random() * 12), degrees: chosen };
}

/** Lowest and highest notes for the piano chords (around middle C), and the bass octave. */
const LOW = 53; // F3
const HIGH = 72; // C5
const BASS_LOW = 36; // C2

/** All close-position voicings (root position and inversions) of a triad inside LOW..HIGH. */
function voicingsOf(pcs: number[]): number[][] {
  const result: number[][] = [];
  for (let bottom = LOW; bottom <= HIGH; bottom++) {
    if (!pcs.includes(bottom % 12)) continue;
    const notes = [bottom];
    for (let n = bottom + 1; notes.length < 3 && n <= HIGH; n++) {
      if (pcs.includes(n % 12) && !notes.some((x) => x % 12 === n % 12)) notes.push(n);
    }
    if (notes.length === 3 && notes[2] - notes[0] <= 12) result.push(notes);
  }
  return result;
}

/**
 * The progression as notes: each piano chord in the inversion closest to the one before
 * (smooth voice leading, like a pianist), and the root in the bass.
 */
export function progressionNotes(q: ProgressionQuestion): { piano: number[]; bass: number }[] {
  let previous: number[] | null = null;
  return q.degrees.map((degree) => {
    const chord = KEY_CHORDS[q.mode][degree - 1];
    const root = (q.tonic + chord.semitones) % 12;
    const pcs = [root, (root + chord.third) % 12, (root + chord.fifth) % 12];
    const options = voicingsOf(pcs);
    const distance = (v: number[]) =>
      previous ? v.reduce((sum, n, i) => sum + Math.abs(n - previous![i]), 0) : Math.abs(v[0] - 60);
    const piano = options.reduce((best, v) => (distance(v) < distance(best) ? v : best));
    previous = piano;
    return { piano, bass: BASS_LOW + root };
  });
}

/** Numeral of a degree in a key mode, e.g. degree 6 in major = "vi". */
export function numeral(mode: KeyMode, degree: number): string {
  return KEY_CHORDS[mode][degree - 1].numeral;
}
