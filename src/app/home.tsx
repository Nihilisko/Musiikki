import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Wordmark from '../components/Wordmark';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

type Tile = {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Screen to open; tiles without one are not built yet. */
  href?: Href;
};

const TILES: Tile[] = [
  { title: 'Scales & arpeggios', icon: 'git-network', href: '/scales' },
  { title: 'Circle of fifths', icon: 'sync-circle', href: '/circle' },
  { title: 'Chords & triads', icon: 'layers', href: '/chords' },
  { title: 'CAGED', icon: 'grid' },
  { title: 'Theory', icon: 'book' },
  { title: 'Ear training', icon: 'ear' },
  { title: 'Tuner', icon: 'pulse', href: '/tuner' },
  { title: 'Metronome', icon: 'timer', href: '/metronome' },
  { title: 'Settings', icon: 'settings', href: '/settings' },
];

// The main menu, shown after an instrument and tuning have been chosen.
export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView contentContainerStyle={styles.grid}>
      {/* Takes a whole row, so the tiles start below it. */}
      <View style={styles.logo}>
        <Wordmark height={52} />
      </View>
      {TILES.map((tile) => {
        const ready = tile.href !== undefined;
        return (
          <Pressable
            key={tile.title}
            disabled={!ready}
            onPress={() => tile.href && router.push(tile.href)}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          >
            <Ionicons
              name={tile.icon}
              size={32}
              color={ready ? colors.accentText : colors.textMuted}
            />
            <View style={styles.tileText}>
              <Text style={[styles.title, !ready && styles.muted]}>{tile.title}</Text>
              {!ready && <Text style={styles.soon}>Coming soon</Text>}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      gap: 12,
    },
    logo: {
      width: '100%',
      alignItems: 'center',
      paddingBottom: 4,
    },
    tile: {
      // Two tiles per row: each takes a bit under half, the gap fills the rest.
      width: '47%',
      flexGrow: 1,
      aspectRatio: 1.2,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'space-between',
    },
    pressed: {
      opacity: 0.7,
    },
    tileText: {
      gap: 2,
    },
    title: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    muted: {
      color: colors.textMuted,
    },
    soon: {
      color: colors.textMuted,
      fontSize: 13,
    },
  });
}
