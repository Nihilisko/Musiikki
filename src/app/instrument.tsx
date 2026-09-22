import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { INSTRUMENTS } from '../music/instruments';
import { noteName } from '../music/notes';
import { useInstrument } from '../state/InstrumentContext';
import { colors } from '../theme/colors';

// Pick the instrument and tuning used everywhere in the app.
export default function InstrumentScreen() {
  const { instrument, instrumentIndex, tuningIndex, selectInstrument, selectTuning } =
    useInstrument();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Instrument</Text>
      <View style={styles.grid}>
        {INSTRUMENTS.map((item, index) => {
          const active = index === instrumentIndex;
          return (
            <Pressable
              key={item.id}
              onPress={() => selectInstrument(index)}
              style={[styles.card, active && styles.cardActive]}
            >
              <Text style={[styles.cardTitle, active && styles.activeText]}>{item.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Tuning</Text>
      <View style={styles.tunings}>
        {instrument.tunings.map((tuning, index) => {
          const active = index === tuningIndex;
          return (
            <Pressable
              key={tuning.name}
              onPress={() => selectTuning(index)}
              style={[styles.tuningRow, active && styles.cardActive]}
            >
              <Text style={[styles.tuningName, active && styles.activeText]}>{tuning.name}</Text>
              <Text style={[styles.tuningNotes, active && styles.activeText]}>
                {tuning.strings.map(noteName).join(' ')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={() => router.back()} style={styles.done}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  cardActive: {
    backgroundColor: colors.accent,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  activeText: {
    color: '#1a1a1a',
  },
  tunings: {
    gap: 8,
  },
  tuningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  tuningName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  tuningNotes: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  done: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  doneText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '700',
  },
});
