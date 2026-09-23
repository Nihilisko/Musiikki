import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTuner } from '../audio/useTuner';
import Stepper from '../components/Stepper';
import TunerGauge from '../components/TunerGauge';
import { noteNameWithOctave } from '../music/notes';
import { DEFAULT_A4, IN_TUNE_CENTS, MAX_A4, MIN_A4, tunerTargets } from '../music/tuner';
import { useInstrument } from '../state/InstrumentContext';
import { loadJson, saveJson } from '../state/storage';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const A4_KEY = 'tuner-a4';

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
  const { status, reading } = useTuner(targets, true, a4);

  const inTune = reading !== null && Math.abs(reading.cents) <= IN_TUNE_CENTS;
  useEffect(() => {
    if (inTune && reading) {
      const key = targetKey(reading.stringIndex, reading.octave);
      setTuned((current) => (current.has(key) ? current : new Set(current).add(key)));
    }
  }, [inTune, reading]);

  const note = reading ? noteNameWithOctave(reading.midi, tuning.flats) : '– –';
  const hint = !reading
    ? 'Play one string'
    : inTune
      ? 'In tune'
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

      {/* The strings of the tuning, lowest first; the one being played lights up. */}
      <View style={styles.strings}>
        {targets.map((t) => {
          const key = targetKey(t.stringIndex, t.octave);
          const current = reading?.stringIndex === t.stringIndex && reading.octave === t.octave;
          const done = tuned.has(key);
          return (
            <View key={key} style={[styles.string, current && styles.stringCurrent]}>
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
            </View>
          );
        })}
      </View>

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
    referenceLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });
}
