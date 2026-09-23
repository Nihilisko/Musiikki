import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { THEORY_SECTIONS } from '../content/theoryNotes';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

// The list of theory notes, in sections from the basics up.
export default function NotesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {THEORY_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.group}>
            {section.notes.map((note, i) => (
              <Pressable
                key={note.id}
                onPress={() => router.push({ pathname: '/note', params: { id: note.id } })}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.text}>
                  <Text style={styles.title}>{note.title}</Text>
                  <Text style={styles.summary}>{note.summary}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 20,
    },
    section: {
      gap: 8,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    group: {
      borderRadius: 14,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
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
      fontSize: 16,
      fontWeight: '700',
    },
    summary: {
      color: colors.textMuted,
      fontSize: 13,
    },
  });
}
