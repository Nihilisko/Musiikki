import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { noteName } from '../music/notes';
import { useInstrument } from '../state/InstrumentContext';
import { colors } from '../theme/colors';

// Step 2: pick a tuning for the chosen instrument, then open the menu.
export default function ChooseTuningScreen() {
  const { instrument, tuningIndex, selectTuning } = useInstrument();

  function choose(index: number) {
    selectTuning(index);
    // Clear the choosing screens from history, so "back" from the menu doesn't return here.
    router.dismissAll();
    router.replace('/home');
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{instrument.name}: which tuning?</Text>
      {instrument.tunings.map((tuning, index) => {
        const active = index === tuningIndex;
        return (
          <Pressable
            key={tuning.name}
            onPress={() => choose(index)}
            style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.pressed]}
          >
            <Text style={[styles.name, active && styles.activeText]}>{tuning.name}</Text>
            <Text style={[styles.notes, active && styles.activeText]}>
              {tuning.strings.map(noteName).join(' ')}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 8,
  },
  intro: {
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  rowActive: {
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  notes: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  activeText: {
    color: '#1a1a1a',
  },
});
