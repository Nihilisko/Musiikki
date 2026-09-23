import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { beatInterval, rampedBpm, type Accent, type TempoRamp } from '../music/metronome';

const SOUNDS = {
  accent: require('../../assets/sounds/click-accent.wav'),
  beat: require('../../assets/sounds/click-beat.wav'),
  sub: require('../../assets/sounds/click-sub.wav'),
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
  /** Clicks per beat: 1 = beats only, 2 = eighths, 3 = triplets, 4 = sixteenths. */
  subdivision: number;
  /** Speed trainer, or null when it is off. */
  ramp: TempoRamp | null;
  /** Called when the speed trainer raises the tempo, so the screen can show it. */
  onTempoChange: (bpm: number) => void;
};

/**
 * Plays the clicks. Returns whether it is running, a start/stop switch and the beat that
 * is sounding now (0 = first beat of the bar, -1 = stopped), for the beat lights.
 */
export function useMetronome({ bpm, accents, subdivision, ramp, onTempoChange }: Options) {
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);

  // The latest settings, read by the timer on every click, so tempo changes apply at once
  // without restarting.
  const settings = useRef({ bpm, accents, subdivision, ramp, onTempoChange });
  settings.current = { bpm, accents, subdivision, ramp, onTempoChange };

  const players = useRef<Record<Sound, AudioPlayer[]> | null>(null);
  const nextPlayer = useRef<Record<Sound, number>>({ accent: 0, beat: 0, sub: 0 });

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

  function click(sound: Sound, volume: number) {
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
    let beatIndex = 0; // beats since the start
    let subIndex = 0; // click within the current beat
    let bars = 0; // whole bars played, for the speed trainer
    let tempo = settings.current.bpm;
    let nextTime = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const current = settings.current;
      const pattern = current.accents;
      const clicksPerBeat = current.subdivision;
      if (subIndex >= clicksPerBeat) subIndex = 0; // the subdivision was just made smaller
      const index = beatIndex % pattern.length;

      if (subIndex === 0) {
        // A new bar: the speed trainer may raise the tempo before its first beat.
        if (index === 0 && beatIndex > 0) {
          bars += 1;
          if (current.ramp && bars % current.ramp.everyBars === 0) {
            const raised = rampedBpm(current.bpm, current.ramp);
            if (raised !== current.bpm) {
              current.onTempoChange(raised);
              current.bpm = raised; // used for the rest of this bar, before the screen re-renders
            }
            tempo = raised;
          } else {
            tempo = current.bpm;
          }
        } else {
          tempo = current.bpm;
        }
        const { sound, volume } = ACCENT_SOUND[pattern[index]];
        click(sound, volume);
        setBeat(index);
      } else {
        click('sub', 0.7);
      }

      subIndex += 1;
      if (subIndex >= clicksPerBeat) {
        subIndex = 0;
        beatIndex = index + 1;
      }
      nextTime += beatInterval(tempo) / clicksPerBeat;
      timer = setTimeout(tick, Math.max(0, nextTime - Date.now()));
    }

    tick();
    return () => clearTimeout(timer);
  }, [running]);

  return { running, beat, toggle: () => setRunning((r) => !r) };
}
