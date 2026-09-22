import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { INSTRUMENTS } from '../music/instruments';
import { useInstrument } from '../state/InstrumentContext';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

// Step 1: pick an instrument, then move on to its tunings.
export default function ChooseInstrumentScreen() {
  const styles = useThemedStyles(makeStyles);
  const { instrumentIndex, selectInstrument } = useInstrument();

  function choose(index: number) {
    selectInstrument(index);
    router.push('/choose-tuning');
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>What do you want to practise on?</Text>
      {INSTRUMENTS.map((instrument, index) => {
        const active = index === instrumentIndex;
        return (
          <Pressable
            key={instrument.id}
            onPress={() => choose(index)}
            style={({ pressed }) => [
              styles.card,
              active && styles.cardActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.name, active && styles.activeText]}>{instrument.name}</Text>
            <Text style={[styles.detail, active && styles.activeText]}>
              {instrument.tunings.length} {instrument.tunings.length === 1 ? 'tuning' : 'tunings'}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 10,
    },
    intro: {
      color: colors.textMuted,
      fontSize: 16,
      marginBottom: 6,
    },
    card: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: colors.surface,
    },
    cardActive: {
      backgroundColor: colors.accent,
    },
    pressed: {
      opacity: 0.7,
    },
    name: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '700',
    },
    detail: {
      color: colors.textMuted,
      fontSize: 14,
    },
    activeText: {
      color: colors.onAccent,
    },
  });
}
