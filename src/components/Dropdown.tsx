import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
} from 'react-native';

import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

type Props = {
  /** Text on the button, e.g. the current choice. */
  label: string;
  options: string[];
  /** One selected index, or a list when several can be on at once (`multi`). */
  selected: number | number[];
  onSelect: (index: number) => void;
  /** Several options can be on; the list stays open so you can switch more than one. */
  multi?: boolean;
  /** Background colour for each option when it is on (e.g. chord colours). */
  optionColors?: string[];
};

/**
 * A compact button that opens a list of options below it.
 * Tapping outside the list closes it.
 */
export default function Dropdown({
  label,
  options,
  selected,
  onSelect,
  multi,
  optionColors,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const [button, setButton] = useState<View | null>(null);

  function openList() {
    // Measure where the button is on screen, so the list opens right under it.
    button?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  }

  function choose(index: number) {
    onSelect(index);
    if (!multi) setOpen(false);
  }

  const isOn = (i: number) => (Array.isArray(selected) ? selected.includes(i) : selected === i);

  return (
    <>
      <Pressable ref={setButton} onPress={openList} style={styles.button}>
        <Text style={styles.buttonText} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.accentText} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent // the list is placed in window coordinates, status bar included
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => setOpen(false)}
      >
        {/* The whole screen behind the list: tap to close. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        {anchor && (
          <View
            style={[
              styles.list,
              { top: anchor.y + anchor.height + 4, left: anchor.x, minWidth: anchor.width },
            ]}
          >
            <ScrollView>
              {options.map((option, i) => {
                const on = isOn(i);
                const color = optionColors?.[i] ?? colors.accent;
                // Chord colours are dark enough for white text; the accent has its own text colour.
                const onText = optionColors ? '#ffffff' : colors.onAccent;
                return (
                  <Pressable
                    key={option}
                    onPress={() => choose(i)}
                    style={[styles.option, on && { backgroundColor: color }]}
                  >
                    {multi && (
                      <Ionicons
                        name={on ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={on ? onText : colors.textMuted}
                      />
                    )}
                    <Text
                      style={[styles.optionText, on && [styles.optionTextOn, { color: onText }]]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Modal>
    </>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      maxWidth: 200,
    },
    buttonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      flexShrink: 1,
    },
    list: {
      position: 'absolute',
      maxHeight: 260,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 4,
      overflow: 'hidden',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    optionText: {
      color: colors.text,
      fontSize: 15,
    },
    optionTextOn: {
      fontWeight: '700',
    },
  });
}
