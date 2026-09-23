import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

import { pitchClass } from '../music/scales';
import { DRONE_LOW, DRONE_SOUNDS } from './droneSounds';

type Options = {
  /** Pitch class of the drone note (0 = C). */
  root: number;
  /** Add the 5th above the root. */
  fifth: boolean;
  /** 0-1. */
  volume: number;
  playing: boolean;
};

/** How long the sound takes to fade in or out, so it never starts or stops with a click. */
const FADE_MS = 250;
const FADE_STEPS = 10;

/**
 * Plays a steady drone: the root (C3–B3) and, if asked, the 5th above it. Changing the key
 * while it plays swaps the notes; stopping or leaving the screen fades it out.
 */
export function useDrone({ root, fifth, volume, playing }: Options) {
  const players = useRef<{ root: AudioPlayer; fifth: AudioPlayer } | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Two looping players, made once and freed when the screen closes.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const made = {
      root: createAudioPlayer(DRONE_SOUNDS[DRONE_LOW]),
      fifth: createAudioPlayer(DRONE_SOUNDS[DRONE_LOW + 7]),
    };
    made.root.loop = true;
    made.fifth.loop = true;
    made.root.volume = 0; // silent until started, then faded in
    made.fifth.volume = 0;
    players.current = made;
    return () => {
      if (fadeTimer.current) clearInterval(fadeTimer.current);
      made.root.remove();
      made.fifth.remove();
      players.current = null;
    };
  }, []);

  // Choose the notes for the key.
  useEffect(() => {
    const p = players.current;
    if (!p) return;
    const rootMidi = DRONE_LOW + pitchClass(root);
    p.root.replace(DRONE_SOUNDS[rootMidi]);
    p.fifth.replace(DRONE_SOUNDS[rootMidi + 7]);
    p.root.loop = true;
    p.fifth.loop = true;
    if (playing) {
      p.root.play();
      if (fifth) p.fifth.play();
    }
    // Only when the key changes; playing and fifth are handled below.
  }, [root]);

  // Start, stop and volume, with a short fade.
  useEffect(() => {
    const p = players.current;
    if (!p) return;
    if (fadeTimer.current) clearInterval(fadeTimer.current);
    const targetRoot = playing ? volume : 0;
    const targetFifth = playing && fifth ? volume * 0.7 : 0; // the 5th a little quieter
    if (targetRoot > 0) p.root.play();
    if (targetFifth > 0) p.fifth.play();
    const fromRoot = p.root.volume;
    const fromFifth = p.fifth.volume;
    let step = 0;
    fadeTimer.current = setInterval(() => {
      step += 1;
      const t = step / FADE_STEPS;
      p.root.volume = fromRoot + (targetRoot - fromRoot) * t;
      p.fifth.volume = fromFifth + (targetFifth - fromFifth) * t;
      if (step >= FADE_STEPS) {
        if (fadeTimer.current) clearInterval(fadeTimer.current);
        if (targetRoot === 0) p.root.pause();
        if (targetFifth === 0) p.fifth.pause();
      }
    }, FADE_MS / FADE_STEPS);
  }, [playing, fifth, volume]);
}
