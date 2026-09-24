import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

import type { IntervalQuestion } from '../music/intervals';
import { PIANO_NOTES } from './pianoNotes';

/** Time between the two notes of an up or down interval. */
const GAP_MS = 850;
/** Players kept loaded: recently heard notes replay at once, and a phone browser allows ~40. */
const CACHE_SIZE = 12;
/** Longest wait for a new note to load before playing anyway. */
const LOAD_WAIT_MS = 1200;

/**
 * Plays the two piano notes of an interval question: one after the other (up or down) or
 * both at once (together). Returns `play(question)`.
 */
export function useIntervalPlayer() {
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

  function play(q: IntervalQuestion) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cache.current.forEach((p) => p.pause());

    const [first, second] = q.direction === 'down' ? [q.high, q.low] : [q.low, q.high];
    const a = playerFor(first);
    const b = playerFor(second);

    const go = () => {
      start(a);
      if (q.direction === 'together') start(b);
      else timers.current.push(setTimeout(() => start(b), GAP_MS));
    };

    // New notes need a moment to load; "together" must start both at the same instant.
    const began = Date.now();
    const waitForLoad = () => {
      if ((a.isLoaded && b.isLoaded) || Date.now() - began > LOAD_WAIT_MS) go();
      else timers.current.push(setTimeout(waitForLoad, 30));
    };
    waitForLoad();
  }

  return { play };
}
