import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

/** How long the chime rings, in milliseconds. */
export const CHIME_MS = 380;

/** A short bell sound, e.g. for "in tune". Returns a function that plays it. */
export function useChime() {
  const player = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const p = createAudioPlayer(require('../../assets/sounds/chime.wav'));
    player.current = p;
    return () => {
      p.remove();
      player.current = null;
    };
  }, []);

  return function play() {
    const p = player.current;
    if (!p) return;
    p.seekTo(0);
    p.play();
  };
}
