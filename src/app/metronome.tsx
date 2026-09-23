import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useMetronome } from '../audio/useMetronome';
import ChipRow from '../components/ChipRow';
import Stepper from '../components/Stepper';
import {
  clampBpm,
  DEFAULT_TIME_SIGNATURE,
  MAX_BPM,
  MIN_BPM,
  SUBDIVISIONS,
  TAP_RESET_MS,
  tapTempo,
  TIME_SIGNATURES,
} from '../music/metronome';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const STEPS = [-5, -1, 1, 5];

export default function MetronomeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [bpm, setBpm] = useState(100);
  const [signature, setSignature] = useState(DEFAULT_TIME_SIGNATURE);
  const [subdivision, setSubdivision] = useState(0);
  const [rampOn, setRampOn] = useState(false);
  const [rampStep, setRampStep] = useState(5);
  const [rampBars, setRampBars] = useState(4);
  const [rampTarget, setRampTarget] = useState(160);
  const taps = useRef<number[]>([]);

  const accents = TIME_SIGNATURES[signature].accents;
  const { running, beat, toggle } = useMetronome({
    bpm,
    accents,
    subdivision: SUBDIVISIONS[subdivision].count,
    ramp: rampOn ? { step: rampStep, everyBars: rampBars, target: rampTarget } : null,
    onTempoChange: setBpm,
  });

  function tap() {
    const now = Date.now();
    const last = taps.current[taps.current.length - 1];
    // A long pause means a new count, so an old tap doesn't pull the tempo off.
    taps.current = last !== undefined && now - last > TAP_RESET_MS ? [now] : [...taps.current, now];
    const tempo = tapTempo(taps.current);
    if (tempo !== null) setBpm(tempo);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* One light per beat; the first beat of the bar is red, like its higher click. */}
      <View style={styles.lights}>
        {accents.map((accent, i) => {
          const lit = i === beat;
          return (
            <View
              key={i}
              style={[
                styles.light,
                accent === 'strong' && styles.lightStrong,
                accent === 'medium' && styles.lightMedium,
                lit && (accent === 'strong' ? styles.litStrong : styles.lit),
              ]}
            />
          );
        })}
      </View>

      <View style={styles.tempo}>
        <Text style={styles.bpm}>{bpm}</Text>
        <Text style={styles.bpmLabel}>BPM</Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step) => (
          <Pressable
            key={step}
            onPress={() => setBpm((b) => clampBpm(b + step))}
            disabled={(step < 0 && bpm <= MIN_BPM) || (step > 0 && bpm >= MAX_BPM)}
            style={({ pressed }) => [styles.step, pressed && styles.pressed]}
          >
            <Text style={styles.stepText}>{step > 0 ? `+${step}` : `−${-step}`}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={tap}
        style={({ pressed }) => [styles.tap, pressed && styles.tapPressed]}
        accessibilityLabel="Tap tempo"
      >
        <Ionicons name="hand-left-outline" size={18} color={colors.text} />
        <Text style={styles.tapText}>Tap tempo</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Time signature</Text>
      <ChipRow
        options={TIME_SIGNATURES.map((t) => t.label)}
        selected={signature}
        onSelect={setSignature}
      />

      <Text style={styles.sectionLabel}>Subdivision</Text>
      <ChipRow
        options={SUBDIVISIONS.map((d) => d.label)}
        selected={subdivision}
        onSelect={setSubdivision}
      />

      <View style={styles.trainer}>
        <View style={styles.trainerHeader}>
          <View style={styles.trainerTitle}>
            <Text style={styles.trainerName}>Speed trainer</Text>
            <Text style={styles.trainerHint}>
              {rampOn
                ? `+${rampStep} BPM every ${rampBars} ${rampBars === 1 ? 'bar' : 'bars'}, up to ${rampTarget}`
                : 'Raises the tempo little by little'}
            </Text>
          </View>
          <Switch
            value={rampOn}
            onValueChange={setRampOn}
            trackColor={{ true: colors.brand, false: colors.border }}
            thumbColor={colors.onBrand}
          />
        </View>
        {rampOn && (
          <View style={styles.trainerSteppers}>
            <Stepper value={rampStep} min={1} max={20} onChange={setRampStep} caption="BPM up" />
            <Stepper
              value={rampBars}
              min={1}
              max={16}
              onChange={setRampBars}
              caption="Every bars"
            />
            <Stepper
              value={rampTarget}
              min={MIN_BPM}
              max={MAX_BPM}
              step={5}
              onChange={setRampTarget}
              caption="Up to"
            />
          </View>
        )}
      </View>

      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.start, pressed && styles.pressed]}
        accessibilityLabel={running ? 'Stop' : 'Start'}
      >
        <Ionicons name={running ? 'stop' : 'play'} size={22} color={colors.onBrand} />
        <Text style={styles.startText}>{running ? 'Stop' : 'Start'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 16,
    },
    lights: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 12,
    },
    light: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
    },
    lightStrong: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    lightMedium: {
      width: 26,
      height: 26,
      borderRadius: 13,
    },
    lit: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    litStrong: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    tempo: {
      alignItems: 'center',
    },
    bpm: {
      color: colors.text,
      fontSize: 88,
      fontWeight: '800',
      fontVariant: ['tabular-nums'], // digits the same width, so the number doesn't jump
    },
    bpmLabel: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 2,
      marginTop: -8,
    },
    steps: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
    },
    step: {
      minWidth: 64,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    stepText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    tap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    tapPressed: {
      backgroundColor: colors.surface,
    },
    tapText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    trainer: {
      borderRadius: 12,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 12,
    },
    trainerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    trainerTitle: {
      flex: 1,
      gap: 2,
    },
    trainerName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    trainerHint: {
      color: colors.textMuted,
      fontSize: 13,
    },
    trainerSteppers: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: -8,
    },
    start: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: colors.brand,
      marginTop: 8,
    },
    startText: {
      color: colors.onBrand,
      fontSize: 18,
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
