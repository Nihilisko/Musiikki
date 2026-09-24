import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CHIME_MS, useChime } from '../audio/useChime';
import { useTuner } from '../audio/useTuner';
import Stepper from '../components/Stepper';
import TunerGauge from '../components/TunerGauge';
import { noteNameWithOctave } from '../music/notes';
import {
  centsOff,
  DEFAULT_A4,
  frequencyOf,
  IN_TUNE_CENTS,
  MAX_A4,
  MIN_A4,
  tunerTargets,
} from '../music/tuner';
import { useInstrument } from '../state/InstrumentContext';
import { loadJson, saveJson } from '../state/storage';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const A4_KEY = 'tuner-a4';
/** The string must stay in tune this long before the chime rings, so a passing wobble doesn't. */
const CHIME_AFTER_MS = 400;

function targetKey(stringIndex: number, octave: boolean) {
  return `${stringIndex}${octave ? 'o' : ''}`;
}

export default function TunerScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const { instrument, tuning } = useInstrument();
  const [a4, setA4State] = useState(DEFAULT_A4);
  // Strings that have been in tune while this screen is open.
  const [tuned, setTuned] = useState<Set<string>>(new Set());
  // Manual mode: the string chosen by tapping it, or null for automatic detection.
  const [locked, setLocked] = useState<string | null>(null);

  useEffect(() => {
    loadJson<number>(A4_KEY).then((saved) => {
      if (typeof saved === 'number' && saved >= MIN_A4 && saved <= MAX_A4) setA4State(saved);
    });
  }, []);
  function setA4(value: number) {
    setA4State(value);
    saveJson(A4_KEY, value);
  }

  const targets = useMemo(
    () => tunerTargets(tuning.strings, instrument.octaveCourses),
    [tuning.strings, instrument.octaveCourses],
  );
  const { status, reading: detected, pause } = useTuner(targets, true, a4);
  const playChime = useChime();

  // In manual mode the note is always compared with the chosen string, however far off it is,
  // so a badly detuned string can't be mistaken for its neighbour. (If the tuning changes and
  // the chosen string no longer exists, the tuner falls back to automatic.)
  const lockedTarget = targets.find((t) => targetKey(t.stringIndex, t.octave) === locked);
  const reading =
    detected && lockedTarget
      ? {
          ...lockedTarget,
          frequency: detected.frequency,
          cents: centsOff(detected.frequency, frequencyOf(lockedTarget.midi, a4)),
        }
      : detected;
  const shownTarget = lockedTarget ?? reading;

  function chooseString(key: string) {
    setLocked((current) => (current === key ? null : key)); // tap again to go back to auto
  }

  const inTune = reading !== null && Math.abs(reading.cents) <= IN_TUNE_CENTS;
  const readingKey = reading ? targetKey(reading.stringIndex, reading.octave) : null;

  // The chime: rings once when a string has stayed in tune for a moment, so the tuner can be
  // used without looking (or seeing). It rings again only after the string has gone clearly
  // out of tune or another string is played. While it rings the tuner stops listening, so it
  // doesn't hear its own chime.
  const chimedFor = useRef<string | null>(null);
  const farOff = reading !== null && Math.abs(reading.cents) > IN_TUNE_CENTS + 2;
  // Latest versions of the functions, so the timer below isn't restarted by every new reading.
  const actions = useRef({ pause, playChime });
  actions.current = { pause, playChime };

  useEffect(() => {
    if (farOff || (chimedFor.current !== null && readingKey !== chimedFor.current)) {
      chimedFor.current = null;
    }
  }, [farOff, readingKey]);

  useEffect(() => {
    if (!inTune || !readingKey) return;
    setTuned((current) => (current.has(readingKey) ? current : new Set(current).add(readingKey)));
    if (chimedFor.current === readingKey) return;
    const timer = setTimeout(() => {
      chimedFor.current = readingKey;
      actions.current.pause(CHIME_MS + 100);
      actions.current.playChime();
    }, CHIME_AFTER_MS);
    return () => clearTimeout(timer);
  }, [inTune, readingKey]);

  const note = shownTarget ? noteNameWithOctave(shownTarget.midi, tuning.flats) : '– –';
  const hint = !reading
    ? 'Play one string'
    : inTune
      ? 'In tune'
      : Math.abs(reading.cents) > 50
        ? reading.cents < 0
          ? 'Far too low – tune up'
          : 'Far too high – tune down'
        : reading.cents < 0
          ? 'Too low – tune up'
          : 'Too high – tune down';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        {instrument.name} · {tuning.name}
      </Text>

      <TunerGauge cents={reading?.cents ?? null} note={note} size={Math.min(width - 32, 340)} />

      <View style={styles.readout}>
        <Text style={[styles.hint, inTune && styles.hintInTune]}>{hint}</Text>
        {reading && (
          <Text style={styles.cents}>
            {reading.cents > 0 ? '+' : ''}
            {reading.cents.toFixed(1)} cents · {reading.frequency.toFixed(1)} Hz
          </Text>
        )}
      </View>

      {/* Auto, then the strings lowest first. The string being tuned lights up; tapping a
          string tunes to it only, tapping it again (or Auto) goes back to detecting. */}
      <View style={styles.strings}>
        <Pressable
          onPress={() => setLocked(null)}
          style={[styles.string, !lockedTarget && styles.autoOn]}
          accessibilityLabel="Automatic string detection"
        >
          <Ionicons
            name="flash"
            size={14}
            color={!lockedTarget ? colors.onAccent : colors.textMuted}
          />
          <Text style={[styles.stringName, !lockedTarget && styles.stringNameCurrent]}>Auto</Text>
        </Pressable>
        {targets.map((t) => {
          const key = targetKey(t.stringIndex, t.octave);
          const current =
            shownTarget?.stringIndex === t.stringIndex && shownTarget.octave === t.octave;
          const done = tuned.has(key);
          return (
            <Pressable
              key={key}
              onPress={() => chooseString(key)}
              style={[
                styles.string,
                current && styles.stringCurrent,
                key === locked && styles.stringLocked,
              ]}
              accessibilityLabel={`Tune ${noteNameWithOctave(t.midi, tuning.flats)}`}
            >
              <Text style={[styles.stringName, current && styles.stringNameCurrent]}>
                {noteNameWithOctave(t.midi, tuning.flats)}
              </Text>
              {done && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={current ? colors.onAccent : '#2e9d57'}
                />
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.mode}>
        {lockedTarget
          ? `Manual: tuning ${noteNameWithOctave(lockedTarget.midi, tuning.flats)} only. Tap it again or Auto to detect strings.`
          : 'Auto: play any string. Tap a string to tune only that one.'}
      </Text>

      {status === 'denied' && Platform.OS !== 'web' && (
        <Text style={styles.warning}>
          The tuner needs the microphone. Allow it in your phone&apos;s settings and open the tuner
          again.
        </Text>
      )}
      {Platform.OS === 'web' ? (
        <Text style={styles.warning}>
          The tuner listens through the microphone in the phone app; it does not work in the browser
          preview.
        </Text>
      ) : (
        status === 'unavailable' && (
          <Text style={styles.warning}>
            The microphone could not be started. Close other apps that use it and open the tuner
            again.
          </Text>
        )
      )}

      <View style={styles.reference}>
        <Text style={styles.referenceLabel}>Reference pitch</Text>
        <Stepper value={a4} min={MIN_A4} max={MAX_A4} onChange={setA4} caption="A4 Hz" />
      </View>

      <Pressable
        onPress={() => router.push('/slide')}
        style={({ pressed }) => [styles.slideLink, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="trending-up" size={18} color={colors.accentText} />
        <Text style={styles.slideLinkText}>Slide intonation trainer</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 16,
      alignItems: 'center',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 13,
    },
    readout: {
      alignItems: 'center',
      gap: 4,
      minHeight: 48,
    },
    hint: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    hintInTune: {
      color: '#2e9d57',
    },
    cents: {
      color: colors.textMuted,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
    },
    strings: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    string: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    autoOn: {
      backgroundColor: colors.accent,
    },
    stringLocked: {
      borderWidth: 2,
      borderColor: colors.brand,
    },
    mode: {
      color: colors.textMuted,
      fontSize: 13,
      textAlign: 'center',
      marginTop: -6,
      maxWidth: 340,
    },
    stringCurrent: {
      backgroundColor: colors.accent,
    },
    stringName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    stringNameCurrent: {
      color: colors.onAccent,
    },
    warning: {
      color: colors.textMuted,
      fontSize: 13,
      textAlign: 'center',
      maxWidth: 340,
    },
    reference: {
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    slideLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    slideLinkText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    referenceLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });
}
