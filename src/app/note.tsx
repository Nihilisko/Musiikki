import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { findNote, type NoteBlock } from '../content/theoryNotes';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

type Styles = ReturnType<typeof makeStyles>;

/** Text with **double stars** around the words to show in bold. */
function RichText({ text, style, boldStyle }: { text: string; style: object; boldStyle: object }) {
  const parts = text.split('**');
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={boldStyle}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

function Block({ block, styles }: { block: NoteBlock; styles: Styles }) {
  switch (block.type) {
    case 'heading':
      return <Text style={styles.heading}>{block.text}</Text>;
    case 'text':
      return <RichText text={block.text} style={styles.text} boldStyle={styles.bold} />;
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <RichText
                text={item}
                style={[styles.text, styles.listText]}
                boldStyle={styles.bold}
              />
            </View>
          ))}
        </View>
      );
    case 'table':
      return (
        <View style={styles.table}>
          {block.header && (
            <View style={[styles.tableRow, styles.tableHeader]}>
              {block.header.map((cell, i) => (
                <Text key={i} style={[styles.cell, styles.headerCell, i === 0 && styles.firstCell]}>
                  {cell}
                </Text>
              ))}
            </View>
          )}
          {block.rows.map((row, r) => (
            <View key={r} style={[styles.tableRow, r % 2 === 1 && styles.stripe]}>
              {row.map((cell, i) => (
                <Text key={i} style={[styles.cell, i === 0 && styles.firstCell]}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
  }
}

// One theory note: the main idea first, then short blocks (text, lists, tables), an example
// and a button that opens the idea in the app.
export default function NoteScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const note = findNote(id);

  if (!note) {
    return (
      <View style={styles.content}>
        <Text style={styles.text}>This note could not be found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: note.title }} />
      <View style={styles.keyIdea}>
        <Text style={styles.keyIdeaLabel}>Key idea</Text>
        <Text style={styles.keyIdeaText}>{note.summary}</Text>
      </View>

      {note.blocks.map((block, i) => (
        <Block key={i} block={block} styles={styles} />
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
      padding: 20,
      gap: 16,
      paddingBottom: 40,
    },
    keyIdea: {
      padding: 16,
      borderRadius: 14,
      backgroundColor: colors.surface,
      gap: 6,
    },
    keyIdeaLabel: {
      color: colors.accentText,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    keyIdeaText: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '700',
      lineHeight: 27,
    },
    heading: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: 8,
      marginBottom: -6,
    },
    text: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 26,
    },
    bold: {
      fontWeight: '800',
    },
    list: {
      gap: 10,
    },
    listItem: {
      flexDirection: 'row',
      gap: 10,
    },
    bullet: {
      color: colors.accentText,
      fontSize: 16,
      lineHeight: 26,
      fontWeight: '800',
    },
    listText: {
      flex: 1,
    },
    table: {
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 9,
      paddingHorizontal: 10,
      backgroundColor: colors.background,
    },
    tableHeader: {
      backgroundColor: colors.surface,
    },
    stripe: {
      backgroundColor: colors.surface,
    },
    cell: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    firstCell: {
      fontWeight: '700',
    },
    headerCell: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
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
      lineHeight: 23,
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
