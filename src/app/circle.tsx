import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import ChipRow from '../components/ChipRow';
import CircleOfFifths from '../components/CircleOfFifths';
import ProgressionPractice from '../components/ProgressionPractice';
import { diatonicChords, keyName, type KeyMode } from '../music/circle';
import { useLockedKey } from '../state/KeyContext';
import { colors } from '../theme/colors';

const MODES: KeyMode[] = ['major', 'minor'];
const MODE_OPTIONS = ['Major', 'Minor'];

export default function CircleScreen() {
  const { lockedKey, loaded, lockKey } = useLockedKey();
  const { width } = useWindowDimensions();
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
  const size = Math.min(width - 32, 380);

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
      <Text style={styles.hint}>
        Turn the circle or use the arrows. Tap the Major or Minor side to switch.
      </Text>

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

      <Pressable
        onPress={() => lockKey({ index, mode })}
        disabled={isLocked}
        style={[styles.lock, isLocked && styles.locked]}
      >
        <Ionicons
          name={isLocked ? 'lock-closed' : 'lock-open'}
          size={18}
          color={isLocked ? colors.accent : '#1a1a1a'}
        />
        <Text style={[styles.lockText, isLocked && styles.lockedText]}>
          {isLocked ? `${keyName(index, mode)} locked` : `Lock ${keyName(index, mode)}`}
        </Text>
      </Pressable>
      {lockedKey && !isLocked && (
        <Text style={styles.hint}>Locked now: {keyName(lockedKey.index, lockedKey.mode)}</Text>
      )}

      <ProgressionPractice index={index} mode={mode} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  wheel: {
    alignItems: 'center',
    marginTop: 16,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
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
    marginTop: 20,
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
    color: colors.accent,
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
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  locked: {
    backgroundColor: colors.surface,
  },
  lockText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '700',
  },
  lockedText: {
    color: colors.accent,
  },
});
