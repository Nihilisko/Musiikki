import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { STEPS_PER_BAR, stepLength, type Drum, type Groove } from '../music/backing';
import { beatInterval } from '../music/metronome';
import { CHORD_SOUNDS } from './chordSounds';

const DRUM_SOUNDS: Record<Drum, number> = {
  kick: require('../../assets/sounds/drums/kick.wav'),
  snare: require('../../assets/sounds/drums/snare.wav'),
  hat: require('../../assets/sounds/drums/hat.wav'),
  hatOpen: require('../../assets/sounds/drums/hat-open.wav'),
  ride: require('../../assets/sounds/drums/ride.wav'),
  rim: require('../../assets/sounds/drums/rim.wav'),
};

// Two players per sound: a new hit can start while the last one still rings. Only the chords
// of the chosen progression are loaded, so there are at most about 20 players: a phone
// browser refuses to load more than about 40 sounds at once.
const PLAYERS_PER_SOUND = 2;
/** Clicks before the band comes in, so you can get ready. */
const COUNT_IN_BEATS = 4;

/** `fading` is the timer of a soft fade-out that is going on, if any. */
type Pool = { players: AudioPlayer[]; next: number; fading?: ReturnType<typeof setTimeout> };

/** How long a chord takes to fade out when the next chord comes. */
const FADE_MS = 250;
const FADE_STEPS = 5;

function makePool(source: number): Pool {
  return {
    players: Array.from({ length: PLAYERS_PER_SOUND }, () => createAudioPlayer(source)),
    next: 0,
  };
}

/**
 * Phone browsers only let a sound play later if it was first started by a tap. So on the web,
 * start every player silently and stop it at once while the tap is still going on.
 */
function unlockPool(pool: Pool) {
  if (Platform.OS !== 'web') return;
  pool.players.forEach((p) => {
    p.volume = 0;
    p.play();
    p.pause();
  });
}

function removePool(pool: Pool) {
  clearTimeout(pool.fading);
  pool.players.forEach((p) => p.remove());
}

type Options = {
  groove: Groove;
  bpm: number;
  /** The piano chord sound of every bar of the form (see chordSoundName), e.g. 12 bars. */
  bars: string[];
  /** 0-1 */
  pianoVolume: number;
  drumVolume: number;
};

/**
 * Plays a groove and the chords, one bar at a time, round and round. Returns whether it is
 * running, a start/stop switch, the bar playing now (-1 = count-in or stopped) and the beat.
 */
export function useBacking({ groove, bpm, bars, pianoVolume, drumVolume }: Options) {
  const [running, setRunning] = useState(false);
  const [position, setPosition] = useState({ bar: -1, beat: -1 });

  // The latest settings, read on every step, so changes apply without restarting.
  const settings = useRef({ groove, bpm, bars, pianoVolume, drumVolume });
  settings.current = { groove, bpm, bars, pianoVolume, drumVolume };

  const drums = useRef<Record<Drum, Pool> | null>(null);
  const chords = useRef<Record<string, Pool>>({});

  // Load the drums once, and free everything when the screen closes.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const loaded = {} as Record<Drum, Pool>;
    for (const drum of Object.keys(DRUM_SOUNDS) as Drum[]) {
      loaded[drum] = makePool(DRUM_SOUNDS[drum]);
    }
    drums.current = loaded;
    const chordPools = chords.current;
    return () => {
      Object.values(loaded).forEach(removePool);
      Object.values(chordPools).forEach(removePool);
      drums.current = null;
    };
  }, []);

  // Load the chords of the progression; free the ones it no longer uses.
  const chordList = [...new Set(bars)].sort().join(' ');
  useEffect(() => {
    const wanted = chordList.split(' ');
    const pools = chords.current;
    for (const name of Object.keys(pools)) {
      if (!wanted.includes(name)) {
        removePool(pools[name]);
        delete pools[name];
      }
    }
    for (const name of wanted) {
      if (!pools[name] && CHORD_SOUNDS[name]) {
        pools[name] = makePool(CHORD_SOUNDS[name]);
        unlockPool(pools[name]); // right after a tap on a key or progression
      }
    }
  }, [chordList]);

  function play(pool: Pool | undefined, volume: number) {
    if (!pool) return;
    clearTimeout(pool.fading); // the chord came back before its fade-out ended
    pool.fading = undefined;
    const player = pool.players[pool.next];
    pool.next = (pool.next + 1) % pool.players.length;
    player.volume = volume;
    player.seekTo(0);
    player.play();
  }

  /** Lift the keys of a chord: fade it out quickly, then stop it, so the room tail stays soft. */
  function damp(name: string) {
    const pool = chords.current[name];
    if (!pool) return;
    clearTimeout(pool.fading);
    const start = pool.players.map((p) => p.volume);
    let stepIndex = 0;
    const fadeStep = () => {
      stepIndex += 1;
      const left = 1 - stepIndex / FADE_STEPS;
      pool.players.forEach((p, i) => {
        if (left <= 0) p.pause();
        else p.volume = start[i] * left;
      });
      pool.fading = left > 0 ? setTimeout(fadeStep, FADE_MS / FADE_STEPS) : undefined;
    };
    fadeStep();
  }

  // The timer: every step is aimed at an exact time counted from the previous target, like
  // the metronome, so small delays never add up.
  useEffect(() => {
    if (!running) {
      setPosition({ bar: -1, beat: -1 });
      return;
    }
    let countIn = COUNT_IN_BEATS;
    let bar = 0;
    let step = 0;
    let lastChord = ''; // damped when the chord changes
    let nextTime = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const {
        groove: g,
        bpm: tempo,
        bars: form,
        pianoVolume: pv,
        drumVolume: dv,
      } = settings.current;
      const beatMs = beatInterval(tempo);

      if (countIn > 0) {
        // Count-in: a rim click on every beat, the first one louder.
        play(drums.current?.rim, (countIn === COUNT_IN_BEATS ? 0.8 : 0.55) * dv);
        setPosition({ bar: -1, beat: COUNT_IN_BEATS - countIn });
        countIn -= 1;
        nextTime += beatMs;
        timer = setTimeout(tick, Math.max(0, nextTime - Date.now()));
        return;
      }

      if (bar >= form.length) bar = 0; // the progression changed to a shorter one

      if (step % 2 === 0) setPosition({ bar, beat: step / 2 });

      for (const [drum, hits] of Object.entries(g.drums) as [Drum, typeof g.piano][]) {
        const hit = hits.find((h) => h.step === step);
        if (hit) play(drums.current?.[drum], hit.volume * dv);
      }

      const pianoHit = g.piano.find((h) => h.step === step);
      if (pianoHit) {
        const chord = form[bar];
        // A new chord: lift the old one's keys, like a pianist would.
        if (lastChord && lastChord !== chord) damp(lastChord);
        play(chords.current[chord], pianoHit.volume * pv);
        lastChord = chord;
      }

      nextTime += stepLength(step, beatMs, g.swing);
      step += 1;
      if (step >= STEPS_PER_BAR) {
        step = 0;
        bar = (bar + 1) % form.length;
      }
      timer = setTimeout(tick, Math.max(0, nextTime - Date.now()));
    }

    tick();
    return () => {
      clearTimeout(timer);
      if (lastChord) damp(lastChord);
    };
  }, [running]);

  function toggle() {
    if (!running) {
      // Called straight from the Play tap, so the browser lets these sounds play later too.
      Object.values(drums.current ?? {}).forEach(unlockPool);
      Object.values(chords.current).forEach(unlockPool);
    }
    setRunning((r) => !r);
  }

  return { running, ...position, toggle };
}
