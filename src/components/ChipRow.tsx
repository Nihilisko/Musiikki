import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

type Props = {
  options: string[];
  /** One selected index, or a list when several can be on at once. */
  selected: number | number[];
  onSelect: (index: number) => void;
};

/** A horizontally scrolling row of selectable buttons. */
export default function ChipRow({ options, selected, onSelect }: Props) {
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

const styles = StyleSheet.create({
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
    backgroundColor: '#2a2d31',
  },
  chipActive: {
    backgroundColor: '#f0b429',
  },
  text: {
    color: '#e8eaed',
    fontSize: 14,
  },
  textActive: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
});
