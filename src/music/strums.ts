// Strumming patterns to play along with the backing grooves. A bar has 8 steps, each beat
// and its "and" (the same grid as the grooves), so a shuffle or swing groove swings the
// pattern too. The hand keeps moving down on the beats and up on the "ands" even when it
// doesn't hit the strings: that is why downs are always on even steps and ups on odd steps.

export type Stroke = 'down' | 'up' | null;

export type StrumPattern = {
  id: string;
  name: string;
  level: 'Easy' | 'Medium' | 'Harder';
  /** One entry per step: 1 & 2 & 3 & 4 & */
  strokes: Stroke[];
  tip: string;
};

const D = 'down';
const U = 'up';
const _ = null;

export const STRUM_PATTERNS: StrumPattern[] = [
  {
    id: 'quarters',
    name: 'Four downs',
    level: 'Easy',
    strokes: [D, _, D, _, D, _, D, _],
    tip: 'One down strum on every beat. Get the chord changes clean first.',
  },
  {
    id: 'eighths',
    name: 'Down-up eighths',
    level: 'Medium',
    strokes: [D, U, D, U, D, U, D, U],
    tip: 'Down on the beat, up on the "and". Keep the wrist loose.',
  },
  {
    id: 'rock',
    name: 'Rock drive',
    level: 'Medium',
    strokes: [D, _, D, U, D, _, D, U],
    tip: 'Hit the downs on 2 and 4 a little harder, with the snare.',
  },
  {
    id: 'island',
    name: 'Island strum',
    level: 'Medium',
    strokes: [D, _, D, U, _, U, D, U],
    tip: 'Down, down-up, up-down-up. Miss the strings on beat 3 but keep the hand moving.',
  },
  {
    id: 'ballad',
    name: 'Ballad',
    level: 'Easy',
    strokes: [D, _, _, U, _, U, D, U],
    tip: 'Let the first down ring, then a soft up-up-down-up.',
  },
  {
    id: 'shuffle',
    name: 'Shuffle down-up',
    level: 'Medium',
    strokes: [D, U, D, U, D, U, D, U],
    tip: 'Long down, short up: the backing swings it for you. Listen to the hi-hat.',
  },
  {
    id: 'blues',
    name: 'Blues stabs',
    level: 'Harder',
    strokes: [D, _, D, U, _, U, D, _],
    tip: 'Short, choked strums: lift the fretting hand a little right after each one.',
  },
  {
    id: 'four-to-floor',
    name: 'Jazz quarters',
    level: 'Easy',
    strokes: [D, _, D, _, D, _, D, _],
    tip: 'Short, even downs on every beat, like a big-band rhythm guitar.',
  },
  {
    id: 'charleston',
    name: 'Charleston',
    level: 'Harder',
    strokes: [D, _, _, U, _, _, _, _],
    tip: 'Beat 1 and the "and" of 2, both short. Same rhythm as the piano.',
  },
];

/** Patterns that suit each groove, the default first. */
const GROOVE_PATTERNS: Record<string, string[]> = {
  rock: ['rock', 'quarters', 'eighths', 'island'],
  shuffle: ['shuffle', 'quarters', 'blues'],
  pop: ['island', 'quarters', 'ballad', 'eighths'],
  swing: ['four-to-floor', 'charleston', 'quarters'],
};

export function patternsForGroove(grooveId: string): StrumPattern[] {
  const ids = GROOVE_PATTERNS[grooveId] ?? ['quarters'];
  return ids.map((id) => STRUM_PATTERNS.find((p) => p.id === id)!);
}

/** Counting under each step. */
export const STEP_COUNTS = ['1', '&', '2', '&', '3', '&', '4', '&'];
