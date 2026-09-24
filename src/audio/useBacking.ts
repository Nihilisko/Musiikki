import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import type { Drum, Groove } from '../music/backing';
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
const BEATS_PER_BAR = 4;
/** Clicks before the band comes in, so you can get ready. */
const COUNT_IN_BEATS = 4;

type Pool = { players: AudioPlayer[]; next: number };

function makePool(source: number): Pool {
  return {
    players: Array.from({ length: PLAYERS_PER_SOUND }, () => createAudioPlayer(source)),
    next: 0,
  };
}

function removePool(pool: Pool) {
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
      if (!pools[name] && CHORD_SOUNDS[name]) pools[name] = makePool(CHORD_SOUNDS[name]);
    }
  }, [chordList]);

  function play(pool: Pool | undefined, volume: number) {
    if (!pool) return;
    const player = pool.players[pool.next];
    pool.next = (pool.next + 1) % pool.players.length;
    player.volume = volume;
    player.seekTo(0);
    player.play();
  }

  function damp(name: string) {
    chords.current[name]?.players.forEach((p) => p.pause());
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
        const chord = form[bar];
        // A new chord: lift the old one's keys, like a pianist would.
        if (lastChord && lastChord !== chord) damp(lastChord);
        play(chords.current[chord], pianoHit.volume * pv);
        lastChord = chord;
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
      if (lastChord) damp(lastChord);
    };
  }, [running]);

  return { running, ...position, toggle: () => setRunning((r) => !r) };
}
