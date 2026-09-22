import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useInstrument } from '../state/InstrumentContext';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

/** Header button showing the current instrument; tap to change it. */
export default function InstrumentButton() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { instrument, tuning } = useInstrument();
  return (
    <Pressable onPress={() => router.push('/choose-instrument')} style={styles.button} hitSlop={8}>
      <Text style={styles.text} numberOfLines={1}>
        {instrument.name} · {tuning.name}
      </Text>
      <Ionicons name="chevron-down" size={16} color={colors.accentText} />
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      marginHorizontal: 8,
    },
    text: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      flexShrink: 1,
    },
  });
}
