// Backing track rules with no sound: drum grooves, the piano's rhythm, chord voicings and the
// bar-by-bar form of a progression.

import type { ChordType } from './chords';
import { pitchClass } from './scales';

export type Drum = 'kick' | 'snare' | 'hat' | 'hatOpen' | 'ride' | 'rim';

/** One hit: which step of the bar, and how loud (0-1). */
export type Hit = { step: number; volume: number };

export type Groove = {
  id: string;
  name: string;
  /**
   * Every bar has 8 steps: each beat and the "and" after it. `swing` says where in the beat
   * the "and" lands: 0.5 = straight eighths (rock, pop), 0.67 = full triplet swing. A little
   * less than full triplets (about 0.6) sounds relaxed instead of heavy.
   */
  swing: number;
  drums: Partial<Record<Drum, Hit[]>>;
  /** When the piano plays the chord. */
  piano: Hit[];
  /** Tempo the groove sounds best at. */
  defaultBpm: number;
};

/** Steps in a 4/4 bar: each beat and its "and". */
export const STEPS_PER_BAR = 8;

const hits = (volume: number, ...steps: number[]): Hit[] => steps.map((step) => ({ step, volume }));

// Step numbers: 0 = beat 1, 1 = "and", 2 = beat 2, 3 = "and", 4 = beat 3 ...
export const GROOVES: Groove[] = [
  {
    id: 'rock',
    name: 'Rock',
    swing: 0.5,
    drums: {
      kick: hits(0.9, 0, 4, 5),
      snare: hits(0.7, 2, 6),
      hat: [...hits(0.45, 0, 2, 4, 6), ...hits(0.3, 1, 3, 5, 7)],
    },
    piano: hits(0.45, 0, 4),
    defaultBpm: 110,
  },
  {
    id: 'shuffle',
    name: 'Blues shuffle',
    swing: 0.62,
    drums: {
      kick: hits(0.85, 0, 4),
      snare: hits(0.7, 2, 6),
      hat: [...hits(0.45, 0, 2, 4, 6), ...hits(0.28, 1, 3, 5, 7)],
    },
    piano: [...hits(0.45, 0), ...hits(0.32, 3)], // beat 1 and the "and" of 2
    defaultBpm: 95,
  },
  {
    id: 'pop',
    name: 'Pop / ballad',
    swing: 0.5,
    drums: {
      kick: hits(0.8, 0, 3, 4),
      rim: hits(0.5, 2, 6),
      hat: [...hits(0.35, 0, 2, 4, 6), ...hits(0.22, 1, 3, 5, 7)],
    },
    piano: [...hits(0.45, 0), ...hits(0.3, 4)],
    defaultBpm: 84,
  },
  {
    id: 'swing',
    name: 'Jazz swing',
    swing: 0.64,
    drums: {
      ride: [...hits(0.5, 0, 2, 4, 6), ...hits(0.35, 3, 7)], // "ding, ding-a ding, ding-a"
      hat: hits(0.35, 2, 6), // the foot hi-hat on 2 and 4
      kick: hits(0.25, 0, 2, 4, 6), // "feathered": felt more than heard
      rim: hits(0.3, 7),
    },
    piano: [...hits(0.45, 0), ...hits(0.35, 3)], // the Charleston rhythm: 1 and the "and" of 2
    defaultBpm: 140,
  },
];

/** How long a step lasts: the beat is split at the swing point. */
export function stepLength(step: number, beatMs: number, swing: number): number {
  return (step % 2 === 0 ? swing : 1 - swing) * beatMs;
}

export function grooveById(id: string): Groove {
  return GROOVES.find((g) => g.id === id) ?? GROOVES[0];
}

const NOTE_FILE_NAMES = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b'];
const CHORD_FILE_NAMES: Record<string, string> = {
  '': 'maj',
  m: 'min',
  '7': '7',
  m7: 'm7',
  maj7: 'maj7',
  'm7♭5': 'm7b5',
};

/**
 * Name of the piano sound for a chord, e.g. "a-7" for A7. Every chord is one ready-made
 * sound file (see scripts/generate_backing_sounds.py), so a chord hit needs only one player.
 */
export function chordSoundName(root: number, chord: ChordType): string {
  return `${NOTE_FILE_NAMES[pitchClass(root)]}-${CHORD_FILE_NAMES[chord.symbol] ?? 'maj'}`;
}
