import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

type Props = {
  /** Where the button goes, in words: "Menu", "Back"... */
  label: string;
};

/**
 * A clear back button with a word next to the arrow, for the header.
 * If there is nothing to go back to (e.g. the app was opened on this screen), it goes to the menu.
 */
export default function BackButton({ label }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }

  return (
    <Pressable
      onPress={goBack}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={20} color={colors.accentText} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 6,
      paddingLeft: 6,
      paddingRight: 12,
      marginHorizontal: 8,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.7,
    },
    text: {
      color: colors.accentText,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
