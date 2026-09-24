import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { STEPS_PER_BAR, stepLength, type Drum, type Groove } from '../music/backing';
import type { BassNote } from '../music/bassLines';
import { beatInterval } from '../music/metronome';
import { BASS_SOUNDS } from './bassSounds';
import { CHORD_SOUNDS } from './chordSounds';

const DRUM_SOUNDS: Record<Drum, number> = {
  kick: require('../../assets/sounds/drums/kick.wav'),
  snare: require('../../assets/sounds/drums/snare.wav'),
  hat: require('../../assets/sounds/drums/hat.wav'),
  hatOpen: require('../../assets/sounds/drums/hat-open.wav'),
  ride: require('../../assets/sounds/drums/ride.wav'),
  rim: require('../../assets/sounds/drums/rim.wav'),
};

// Only the sounds the current groove, chords and bass line use are loaded, about 30 players
// at most: a phone browser refuses to load more than about 40 sounds at once.
// Drums and chords get two players each, so a new hit can start while the last one rings.
// The bass plays one note at a time, so one player per note is enough.

/** Clicks before the band comes in, so you can get ready. */
const COUNT_IN_BEATS = 4;
/** How long a chord takes to fade out when the next chord comes, and a bass note. */
const CHORD_FADE_MS = 250;
const BASS_FADE_MS = 60;
const FADE_STEPS = 5;

/** `fading` is the timer of a soft fade-out that is going on, if any. */
type Pool = { players: AudioPlayer[]; next: number; fading?: ReturnType<typeof setTimeout> };

/** Sound names: "drum:kick", "chord:a-7", "bass:33". */
function soundSource(name: string): { source: number; players: number } | undefined {
  const [kind, id] = name.split(':');
  if (kind === 'drum') return { source: DRUM_SOUNDS[id as Drum], players: 2 };
  if (kind === 'chord')
    return CHORD_SOUNDS[id] ? { source: CHORD_SOUNDS[id], players: 2 } : undefined;
  const bass = BASS_SOUNDS[Number(id)];
  return bass ? { source: bass, players: 1 } : undefined;
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

/** One bar of the form: the piano chord sound (see chordSoundName) and the bass line. */
export type BackingBar = { chord: string; bass: BassNote[] };

type Options = {
  groove: Groove;
  bpm: number;
  /** Every bar of the form, e.g. 12 bars of blues. */
  bars: BackingBar[];
  /** 0-1; a bass volume of 0 mutes the bass. */
  pianoVolume: number;
  drumVolume: number;
  bassVolume: number;
};

/**
 * Plays a groove, the chords and a bass line, one bar at a time, round and round. Returns
 * whether it is running, a start/stop switch, and where it is: the bar (-1 = count-in or
 * stopped), the beat and the step (0-7, for lighting up the bass notes).
 */
export function useBacking({ groove, bpm, bars, pianoVolume, drumVolume, bassVolume }: Options) {
  const [running, setRunning] = useState(false);
  const [position, setPosition] = useState({ bar: -1, beat: -1, step: -1 });

  // The latest settings, read on every step, so changes apply without restarting.
  const settings = useRef({ groove, bpm, bars, pianoVolume, drumVolume, bassVolume });
  settings.current = { groove, bpm, bars, pianoVolume, drumVolume, bassVolume };

  const pools = useRef<Record<string, Pool>>({});

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const loaded = pools.current;
    return () => Object.values(loaded).forEach(removePool); // the screen closed
  }, []);

  // The sounds needed now. When they change, load the new ones and free the rest.
  const wanted = new Set(['drum:rim']); // the count-in
  Object.keys(groove.drums).forEach((d) => wanted.add(`drum:${d}`));
  bars.forEach((b) => {
    wanted.add(`chord:${b.chord}`);
    b.bass.forEach((n) => wanted.add(`bass:${n.midi}`));
  });
  const wantedList = [...wanted].sort().join(' ');
  useEffect(() => {
    const names = wantedList.split(' ');
    const loaded = pools.current;
    for (const name of Object.keys(loaded)) {
      if (!names.includes(name)) {
        removePool(loaded[name]);
        delete loaded[name];
      }
    }
    for (const name of names) {
      const sound = soundSource(name);
      if (loaded[name] || !sound) continue;
      loaded[name] = {
        players: Array.from({ length: sound.players }, () => createAudioPlayer(sound.source)),
        next: 0,
      };
      unlockPool(loaded[name]); // right after a tap on a key, progression or groove
    }
  }, [wantedList]);

  function play(name: string, volume: number) {
    const pool = pools.current[name];
    if (!pool) return;
    clearTimeout(pool.fading); // the sound came back before its fade-out ended
    pool.fading = undefined;
    const player = pool.players[pool.next];
    pool.next = (pool.next + 1) % pool.players.length;
    player.volume = volume;
    player.seekTo(0);
    player.play();
  }

  /** Fade a sound out quickly, then stop it: softer than cutting it off. */
  function fadeOut(name: string, ms: number) {
    const pool = pools.current[name];
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
      pool.fading = left > 0 ? setTimeout(fadeStep, ms / FADE_STEPS) : undefined;
    };
    fadeStep();
  }

  // The timer: every step is aimed at an exact time counted from the previous target, like
  // the metronome, so small delays never add up.
  useEffect(() => {
    if (!running) {
      setPosition({ bar: -1, beat: -1, step: -1 });
      return;
    }
    let countIn = COUNT_IN_BEATS;
    let bar = 0;
    let step = 0;
    let lastChord = ''; // faded out when the chord changes
    let lastBass = ''; // the bass plays one note at a time
    let nextTime = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const { groove: g, bpm: tempo, bars: form, ...volumes } = settings.current;
      const beatMs = beatInterval(tempo);

      if (countIn > 0) {
        // Count-in: a rim click on every beat, the first one louder.
        play('drum:rim', (countIn === COUNT_IN_BEATS ? 0.8 : 0.55) * volumes.drumVolume);
        setPosition({ bar: -1, beat: COUNT_IN_BEATS - countIn, step: -1 });
        countIn -= 1;
        nextTime += beatMs;
        timer = setTimeout(tick, Math.max(0, nextTime - Date.now()));
        return;
      }

      if (bar >= form.length) bar = 0; // the progression changed to a shorter one
      const { chord, bass } = form[bar];
      setPosition({ bar, beat: Math.floor(step / 2), step });

      for (const [drum, hits] of Object.entries(g.drums) as [Drum, typeof g.piano][]) {
        const hit = hits.find((h) => h.step === step);
        if (hit) play(`drum:${drum}`, hit.volume * volumes.drumVolume);
      }

      const pianoHit = g.piano.find((h) => h.step === step);
      if (pianoHit) {
        // A new chord: lift the old one's keys, like a pianist would.
        if (lastChord && lastChord !== `chord:${chord}`) fadeOut(lastChord, CHORD_FADE_MS);
        lastChord = `chord:${chord}`;
        play(lastChord, pianoHit.volume * volumes.pianoVolume);
      }

      const bassNote = bass.find((n) => n.step === step);
      if (bassNote && volumes.bassVolume > 0) {
        const name = `bass:${bassNote.midi}`;
        if (lastBass && lastBass !== name) fadeOut(lastBass, BASS_FADE_MS);
        lastBass = name;
        play(name, bassNote.volume * volumes.bassVolume);
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
      if (lastChord) fadeOut(lastChord, CHORD_FADE_MS);
      if (lastBass) fadeOut(lastBass, BASS_FADE_MS);
    };
  }, [running]);

  function toggle() {
    if (!running) {
      // Called straight from the Play tap, so the browser lets these sounds play later too.
      Object.values(pools.current).forEach(unlockPool);
    }
    setRunning((r) => !r);
  }

  return { running, ...position, toggle };
}
