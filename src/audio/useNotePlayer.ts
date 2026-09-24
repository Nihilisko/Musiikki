import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

import { PIANO_NOTES } from './pianoNotes';

/** Players kept loaded: recently heard notes replay at once, and a phone browser allows ~40. */
const CACHE_SIZE = 12;
/** Longest wait for a new note to load before playing anyway. */
const LOAD_WAIT_MS = 1200;

/**
 * Plays piano notes for ear training: all at once (a chord, or an interval "together") or one
 * after another with `gapMs` between them (an interval up or down, a broken chord).
 * Returns `play(notes, gapMs)`; a gap of 0 plays them together.
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

  function play(notes: number[], gapMs: number) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cache.current.forEach((p) => p.pause());

    const players = notes.map(playerFor);
    const go = () =>
      players.forEach((p, i) => {
        if (i === 0 || gapMs === 0) start(p);
        else timers.current.push(setTimeout(() => start(p), i * gapMs));
      });

    // New notes need a moment to load; notes played together must start at the same instant.
    const began = Date.now();
    const waitForLoad = () => {
      if (players.every((p) => p.isLoaded) || Date.now() - began > LOAD_WAIT_MS) go();
      else timers.current.push(setTimeout(waitForLoad, 30));
    };
    waitForLoad();
  }

  return { play };
}
