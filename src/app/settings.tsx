import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles, type ThemePreference } from '../theme/ThemeContext';

const THEME_OPTIONS: { value: ThemePreference; title: string; description: string }[] = [
  {
    value: 'system',
    title: 'Phone setting',
    description: 'Follows your phone’s dark mode, and switches with it.',
  },
  { value: 'dark', title: 'Dark', description: 'Light text on a dark background.' },
  { value: 'light', title: 'Light', description: 'Dark text on a light background.' },
];

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Theme</Text>
      <View style={styles.group}>
        {THEME_OPTIONS.map((option, i) => {
          const selected = option.value === preference;
          return (
            <Pressable
              key={option.value}
              onPress={() => setPreference(option.value)}
              style={({ pressed }) => [
                styles.row,
                i > 0 && styles.rowDivider,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selected ? colors.accentText : colors.textMuted}
              />
              <View style={styles.rowText}>
                <Text style={styles.title}>{option.title}</Text>
                <Text style={styles.description}>{option.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.note}>Coming next: fretboard wood and note colours.</Text>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    group: {
      borderRadius: 12,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    pressed: {
      opacity: 0.7,
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    description: {
      color: colors.textMuted,
      fontSize: 13,
    },
    note: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 16,
    },
  });
}
