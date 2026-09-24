import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

import { BASS_SOUNDS } from './bassSounds';
import { PIANO_NOTES } from './pianoNotes';

/** Players kept loaded: recently heard notes replay at once, and a phone browser allows ~40. */
const CACHE_SIZE = 20;
/** Longest wait for a new note to load before playing anyway. */
const LOAD_WAIT_MS = 1200;

/** How long the notes of the previous step take to die away when a damping step starts. */
const DAMP_MS = 150;

/** Notes that start together, `at` milliseconds after the start. */
export type NoteStep = {
  /** Piano notes (MIDI). */
  notes: number[];
  /** Bass notes (MIDI), for chord progressions. */
  bass?: number[];
  at: number;
  /** Quiet the previous step's notes, like a pianist lifting the keys for the next chord. */
  damp?: boolean;
};

const keysOf = (step: NoteStep) => [
  ...step.notes.map((m) => `piano:${m}`),
  ...(step.bass ?? []).map((m) => `bass:${m}`),
];

/**
 * Plays piano notes for ear training. `playSteps` plays a timed list of chords or notes (e.g.
 * a cadence and then a note); `play(notes, gapMs)` is the simple case: one after another with
 * `gapMs` between them, or all together when the gap is 0.
 */
export function useNotePlayer() {
  // Loaded players by sound ("piano:60", "bass:33"), oldest first (a Map remembers the order
  // things were added).
  const cache = useRef(new Map<string, AudioPlayer>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const players = cache.current;
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      players.forEach((p) => p.remove());
      players.clear();
    };
  }, []);

  function playerFor(key: string): AudioPlayer {
    const players = cache.current;
    let player = players.get(key);
    if (player) {
      players.delete(key); // moved to the end: most recently used
    } else {
      const [kind, midi] = key.split(':');
      player = createAudioPlayer((kind === 'bass' ? BASS_SOUNDS : PIANO_NOTES)[Number(midi)]);
      if (players.size >= CACHE_SIZE) {
        const [oldestKey, oldest] = players.entries().next().value!;
        oldest.remove();
        players.delete(oldestKey);
      }
    }
    players.set(key, player);
    return player;
  }

  function start(player: AudioPlayer) {
    player.volume = 0.9;
    player.seekTo(0);
    player.play();
  }

  function playSteps(steps: NoteStep[]) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cache.current.forEach((p) => p.pause());

    // Several steps can share a note (a chord that comes back): each gets its own start.
    const needed = [...new Set(steps.flatMap(keysOf))];
    const players = new Map(needed.map((key) => [key, playerFor(key)]));
    const go = () =>
      steps.forEach((step, i) => {
        const startStep = () => {
          const keys = keysOf(step);
          if (step.damp && i > 0) {
            // Soften the last step's notes at once and stop them a moment later.
            const old = keysOf(steps[i - 1])
              .filter((k) => !keys.includes(k))
              .map((k) => players.get(k)!);
            old.forEach((p) => (p.volume = 0.3));
            timers.current.push(setTimeout(() => old.forEach((p) => p.pause()), DAMP_MS));
          }
          keys.forEach((key) => start(players.get(key)!));
        };
        if (step.at === 0) startStep();
        else timers.current.push(setTimeout(startStep, step.at));
      });

    // New notes need a moment to load; notes played together must start at the same instant.
    const began = Date.now();
    const waitForLoad = () => {
      if ([...players.values()].every((p) => p.isLoaded) || Date.now() - began > LOAD_WAIT_MS) {
        go();
      } else {
        timers.current.push(setTimeout(waitForLoad, 30));
      }
    };
    waitForLoad();
  }

  function play(notes: number[], gapMs: number) {
    playSteps(
      gapMs === 0 ? [{ notes, at: 0 }] : notes.map((midi, i) => ({ notes: [midi], at: i * gapMs })),
    );
  }

  return { play, playSteps };
}
