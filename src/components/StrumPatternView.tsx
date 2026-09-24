import { StyleSheet, Text, View } from 'react-native';

import { STEP_COUNTS, type StrumPattern } from '../music/strums';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

type Props = {
  pattern: StrumPattern;
  /** Step sounding now (0-7), or -1 when stopped. */
  step: number;
};

/**
 * A strumming pattern as a row of arrows over the count "1 & 2 & 3 & 4 &".
 * The step sounding now lights up, so you can strum along.
 */
export default function StrumPatternView({ pattern, step }: Props) {
  const styles = useThemedStyles(makeStyles);
  const spoken = pattern.strokes.map((s) => s ?? 'miss').join(', ');
  return (
    <View style={styles.wrap} accessibilityLabel={`${pattern.name}: ${spoken}`}>
      <View style={styles.row}>
        {pattern.strokes.map((stroke, i) => {
          const now = i === step;
          return (
            <View
              key={i}
              style={[styles.cell, now && styles.cellNow, now && !stroke && styles.missNow]}
            >
              <Text
                style={[styles.arrow, !stroke && styles.miss, now && stroke && styles.arrowNow]}
              >
                {stroke === 'down' ? '↓' : stroke === 'up' ? '↑' : '·'}
              </Text>
              <Text style={[styles.count, now && styles.countNow]}>{STEP_COUNTS[i]}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.tip}>
        <Text style={styles.level}>{pattern.level} · </Text>
        {pattern.tip}
      </Text>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    wrap: {
      gap: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.surface,
    },
    row: {
      flexDirection: 'row',
      gap: 4,
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
      borderRadius: 10,
    },
    cellNow: {
      backgroundColor: colors.brand,
    },
    missNow: {
      backgroundColor: colors.border,
    },
    arrow: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
      lineHeight: 36,
    },
    arrowNow: {
      color: colors.onBrand,
    },
    miss: {
      color: colors.textMuted,
    },
    count: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    countNow: {
      color: colors.onBrand,
    },
    tip: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    level: {
      color: colors.accentText,
      fontWeight: '700',
    },
  });
}
