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
    title: 'Capo & transpose',
    description: 'Move a song to another key, or find the capo for easy chord shapes.',
    icon: 'swap-vertical',
    href: '/transpose',
  },
  {
    title: 'Chords in a key',
    description: 'The triads and seventh chords of any key, with their degrees.',
    icon: 'grid-outline',
    href: '/key-chords',
  },
  {
    title: 'Theory notes',
    description: 'Intervals, scales, modes and chords explained, with links to see them.',
    icon: 'book-outline',
  },
];

// The theory section: tools and short explanations.
export default function TheoryScreen() {
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
