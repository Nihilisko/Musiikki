import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../theme/colors';

type Topic = {
  title: string;
  description: string;
  /** Screen to open; topics without one are not built yet. */
  href?: Href;
};

const TOPICS: Topic[] = [
  { title: 'Scales & modes', description: 'Any scale in any key on the fretboard', href: '/learn/scales' },
  { title: 'Chords & triads', description: 'Chord shapes, triads and inversions' },
  { title: 'CAGED', description: 'The five shapes that connect the neck' },
  { title: 'Theory notes', description: 'Short explanations to refresh your memory' },
];

export default function LearnMenu() {
  return (
    <ScrollView contentContainerStyle={styles.list}>
      {TOPICS.map((topic) => {
        const ready = topic.href !== undefined;
        return (
          <Pressable
            key={topic.title}
            disabled={!ready}
            onPress={() => topic.href && router.push(topic.href)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.rowText}>
              <Text style={[styles.title, !ready && styles.muted]}>{topic.title}</Text>
              <Text style={styles.description}>
                {ready ? topic.description : 'Coming soon'}
              </Text>
            </View>
            {ready && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  muted: {
    color: colors.textMuted,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
