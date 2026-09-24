// The neck game: tasks like "Tap every E" or "Tap the notes of Am", and which cells answer them.

import { CHORD_TYPES } from './chords';
import { cellKey } from './positions';
import { pitchClass, SCALES } from './scales';
import { spellChord, spellScale } from './spelling';

export type NeckTask = {
  prompt: string;
  /** Pitch classes to find. */
  pcs: number[];
  /** Frets the task covers (a chord is found in a small area, notes on the whole neck). */
  fromFret: number;
  toFret: number;
  /** Name for each pitch class in this task, spelled for its key or chord. */
  names: (string | undefined)[];
  /** Shown when the task is done, e.g. "The 5 of D major is A". */
  answer: string;
};

/** Frets the game uses: the first twelve and the open strings, where most playing happens. */
export const GAME_FRETS = 12;

export const NECK_LEVELS = [
  { name: 'Level 1', hint: 'Natural notes' },
  { name: 'Level 2', hint: 'All 12 notes' },
  { name: 'Level 3', hint: 'Degrees 1, 3, 5' },
  { name: 'Level 4', hint: 'All degrees' },
  { name: 'Level 5', hint: 'Chords' },
];

const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
/** Keys for degree tasks: the common ones, so the answers are notes players meet. */
const KEYS = [0, 7, 2, 9, 4, 5, 10, 3]; // C G D A E F B♭ E♭
const MAJOR = SCALES.find((s) => s.name === 'Major (Ionian)')!;
const MINOR = SCALES.find((s) => s.name === 'Minor (Aeolian)')!;
const DEGREE_LABEL: Record<number, string> = {
  0: '1',
  1: '♭2',
  2: '2',
  3: '♭3',
  4: '3',
  5: '4',
  6: '♭5',
  7: '5',
  8: '♭6',
  9: '6',
  10: '♭7',
  11: '7',
};
const CHORD_SYMBOLS = ['', 'm', '7'];

export function makeNeckTask(level: number, random: () => number = Math.random): NeckTask {
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  const whole = { fromFret: 0, toFret: GAME_FRETS };

  if (level <= 1) {
    const pc = level === 0 ? pick(NATURAL) : Math.floor(random() * 12);
    const sharp = SHARP_NAMES[pc];
    const flat = FLAT_NAMES[pc];
    const label = sharp === flat ? sharp : `${sharp} / ${flat}`;
    const names = new Array(12).fill(undefined);
    names[pc] = sharp === flat ? sharp : random() < 0.5 ? sharp : flat;
    return {
      prompt: `Tap every ${label}`,
      pcs: [pc],
      names,
      answer: `All the ${label}s`,
      ...whole,
    };
  }

  if (level <= 3) {
    const minor = level === 3 && random() < 0.5;
    const scale = minor ? MINOR : MAJOR;
    const tonic = pick(KEYS);
    const steps = level === 2 ? [0, 2, 4] : [0, 1, 2, 3, 4, 5, 6];
    const semitones = scale.intervals[pick(steps)];
    const pc = pitchClass(tonic + semitones);
    const spelled = spellScale(tonic, scale);
    const key = `${spelled.rootName} ${minor ? 'minor' : 'major'}`;
    const degree = DEGREE_LABEL[semitones];
    return {
      prompt: `Tap every ${degree} of ${key}`,
      pcs: [pc],
      names: spelled.names,
      answer: `The ${degree} of ${key} is ${spelled.names[pc]}`,
      ...whole,
    };
  }

  // Chords, in a four-fret area somewhere on the neck.
  const root = Math.floor(random() * 12);
  const symbol = pick(CHORD_SYMBOLS);
  const chord = CHORD_TYPES.find((c) => c.symbol === symbol)!;
  const spelled = spellChord(root, chord);
  const pcs = chord.tones.map((t) => pitchClass(root + t.interval));
  const fromFret = pick([0, 2, 4, 5, 7]);
  // "D♭ major" rather than just "D♭", which could be read as a single note.
  const name = `${spelled.rootName}${chord.symbol || ' major'}`;
  return {
    prompt: `Tap every note of ${name} between frets ${fromFret} and ${fromFret + 4}`,
    pcs,
    names: spelled.names,
    answer: `${name} = ${pcs.map((pc) => spelled.names[pc]).join(' ')}`,
    fromFret,
    toFret: fromFret + 4,
  };
}

/** The cells (see `cellKey`) that answer a task on these strings. */
export function targetCells(task: NeckTask, strings: number[]): Set<string> {
  const cells = new Set<string>();
  strings.forEach((open, string) => {
    for (let fret = task.fromFret; fret <= task.toFret; fret++) {
      if (task.pcs.includes(pitchClass(open + fret))) cells.add(cellKey(string, fret));
    }
  });
  return cells;
}

/** Every cell of the task's area, for fading out the rest of the neck. */
export function areaCells(task: NeckTask, strings: number[], frets: number): Set<string> {
  const cells = new Set<string>();
  strings.forEach((_, string) => {
    for (let fret = task.fromFret; fret <= Math.min(task.toFret, frets); fret++) {
      cells.add(cellKey(string, fret));
    }
  });
  return cells;
}
