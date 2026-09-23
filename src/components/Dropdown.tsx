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
  /** Small headings shown above some options, by option index, e.g. { 27: 'My scales' }. */
  headers?: Record<number, string>;
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
  headers,
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
                  <View key={`${i}-${option}`}>
                    {headers?.[i] !== undefined && <Text style={styles.header}>{headers[i]}</Text>}
                    <Pressable
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
                  </View>
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
    header: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
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
