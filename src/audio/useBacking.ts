import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { PIANO_HIGH, PIANO_LOW, type Drum, type Groove } from '../music/backing';
import { beatInterval } from '../music/metronome';

// Piano notes are named like the files: c3, cs3 (C♯3) ... c5.
const PIANO_SOUNDS: Record<number, number> = {
  48: require('../../assets/sounds/piano/c3.wav'),
  49: require('../../assets/sounds/piano/cs3.wav'),
  50: require('../../assets/sounds/piano/d3.wav'),
  51: require('../../assets/sounds/piano/ds3.wav'),
  52: require('../../assets/sounds/piano/e3.wav'),
  53: require('../../assets/sounds/piano/f3.wav'),
  54: require('../../assets/sounds/piano/fs3.wav'),
  55: require('../../assets/sounds/piano/g3.wav'),
  56: require('../../assets/sounds/piano/gs3.wav'),
  57: require('../../assets/sounds/piano/a3.wav'),
  58: require('../../assets/sounds/piano/as3.wav'),
  59: require('../../assets/sounds/piano/b3.wav'),
  60: require('../../assets/sounds/piano/c4.wav'),
  61: require('../../assets/sounds/piano/cs4.wav'),
  62: require('../../assets/sounds/piano/d4.wav'),
  63: require('../../assets/sounds/piano/ds4.wav'),
  64: require('../../assets/sounds/piano/e4.wav'),
  65: require('../../assets/sounds/piano/f4.wav'),
  66: require('../../assets/sounds/piano/fs4.wav'),
  67: require('../../assets/sounds/piano/g4.wav'),
  68: require('../../assets/sounds/piano/gs4.wav'),
  69: require('../../assets/sounds/piano/a4.wav'),
  70: require('../../assets/sounds/piano/as4.wav'),
  71: require('../../assets/sounds/piano/b4.wav'),
  72: require('../../assets/sounds/piano/c5.wav'),
};

const DRUM_SOUNDS: Record<Drum, number> = {
  kick: require('../../assets/sounds/drums/kick.wav'),
  snare: require('../../assets/sounds/drums/snare.wav'),
  hat: require('../../assets/sounds/drums/hat.wav'),
  hatOpen: require('../../assets/sounds/drums/hat-open.wav'),
  ride: require('../../assets/sounds/drums/ride.wav'),
  rim: require('../../assets/sounds/drums/rim.wav'),
};

/** Two players per piano note (a new hit can start while the last one rings), three per drum. */
const PLAYERS_PER_NOTE = 2;
const PLAYERS_PER_DRUM = 3;
const BEATS_PER_BAR = 4;
/** Clicks before the band comes in, so you can get ready. */
const COUNT_IN_BEATS = 4;

type Pool = { players: AudioPlayer[]; next: number };

type Options = {
  groove: Groove;
  bpm: number;
  /** The piano notes for every bar of the form, e.g. 12 bars of blues. */
  bars: number[][];
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

  const piano = useRef<Record<number, Pool> | null>(null);
  const drums = useRef<Record<Drum, Pool> | null>(null);

  // Load every sound once, and free them when the screen closes.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const pool = (source: number, size: number): Pool => ({
      players: Array.from({ length: size }, () => createAudioPlayer(source)),
      next: 0,
    });
    const pianoPools: Record<number, Pool> = {};
    for (let note = PIANO_LOW; note <= PIANO_HIGH; note++) {
      pianoPools[note] = pool(PIANO_SOUNDS[note], PLAYERS_PER_NOTE);
    }
    const drumPools = {} as Record<Drum, Pool>;
    for (const drum of Object.keys(DRUM_SOUNDS) as Drum[]) {
      drumPools[drum] = pool(DRUM_SOUNDS[drum], PLAYERS_PER_DRUM);
    }
    piano.current = pianoPools;
    drums.current = drumPools;
    return () => {
      [...Object.values(pianoPools), ...Object.values(drumPools)].forEach((p) =>
        p.players.forEach((player) => player.remove()),
      );
      piano.current = null;
      drums.current = null;
    };
  }, []);

  function play(pool: Pool | undefined, volume: number): AudioPlayer | undefined {
    if (!pool) return;
    const player = pool.players[pool.next];
    pool.next = (pool.next + 1) % pool.players.length;
    player.volume = volume;
    player.seekTo(0);
    player.play();
    return player;
  }

  function damp(notes: number[]) {
    notes.forEach((note) => piano.current?.[note]?.players.forEach((p) => p.pause()));
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
    let lastNotes: number[] = []; // piano notes of the last chord, damped when it changes
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

      const stepsPerBar = BEATS_PER_BAR * g.stepsPerBeat;
      if (step >= stepsPerBar) step = 0; // the groove changed to one with fewer steps
      if (bar >= form.length) bar = 0; // the progression changed to a shorter one

      if (step % g.stepsPerBeat === 0) {
        setPosition({ bar, beat: step / g.stepsPerBeat });
      }

      for (const [drum, hits] of Object.entries(g.drums) as [Drum, typeof g.piano][]) {
        const hit = hits.find((h) => h.step === step);
        if (hit) play(drums.current?.[drum], hit.volume * dv);
      }

      const pianoHit = g.piano.find((h) => h.step === step);
      if (pianoHit) {
        const notes = form[bar];
        // A new chord: lift the keys the new chord doesn't use, like a pianist would.
        damp(lastNotes.filter((n) => !notes.includes(n)));
        notes.forEach((note) => play(piano.current?.[note], pianoHit.volume * pv));
        lastNotes = notes;
      }

      step += 1;
      if (step >= stepsPerBar) {
        step = 0;
        bar = (bar + 1) % form.length;
      }
      nextTime += beatMs / g.stepsPerBeat;
      timer = setTimeout(tick, Math.max(0, nextTime - Date.now()));
    }

    tick();
    return () => {
      clearTimeout(timer);
      damp(lastNotes);
    };
  }, [running]);

  return { running, ...position, toggle: () => setRunning((r) => !r) };
}
