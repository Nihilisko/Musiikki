import { requestRecordingPermissionsAsync, useAudioStream } from 'expo-audio';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_A4,
  listeningRange,
  nearestString,
  type TunerReading,
  type TunerTarget,
} from '../music/tuner';
import { detectPitch } from './pitch';

const SAMPLE_RATE = 48000;
/** Readings are smoothed over this many detections (the middle value wins). */
const SMOOTHING = 5;
/** With no clear note for this long, the tuner shows nothing again. */
const HOLD_MS = 1200;
/** Below this clarity a detection is ignored (noise, several strings at once). */
const MIN_CLARITY = 0.85;

export type TunerStatus = 'idle' | 'listening' | 'denied' | 'unavailable';

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Listens to the microphone and returns the nearest string of `targets` and how far off it is.
 * Starts when `active` is true and stops (releasing the microphone) when it turns false.
 */
export function useTuner(targets: TunerTarget[], active: boolean, a4 = DEFAULT_A4) {
  const [status, setStatus] = useState<TunerStatus>('idle');
  const [reading, setReading] = useState<(TunerReading & { frequency: number }) | null>(null);

  const range = useMemo(() => listeningRange(targets, a4), [targets, a4]);
  // The latest settings, read in the audio callback without restarting the stream.
  const settings = useRef({ targets, a4, range });
  settings.current = { targets, a4, range };

  const samples = useRef(new Float32Array(0));
  const recent = useRef<number[]>([]);
  const lastHeard = useRef(0);

  const { stream } = useAudioStream({
    sampleRate: SAMPLE_RATE,
    channels: 1,
    encoding: 'float32',
    onBuffer: (buffer) => {
      const rate = buffer.sampleRate || SAMPLE_RATE;
      const { targets: tg, a4: ref, range: rg } = settings.current;
      // Keep just enough of the latest sound for two periods of the lowest note.
      const needed = Math.ceil((rate / rg.min) * 2) + 16;
      const incoming = new Float32Array(buffer.data);
      const joined = new Float32Array(Math.min(needed, samples.current.length + incoming.length));
      const keep = joined.length - incoming.length;
      if (keep > 0) joined.set(samples.current.subarray(samples.current.length - keep), 0);
      joined.set(
        incoming.subarray(Math.max(0, incoming.length - joined.length)),
        Math.max(0, keep),
      );
      samples.current = joined;
      if (joined.length < needed) return;

      const pitch = detectPitch(joined, rate, rg.min, rg.max);
      const now = Date.now();
      if (pitch && pitch.clarity >= MIN_CLARITY) {
        recent.current = [...recent.current, pitch.frequency].slice(-SMOOTHING);
        lastHeard.current = now;
        const frequency = median(recent.current);
        const nearest = nearestString(frequency, tg, ref);
        if (nearest) setReading({ ...nearest, frequency });
      } else if (now - lastHeard.current > HOLD_MS) {
        recent.current = [];
        setReading(null);
      }
    },
  });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      try {
        const permission = await requestRecordingPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setStatus('denied');
          return;
        }
        await stream.start();
        if (!cancelled) setStatus('listening');
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    })();
    return () => {
      cancelled = true;
      try {
        stream.stop();
      } catch {
        // already stopped
      }
      setStatus('idle');
      setReading(null);
    };
  }, [active, stream]);

  return { status, reading };
}
