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
/** How long a sound takes to fade out: an old chord when the next chord comes, a chord
 *  when it is struck again (like a piano string that is hit while it still rings), a bass note. */
const CHORD_CHANGE_FADE_MS = 600;
const CHORD_RESTRIKE_FADE_MS = 350;
const BASS_FADE_MS = 80;
const FADE_STEPS = 10;

// A little human looseness, so the band doesn't sound like a machine. Each hit is a bit
// louder or softer, and slightly late: the drums keep the time, the bass sits right with them,
// and the piano plays just behind the beat, like a relaxed pianist.
const VOLUME_WOBBLE = { drum: 0.12, chord: 0.1, bass: 0.08 };
const LATE_MS = { drum: [0, 6], chord: [8, 24], bass: [0, 8] } as const;

const wobble = (volume: number, amount: number) =>
  Math.min(1, volume * (1 + (Math.random() * 2 - 1) * amount));
const lateness = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);

type Pool = { players: AudioPlayer[]; next: number };

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
 * start every player silently while the tap is still going on. It is left to play to its end
 * at volume 0: stopping it at once would make the browser report an error.
 */
function unlockPool(pool: Pool) {
  if (Platform.OS !== 'web') return;
  pool.players.forEach((p) => {
    p.volume = 0;
    p.play();
  });
}

function removePool(pool: Pool) {
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

  // Fade-outs going on, one timer per player.
  const fades = useRef(new Map<AudioPlayer, ReturnType<typeof setTimeout>>());

  /** Fade players out, then stop them: much softer than cutting a sound off. */
  function fadeOut(players: AudioPlayer[], ms: number) {
    for (const player of players) {
      clearTimeout(fades.current.get(player));
      const start = player.volume;
      let stepIndex = 0;
      const fadeStep = () => {
        stepIndex += 1;
        const left = 1 - stepIndex / FADE_STEPS;
        if (left <= 0) {
          player.pause();
          fades.current.delete(player);
          return;
        }
        player.volume = start * left * left; // falls fast at first, then gently, like a real decay
        fades.current.set(player, setTimeout(fadeStep, ms / FADE_STEPS));
      };
      fadeStep();
    }
  }

  /**
   * Starts a sound. `restrikeFadeMs`: the pool's other players (earlier hits of the same sound
   * that still ring) fade out over this time, so the player used next is already quiet when its
   * turn comes, instead of being cut off mid-sound.
   */
  function play(name: string, volume: number, restrikeFadeMs?: number) {
    const pool = pools.current[name];
    if (!pool) return;
    const player = pool.players[pool.next];
    pool.next = (pool.next + 1) % pool.players.length;
    clearTimeout(fades.current.get(player)); // it may still be fading from an earlier hit
    fades.current.delete(player);
    if (restrikeFadeMs !== undefined) {
      fadeOut(
        pool.players.filter((p) => p !== player),
        restrikeFadeMs,
      );
    }
    player.volume = volume;
    player.seekTo(0);
    player.play();
  }

  function stopAll(name: string, ms: number) {
    const pool = pools.current[name];
    if (pool) fadeOut(pool.players, ms);
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
    const pending = new Set<ReturnType<typeof setTimeout>>(); // slightly late hits

    /** Runs `action` a few milliseconds from now (the human lateness). */
    function later(ms: number, action: () => void) {
      const t = setTimeout(() => {
        pending.delete(t);
        action();
      }, ms);
      pending.add(t);
    }

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
        if (hit) {
          const volume = wobble(hit.volume * volumes.drumVolume, VOLUME_WOBBLE.drum);
          later(lateness(LATE_MS.drum), () => play(`drum:${drum}`, volume));
        }
      }

      const pianoHit = g.piano.find((h) => h.step === step);
      if (pianoHit) {
        const name = `chord:${chord}`;
        const previous = lastChord;
        lastChord = name;
        const volume = wobble(pianoHit.volume * volumes.pianoVolume, VOLUME_WOBBLE.chord);
        later(lateness(LATE_MS.chord), () => {
          // A new chord: lift the old one's keys slowly, so it dies away under the new one.
          if (previous && previous !== name) stopAll(previous, CHORD_CHANGE_FADE_MS);
          play(name, volume, CHORD_RESTRIKE_FADE_MS);
        });
      }

      const bassNote = bass.find((n) => n.step === step);
      if (bassNote && volumes.bassVolume > 0) {
        const name = `bass:${bassNote.midi}`;
        const previous = lastBass;
        lastBass = name;
        const volume = wobble(bassNote.volume * volumes.bassVolume, VOLUME_WOBBLE.bass);
        later(lateness(LATE_MS.bass), () => {
          if (previous && previous !== name) stopAll(previous, BASS_FADE_MS);
          play(name, volume);
        });
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
      pending.forEach(clearTimeout);
      if (lastChord) stopAll(lastChord, CHORD_CHANGE_FADE_MS);
      if (lastBass) stopAll(lastBass, BASS_FADE_MS);
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
