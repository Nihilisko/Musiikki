import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import WoodGrain from '../components/WoodGrain';
import { useNoteColors } from '../state/NoteColorContext';
import { useWood } from '../state/WoodContext';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles, type ThemePreference } from '../theme/ThemeContext';
import { NOTE_PALETTE, type NoteRole } from '../theme/noteColors';
import { WOODS } from '../theme/woods';

const NOTE_ROLES: { role: NoteRole; title: string; sample: string }[] = [
  { role: 'root', title: 'Root note', sample: '1' },
  { role: 'scale', title: 'Scale notes', sample: '5' },
  { role: 'blue', title: 'Blue notes', sample: '♭5' },
];

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
  const { wood: currentWood, setWood } = useWood();
  const { choice, noteColors, setRoleColor, reset } = useNoteColors();

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

      <Text style={[styles.sectionLabel, styles.nextSection]}>Fretboard wood</Text>
      <View style={styles.woods}>
        {WOODS.map((wood) => {
          const selected = wood.id === currentWood.id;
          return (
            <Pressable
              key={wood.id}
              onPress={() => setWood(wood.id)}
              style={({ pressed }) => [
                styles.woodCard,
                selected && styles.woodSelected,
                pressed && styles.pressed,
              ]}
            >
              {/* A small piece of fretboard: the wood, two strings and an inlay dot. */}
              <View style={styles.sample}>
                <WoodGrain wood={wood} />
                <View style={[styles.sampleString, { top: 14, backgroundColor: wood.metal }]} />
                <View style={[styles.sampleString, { bottom: 14, backgroundColor: wood.metal }]} />
                <View style={[styles.sampleDot, { backgroundColor: wood.dot }]} />
              </View>
              <Text style={[styles.woodName, selected && styles.woodNameSelected]}>
                {wood.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.sectionHeader, styles.nextSection]}>
        <Text style={styles.sectionLabel}>Note colours</Text>
        <Pressable onPress={reset} hitSlop={8}>
          <Text style={styles.reset}>Reset</Text>
        </Pressable>
      </View>
      <View style={styles.group}>
        {NOTE_ROLES.map(({ role, title, sample }, i) => (
          <View key={role} style={[styles.colorRow, i > 0 && styles.rowDivider]}>
            <View style={styles.colorTitle}>
              {/* The note as it looks on the fretboard */}
              <View style={[styles.sampleNote, { backgroundColor: noteColors[role].background }]}>
                <Text style={[styles.sampleNoteText, { color: noteColors[role].text }]}>
                  {sample}
                </Text>
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>
            <View style={styles.swatches}>
              {NOTE_PALETTE.map((color) => {
                const selected = choice[role] === color.id;
                // A colour used by another role can't be picked, so the notes stay apart.
                const taken = !selected && Object.values(choice).includes(color.id);
                return (
                  <Pressable
                    key={color.id}
                    disabled={taken}
                    onPress={() => setRoleColor(role, color.id)}
                    accessibilityLabel={`${title}: ${color.name}`}
                    style={[
                      styles.swatch,
                      { backgroundColor: color.background },
                      selected && styles.swatchSelected,
                      taken && styles.swatchTaken,
                    ]}
                  >
                    {selected && <Ionicons name="checkmark" size={16} color={color.text} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    reset: {
      color: colors.accentText,
      fontSize: 13,
      fontWeight: '600',
    },
    colorRow: {
      padding: 14,
      gap: 10,
    },
    colorTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sampleNote: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sampleNoteText: {
      fontSize: 12,
      fontWeight: '700',
    },
    swatches: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    swatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchSelected: {
      borderColor: colors.text,
    },
    swatchTaken: {
      opacity: 0.2,
    },
    nextSection: {
      marginTop: 24,
    },
    woods: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    woodCard: {
      width: '30%',
      flexGrow: 1,
      padding: 6,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: colors.surface,
      gap: 6,
    },
    woodSelected: {
      borderColor: colors.accent,
    },
    sample: {
      height: 56,
      borderRadius: 6,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sampleString: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
    },
    sampleDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      opacity: 0.5,
    },
    woodName: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    woodNameSelected: {
      color: colors.text,
    },
  });
}
