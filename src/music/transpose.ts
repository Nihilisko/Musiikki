// Transposing chord charts and finding a capo position.
//
// A chord symbol is a root (C, F♯, B♭…), a suffix that says what kind of chord it is (m, 7,
// maj7, sus4…) and maybe a bass note after a slash (C/E). Transposing moves the root and the
// bass; the suffix stays the same.

import { pitchClass, SCALES } from './scales';
import { spellScale } from './spelling';

export type ParsedChord = {
  /** The chord as written, e.g. "F#m7". */
  text: string;
  root: number;
  /** Everything after the root and before a slash, e.g. "m7". */
  suffix: string;
  bass?: number;
};

export type ChartToken = { text: string; chord: ParsedChord | null };

// H is B in Finnish, German and Nordic chord charts (Hm = Bm).
const LETTERS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, H: 11 };
// Letters with an optional sharp or flat, written with ASCII (# b) or music signs (♯ ♭).
const NOTE = '([A-H])([#♯b♭]?)';
const CHORD = new RegExp(`^${NOTE}([^/]*)(?:/${NOTE})?$`);
// Suffixes made of the usual chord words and numbers: m, maj7, sus4, add9, dim, 7♭9, m7(♭5)…
const SUFFIX = /^(?:maj|min|m|M|dim|aug|sus|add|no|alt|°|ø|\+|-|Δ|[0-9]|[#♯b♭]|\(|\)|,)*$/;

function pitchOf(letter: string, accidental: string): number {
  const shift = accidental === '#' || accidental === '♯' ? 1 : accidental ? -1 : 0;
  return pitchClass(LETTERS[letter] + shift);
}

/** Reads one chord symbol, or returns null if it isn't one. */
export function parseChord(text: string): ParsedChord | null {
  const m = CHORD.exec(text);
  if (!m || !SUFFIX.test(m[3])) return null;
  return {
    text,
    root: pitchOf(m[1], m[2]),
    suffix: m[3],
    bass: m[4] ? pitchOf(m[4], m[5]) : undefined,
  };
}

/** Splits a chart ("G D | Em C") into chords; bar lines and dashes are skipped. */
export function parseChart(input: string): ChartToken[] {
  return input
    .split(/[\s,|]+/)
    .filter((t) => t !== '' && t !== '-' && t !== '–')
    .map((text) => ({ text, chord: parseChord(text) }));
}

/** A minor chord suffix: m, m7, min… but not maj7. */
export function isMinor(suffix: string): boolean {
  return /^(m(?!aj)|min|-)/.test(suffix);
}

export type Key = { tonic: number; minor: boolean };

type Quality = 'major' | 'minor' | 'dim';

function qualityOf(suffix: string): Quality {
  if (/dim|°|ø|m7b5|m7♭5/.test(suffix)) return 'dim';
  return isMinor(suffix) ? 'minor' : 'major';
}

// The triads of a major key: degree steps and their quality (I ii iii IV V vi vii°).
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_QUALITIES: Quality[] = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'];

/**
 * The song's key: the one whose own chords match the most chords of the song. A minor key has
 * the same chords as its relative major, so ties go to the key of the first chord, then the
 * last (songs usually start or end on the home chord).
 */
export function guessKey(chords: ParsedChord[]): Key | null {
  if (chords.length === 0) return null;
  const first = chords[0];
  const last = chords[chords.length - 1];
  let best: { key: Key; score: number } | null = null;
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const minor of [false, true]) {
      const major = minor ? pitchClass(tonic + 3) : tonic; // the relative major's chords
      let score = 0;
      for (const c of chords) {
        const step = MAJOR_STEPS.indexOf(pitchClass(c.root - major));
        if (step >= 0 && MAJOR_QUALITIES[step] === qualityOf(c.suffix)) score += 1;
      }
      // The first chord counts a little more than the last one.
      if (first.root === tonic && isMinor(first.suffix) === minor) score += 0.7;
      if (last.root === tonic && isMinor(last.suffix) === minor) score += 0.5;
      if (!best || score > best.score) best = { key: { tonic, minor }, score };
    }
  }
  return best!.key;
}

/** Name for a key, e.g. "B♭ major". */
export function keyLabel(key: Key): string {
  return `${spellKey(key).rootName} ${key.minor ? 'minor' : 'major'}`;
}

function spellKey(key: Key) {
  const scale = key.minor ? SCALES.find((s) => s.name === 'Minor (Aeolian)')! : SCALES[0];
  return spellScale(key.tonic, scale);
}

/**
 * Note names to use in a key: the key's own notes as the key spells them (B♭ in F major),
 * other notes with sharps or flats to match the key.
 */
export function namesForKey(key: Key): string[] {
  const inKey = spellKey(key).names;
  // For the notes outside the key, use the direction of the relative major.
  const major = key.minor ? pitchClass(key.tonic + 3) : key.tonic;
  const outside = spellScale(major).names;
  return inKey.map((name, pc) => name ?? outside[pc]!);
}

/** The chord moved by `semitones`, spelled with `names` (from namesForKey). */
export function transposeChord(chord: ParsedChord, semitones: number, names: string[]): string {
  const root = names[pitchClass(chord.root + semitones)];
  const bass = chord.bass === undefined ? '' : `/${names[pitchClass(chord.bass + semitones)]}`;
  return `${root}${chord.suffix}${bass}`;
}

// Chord shapes most players know as open chords: with the capo on, these are the easy ones.
const EASY_MAJOR = [0, 2, 4, 7, 9]; // C D E G A
const EASY_MINOR = [2, 4, 9]; // Dm Em Am

/** True for a chord that has a common open shape (C, A, G, E, D, Am, Em, Dm and their 7ths). */
export function isEasyShape(root: number, suffix: string): boolean {
  if (!/^(m?7?|maj7|m|7|sus[24]|add9)?$/.test(suffix)) return false;
  return isMinor(suffix) ? EASY_MINOR.includes(root) : EASY_MAJOR.includes(root);
}

export type CapoOption = { capo: number; easy: number; total: number };

/**
 * Capo positions (0-7) ranked by how many of the chords become easy open shapes; with the
 * capo on fret n, each shape is played n semitones below how it sounds.
 */
export function capoOptions(chords: ParsedChord[]): CapoOption[] {
  const options: CapoOption[] = [];
  for (let capo = 0; capo <= 7; capo++) {
    const easy = chords.filter((c) => isEasyShape(pitchClass(c.root - capo), c.suffix)).length;
    options.push({ capo, easy, total: chords.length });
  }
  return options.sort((a, b) => b.easy - a.easy || a.capo - b.capo);
}
