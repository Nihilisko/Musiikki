import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

type Props = {
  options: string[];
  /** One selected index, or a list when several can be on at once. */
  selected: number | number[];
  onSelect: (index: number) => void;
};

/** A horizontally scrolling row of selectable buttons. */
export default function ChipRow({ options, selected, onSelect }: Props) {
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {options.map((label, index) => {
        const active = Array.isArray(selected) ? selected.includes(index) : index === selected;
        return (
          <Pressable
            key={label}
            onPress={() => onSelect(index)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    scroll: {
      flexGrow: 0,
    },
    row: {
      gap: 8,
      paddingHorizontal: 16,
    },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.accent,
    },
    text: {
      color: colors.text,
      fontSize: 14,
    },
    textActive: {
      color: colors.onAccent,
      fontWeight: '700',
    },
  });
}
