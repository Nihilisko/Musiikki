import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { beatInterval, type Accent } from '../music/metronome';

const SOUNDS = {
  accent: require('../../assets/sounds/click-accent.wav'),
  beat: require('../../assets/sounds/click-beat.wav'),
};
type Sound = keyof typeof SOUNDS;

/** A few players per sound, used in turn, so a click can start before the last one has ended. */
const PLAYERS_PER_SOUND = 3;

/** Which sound and volume each accent uses. */
const ACCENT_SOUND: Record<Accent, { sound: Sound; volume: number }> = {
  strong: { sound: 'accent', volume: 1 },
  medium: { sound: 'accent', volume: 0.55 },
  weak: { sound: 'beat', volume: 0.8 },
};

type Options = {
  bpm: number;
  accents: Accent[];
};

/**
 * Plays the clicks. Returns whether it is running, a start/stop switch and the beat that
 * is sounding now (0 = first beat of the bar, -1 = stopped), for the beat lights.
 */
export function useMetronome({ bpm, accents }: Options) {
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);

  // The latest settings, read by the timer on every click, so tempo changes apply at once
  // without restarting.
  const settings = useRef({ bpm, accents });
  settings.current = { bpm, accents };

  const players = useRef<Record<Sound, AudioPlayer[]> | null>(null);
  const nextPlayer = useRef<Record<Sound, number>>({ accent: 0, beat: 0 });

  // Load the sounds once, and free them when the screen closes.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const loaded = {} as Record<Sound, AudioPlayer[]>;
    for (const sound of Object.keys(SOUNDS) as Sound[]) {
      loaded[sound] = Array.from({ length: PLAYERS_PER_SOUND }, () =>
        createAudioPlayer(SOUNDS[sound]),
      );
    }
    players.current = loaded;
    return () => {
      Object.values(loaded)
        .flat()
        .forEach((p) => p.remove());
      players.current = null;
    };
  }, []);

  function click(accent: Accent) {
    const { sound, volume } = ACCENT_SOUND[accent];
    const pool = players.current?.[sound];
    if (!pool) return;
    const index = nextPlayer.current[sound];
    nextPlayer.current[sound] = (index + 1) % pool.length;
    const player = pool[index];
    player.volume = volume;
    player.seekTo(0);
    player.play();
  }

  // The timer. Each click is aimed at an exact time, and the next one is counted from that
  // time, not from when the timer actually fired, so small delays never add up.
  useEffect(() => {
    if (!running) {
      setBeat(-1);
      return;
    }
    let beatIndex = 0;
    let nextTime = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const { bpm: tempo, accents: pattern } = settings.current;
      const index = beatIndex % pattern.length;
      click(pattern[index]);
      setBeat(index);
      beatIndex = index + 1;
      nextTime += beatInterval(tempo);
      timer = setTimeout(tick, Math.max(0, nextTime - Date.now()));
    }

    tick();
    return () => clearTimeout(timer);
  }, [running]);

  return { running, beat, toggle: () => setRunning((r) => !r) };
}
