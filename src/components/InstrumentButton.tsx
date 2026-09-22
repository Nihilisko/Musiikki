import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useInstrument } from '../state/InstrumentContext';
import { colors } from '../theme/colors';

/** Header button showing the current instrument; tap to change it. */
export default function InstrumentButton() {
  const { instrument, tuning } = useInstrument();
  return (
    <Pressable onPress={() => router.push('/instrument')} style={styles.button} hitSlop={8}>
      <Text style={styles.text} numberOfLines={1}>
        {instrument.name} · {tuning.name}
      </Text>
      <Ionicons name="chevron-down" size={16} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  text: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
});
