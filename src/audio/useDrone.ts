import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

import { pitchClass } from '../music/scales';
import { DRONE_LOOP_MS, DRONE_LOW, DRONE_SOUNDS } from './droneSounds';

type Options = {
  /** Pitch class of the drone note (0 = C). */
  root: number;
  /** Add the 5th above the root. */
  fifth: boolean;
  /** 0-1. */
  volume: number;
  playing: boolean;
};

/** Quick fade when stopping, so the sound never ends with a click. */
const STOP_FADE_MS = 200;

/** Two players per note (versions a and b), started in turn. */
type Voice = [AudioPlayer, AudioPlayer];

function makeVoice(midi: number): Voice {
  const [a, b] = DRONE_SOUNDS[midi];
  return [createAudioPlayer(a), createAudioPlayer(b)];
}

/**
 * Plays a steady drone: the root (C3–B3) and, if asked, the 5th above it. The files fade in
 * and out by themselves, so starting the next one before the last ends gives an unbroken
 * sound. Changing the key restarts it on the new notes; stopping or leaving fades it out.
 */
export function useDrone({ root, fifth, volume, playing }: Options) {
  // Latest settings, read when each new version starts.
  const settings = useRef({ fifth, volume });
  settings.current = { fifth, volume };
  const voices = useRef<{ root: Voice; fifth: Voice } | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // Volume and the 5th switch apply straight away to what is playing.
  useEffect(() => {
    const v = voices.current;
    if (!v) return;
    v.root.forEach((p) => (p.volume = volume));
    v.fifth.forEach((p) => (p.volume = fifth ? volume * 0.7 : 0));
  }, [volume, fifth]);

  useEffect(() => {
    if (!playing) return;
    const rootMidi = DRONE_LOW + pitchClass(root);
    const made = { root: makeVoice(rootMidi), fifth: makeVoice(rootMidi + 7) };
    voices.current = made;

    // Start version a, then b, then a… every DRONE_LOOP_MS. Each start is aimed at an exact
    // time counted from the previous one, like the metronome, so delays don't add up.
    let turn = 0;
    let next = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const start = () => {
      const { fifth: withFifth, volume: vol } = settings.current;
      const r = made.root[turn % 2];
      const f = made.fifth[turn % 2];
      r.volume = vol;
      f.volume = withFifth ? vol * 0.7 : 0; // the 5th a little quieter
      r.seekTo(0);
      f.seekTo(0);
      r.play();
      f.play();
      turn += 1;
      next += DRONE_LOOP_MS;
      timer = setTimeout(start, Math.max(0, next - Date.now()));
    };
    start();

    return () => {
      clearTimeout(timer);
      voices.current = null;
      // Fade out, then free the players.
      const all = [...made.root, ...made.fifth];
      const from = all.map((p) => p.volume);
      const steps = 8;
      let step = 0;
      const fade = setInterval(() => {
        step += 1;
        all.forEach((p, i) => (p.volume = from[i] * (1 - step / steps)));
        if (step >= steps) {
          clearInterval(fade);
          all.forEach((p) => p.remove());
        }
      }, STOP_FADE_MS / steps);
    };
  }, [playing, root]);
}
