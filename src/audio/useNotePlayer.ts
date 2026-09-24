import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

import { PIANO_NOTES } from './pianoNotes';

/** Players kept loaded: recently heard notes replay at once, and a phone browser allows ~40. */
const CACHE_SIZE = 16;
/** Longest wait for a new note to load before playing anyway. */
const LOAD_WAIT_MS = 1200;

/** Notes that start together, `at` milliseconds after the start. */
export type NoteStep = { notes: number[]; at: number };

/**
 * Plays piano notes for ear training. `playSteps` plays a timed list of chords or notes (e.g.
 * a cadence and then a note); `play(notes, gapMs)` is the simple case: one after another with
 * `gapMs` between them, or all together when the gap is 0.
 */
export function useNotePlayer() {
  // Loaded players by MIDI note, oldest first (a Map remembers the order things were added).
  const cache = useRef(new Map<number, AudioPlayer>());
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

  function playerFor(midi: number): AudioPlayer {
    const players = cache.current;
    let player = players.get(midi);
    if (player) {
      players.delete(midi); // moved to the end: most recently used
    } else {
      player = createAudioPlayer(PIANO_NOTES[midi]);
      if (players.size >= CACHE_SIZE) {
        const [oldestMidi, oldest] = players.entries().next().value!;
        oldest.remove();
        players.delete(oldestMidi);
      }
    }
    players.set(midi, player);
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
    const needed = [...new Set(steps.flatMap((s) => s.notes))];
    const players = new Map(needed.map((midi) => [midi, playerFor(midi)]));
    const go = () =>
      steps.forEach((step) => {
        const startStep = () => step.notes.forEach((midi) => start(players.get(midi)!));
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
