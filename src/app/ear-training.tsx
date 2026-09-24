import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

type Item = {
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Screen to open; items without one are coming later. */
  href?: Href;
};

const ITEMS: Item[] = [
  {
    title: 'Intervals',
    description: 'Hear two notes and name the distance between them.',
    icon: 'swap-vertical',
    href: '/intervals',
  },
  {
    title: 'Chord types',
    description: 'Hear a chord and tell major, minor, 7th and more apart.',
    icon: 'musical-notes-outline',
    href: '/chord-types',
  },
  {
    title: 'Scale degrees',
    description: 'Hear the key, then name the degree of a note (1, 3, 5…).',
    icon: 'radio-button-on-outline',
    href: '/scale-degrees',
  },
  {
    title: 'Progressions',
    description: 'Hear a chord progression and name its degrees (I–IV–V…).',
    icon: 'git-branch-outline',
    href: '/harmony',
  },
];

// Ear training: exercises that train the ear to recognise what it hears.
export default function EarTrainingScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {ITEMS.map((item) => {
        const ready = item.href !== undefined;
        return (
          <Pressable
            key={item.title}
            disabled={!ready}
            onPress={() => item.href && router.push(item.href)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <Ionicons
              name={item.icon}
              size={26}
              color={ready ? colors.accentText : colors.textMuted}
            />
            <View style={styles.text}>
              <Text style={[styles.title, !ready && styles.muted]}>{item.title}</Text>
              <Text style={styles.description}>
                {ready ? item.description : `Coming soon · ${item.description}`}
              </Text>
            </View>
            {ready && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
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
      gap: 12,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      borderRadius: 14,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.7,
    },
    text: {
      flex: 1,
      gap: 3,
    },
    title: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    muted: {
      color: colors.textMuted,
    },
    description: {
      color: colors.textMuted,
      fontSize: 13,
    },
  });
}
