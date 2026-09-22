import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Small text under the number, e.g. "Whole neck". */
  caption: string;
};

/** A − value + counter. The buttons stop at `min` and `max`. */
export default function Stepper({ value, min, max, onChange, caption }: Props) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.stepper}>
      <StepButton icon="remove" disabled={value <= min} onPress={() => onChange(value - 1)} />
      <View style={styles.middle}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      </View>
      <StepButton icon="add" disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

type StepButtonProps = { icon: 'add' | 'remove'; disabled: boolean; onPress: () => void };

function StepButton({ icon, disabled, onPress }: StepButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.dim]}
    >
      <Ionicons name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    button: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.border,
    },
    dim: {
      opacity: 0.4,
    },
    middle: {
      alignItems: 'center',
      minWidth: 64,
    },
    value: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
    caption: {
      color: colors.text, // brighter than the muted grey, so it reads well on the button
      opacity: 0.85,
      fontSize: 10,
    },
  });
}
