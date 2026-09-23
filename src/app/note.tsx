import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { findNote } from '../content/theoryNotes';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

// One theory note: the main idea, a short explanation, an example and a link to see it.
export default function NoteScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const note = findNote(id);

  if (!note) {
    return (
      <View style={styles.content}>
        <Text style={styles.paragraph}>This note could not be found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: note.title }} />
      <Text style={styles.summary}>{note.summary}</Text>
      {note.paragraphs.map((p, i) => (
        <Text key={i} style={styles.paragraph}>
          {p}
        </Text>
      ))}
      {note.example && (
        <View style={styles.example}>
          <Text style={styles.exampleLabel}>Example</Text>
          <Text style={styles.exampleText}>{note.example}</Text>
        </View>
      )}
      {note.link && (
        <Pressable
          onPress={() => router.push(note.link!.href)}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="eye-outline" size={18} color={colors.onBrand} />
          <Text style={styles.linkText}>{note.link.label}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 14,
    },
    summary: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '700',
      lineHeight: 26,
    },
    paragraph: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
    },
    example: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      gap: 4,
    },
    exampleLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    exampleText: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.brand,
      marginTop: 4,
    },
    linkText: {
      color: colors.onBrand,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
