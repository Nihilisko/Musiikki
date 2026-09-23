import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMetronome } from '../audio/useMetronome';
import ChipRow from '../components/ChipRow';
import {
  clampBpm,
  DEFAULT_TIME_SIGNATURE,
  MAX_BPM,
  MIN_BPM,
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
  const accents = TIME_SIGNATURES[signature].accents;
  const { running, beat, toggle } = useMetronome({ bpm, accents });

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

      <Text style={styles.sectionLabel}>Time signature</Text>
      <ChipRow
        options={TIME_SIGNATURES.map((t) => t.label)}
        selected={signature}
        onSelect={setSignature}
      />

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
