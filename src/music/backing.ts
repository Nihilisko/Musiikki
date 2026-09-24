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
   * Steps per beat: 2 = straight eighths, 3 = triplets. Shuffle and swing use triplets and
   * leave out the middle one, which gives the long-short "swing" feel.
   */
  stepsPerBeat: number;
  drums: Partial<Record<Drum, Hit[]>>;
  /** When the piano plays the chord. */
  piano: Hit[];
  /** Tempo the groove sounds best at. */
  defaultBpm: number;
};

const hits = (volume: number, ...steps: number[]): Hit[] => steps.map((step) => ({ step, volume }));

export const GROOVES: Groove[] = [
  {
    id: 'rock',
    name: 'Rock',
    stepsPerBeat: 2, // 8 steps in a 4/4 bar
    drums: {
      kick: hits(0.9, 0, 4, 5),
      snare: hits(0.7, 2, 6),
      hat: [...hits(0.45, 0, 2, 4, 6), ...hits(0.3, 1, 3, 5, 7)],
    },
    piano: [...hits(0.55, 0, 4), ...hits(0.4, 3, 7)],
    defaultBpm: 110,
  },
  {
    id: 'shuffle',
    name: 'Blues shuffle',
    stepsPerBeat: 3, // 12 triplet steps in a bar
    drums: {
      kick: hits(0.85, 0, 6),
      snare: hits(0.7, 3, 9),
      hat: [...hits(0.45, 0, 3, 6, 9), ...hits(0.3, 2, 5, 8, 11)],
    },
    piano: [...hits(0.5, 0, 6), ...hits(0.4, 2, 5, 8, 11)],
    defaultBpm: 95,
  },
  {
    id: 'pop',
    name: 'Pop / ballad',
    stepsPerBeat: 2,
    drums: {
      kick: hits(0.8, 0, 3, 4),
      rim: hits(0.5, 2, 6),
      hat: [...hits(0.35, 0, 2, 4, 6), ...hits(0.22, 1, 3, 5, 7)],
    },
    piano: hits(0.5, 0, 4),
    defaultBpm: 84,
  },
  {
    id: 'swing',
    name: 'Jazz swing',
    stepsPerBeat: 3,
    drums: {
      ride: [...hits(0.5, 0, 3, 6, 9), ...hits(0.35, 5, 11)],
      hat: hits(0.35, 3, 9), // the foot hi-hat on 2 and 4
      kick: hits(0.25, 0, 3, 6, 9), // "feathered": felt more than heard
      rim: hits(0.3, 11),
    },
    piano: [...hits(0.5, 0), ...hits(0.45, 5)], // the Charleston rhythm: 1 and the "and" of 2
    defaultBpm: 140,
  },
];

export function grooveById(id: string): Groove {
  return GROOVES.find((g) => g.id === id) ?? GROOVES[0];
}

/** Lowest and highest piano notes there are sounds for (C3 and C5). */
export const PIANO_LOW = 48;
export const PIANO_HIGH = 72;

/**
 * Piano notes for a chord: the root low (C3–B3) for the left hand, and the other chord
 * notes (plus the root if there is room) above middle C for the right hand.
 */
export function pianoVoicing(root: number, chord: ChordType): number[] {
  const bass = PIANO_LOW + pitchClass(root);
  const upper = chord.tones
    .filter((t) => t.interval !== 0 || chord.tones.length === 3)
    .map((t) => {
      let note = 60 + pitchClass(root + t.interval); // C4 upwards
      if (note > PIANO_HIGH) note -= 12;
      return note;
    });
  return [bass, ...new Set(upper)].sort((a, b) => a - b);
}
