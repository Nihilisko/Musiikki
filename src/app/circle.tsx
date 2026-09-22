import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import ChipRow from '../components/ChipRow';
import CircleOfFifths from '../components/CircleOfFifths';
import { diatonicChords, keyName, type KeyMode } from '../music/circle';
import { useLockedKey } from '../state/KeyContext';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const MODES: KeyMode[] = ['major', 'minor'];
const MODE_OPTIONS = ['Major', 'Minor'];

export default function CircleScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { lockedKey, loaded, lockKey } = useLockedKey();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<KeyMode>('major');

  // Open on the locked key, once it has been read from the phone.
  useEffect(() => {
    if (loaded && lockedKey) {
      setIndex(lockedKey.index);
      setMode(lockedKey.mode);
    }
  }, [loaded]); // only when loading finishes, not every time the locked key changes

  const chords = diatonicChords(index, mode);
  const isLocked = lockedKey?.index === index && lockedKey?.mode === mode;
  // Fit the circle so everything down to the lock button shows without scrolling:
  // the other parts of the screen take about 360 pixels (header, buttons, chord row).
  const size = Math.max(220, Math.min(width - 32, height - 360, 380));

  function lockAndPractise() {
    lockKey({ index, mode });
    router.push('/progression');
  }

  function step(by: number) {
    setIndex((current) => (((current + by) % 12) + 12) % 12);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ChipRow
        options={MODE_OPTIONS}
        selected={MODES.indexOf(mode)}
        onSelect={(i) => setMode(MODES[i])}
      />

      <View style={styles.wheel}>
        <CircleOfFifths
          index={index}
          mode={mode}
          onChange={setIndex}
          onModeChange={setMode}
          size={size}
        />
      </View>

      <View style={styles.keyRow}>
        <Pressable onPress={() => step(-1)} hitSlop={12} style={styles.arrow}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.keyName}>{keyName(index, mode)}</Text>
        <Pressable onPress={() => step(1)} hitSlop={12} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={26} color={colors.text} />
        </Pressable>
      </View>
      <Text style={styles.hint}>Turn the circle. Tap the Major or Minor side to switch.</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chords}
      >
        {chords.map((chord) => (
          <View key={chord.numeral} style={styles.chord}>
            <Text style={styles.numeral}>{chord.numeral}</Text>
            <Text style={styles.chordName}>{chord.name}</Text>
          </View>
        ))}
      </ScrollView>

      <Pressable onPress={lockAndPractise} style={styles.lock}>
        <Ionicons name={isLocked ? 'lock-closed' : 'lock-open'} size={18} color={colors.onBrand} />
        <Text style={styles.lockText}>
          {isLocked ? `Practise ${keyName(index, mode)}` : `Lock ${keyName(index, mode)}`}
        </Text>
        <Ionicons name="chevron-up" size={18} color={colors.onBrand} />
      </Pressable>
      {lockedKey && !isLocked && (
        <Text style={styles.hint}>Locked now: {keyName(lockedKey.index, lockedKey.mode)}</Text>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      paddingTop: 12,
      paddingBottom: 32,
    },
    wheel: {
      alignItems: 'center',
      marginTop: 12,
    },
    keyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: 12,
    },
    arrow: {
      padding: 6,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    keyName: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700',
      minWidth: 150,
      textAlign: 'center',
    },
    hint: {
      color: colors.textMuted,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 6,
      paddingHorizontal: 16,
    },
    chords: {
      gap: 8,
      paddingHorizontal: 16,
      marginTop: 14,
    },
    chord: {
      alignItems: 'center',
      minWidth: 56,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    numeral: {
      color: colors.accentText,
      fontSize: 13,
      fontWeight: '600',
    },
    chordName: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
      marginTop: 2,
    },
    lock: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
      marginHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.brand,
    },
    lockText: {
      color: colors.onBrand,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
