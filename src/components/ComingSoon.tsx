import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

/** Placeholder for screens that are not built yet. */
export default function ComingSoon({ items }: { items: string[] }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Coming soon</Text>
      {items.map((item) => (
        <Text key={item} style={styles.item}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  item: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
