import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { CIRCLE_ROOTS, circleSegment } from '../music/circle';
import { darkColors, type Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

type Props = {
  /** Pitch class of the chosen key (0 = C). */
  root: number;
  /** Name shown on the button, spelled for the current scale (e.g. "E♭"). */
  rootName: string;
  onChange: (root: number) => void;
};

const SIZE = 260;
const NOTE = 46;

/**
 * A "Key: C" button that opens the 12 keys on a circle, in circle-of-fifths order
 * like the circle of fifths screen. Tap a key to choose it; the circle closes.
 */
export default function KeyPicker({ root, rootName, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);

  function choose(pc: number) {
    onChange(pc);
    setOpen(false);
  }

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.button}>
        <Text style={styles.buttonText}>Key: {rootName}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.accentText} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => setOpen(false)}
      >
        {/* Dimmed screen behind the circle: tap to close without choosing. */}
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Taps on the disc itself (between the keys) should not close it. */}
          <Pressable style={styles.disc} onPress={() => {}}>
            <Text style={styles.centreText}>Key</Text>
            {CIRCLE_ROOTS.map((pc, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const r = SIZE / 2 - NOTE / 2 - 8;
              const selected = pc === root;
              return (
                <Pressable
                  key={pc}
                  onPress={() => choose(pc)}
                  style={[
                    styles.note,
                    {
                      left: SIZE / 2 + r * Math.sin(angle) - NOTE / 2,
                      top: SIZE / 2 - r * Math.cos(angle) - NOTE / 2,
                    },
                    selected && styles.selected,
                  ]}
                >
                  <Text style={[styles.noteText, selected && styles.selectedText]}>
                    {circleSegment(i).major}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function makeStyles(colors: Colors) {
  // The circle itself is dark in both themes, like the circle of fifths.
  const disc = darkColors;
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    buttonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    disc: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      backgroundColor: '#0f0b09',
      borderWidth: 1.5,
      borderColor: '#9a8b7e',
      alignItems: 'center',
      justifyContent: 'center',
    },
    centreText: {
      color: disc.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    note: {
      position: 'absolute',
      width: NOTE,
      height: NOTE,
      borderRadius: NOTE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: disc.surface,
    },
    selected: {
      backgroundColor: disc.accent,
    },
    noteText: {
      color: disc.text,
      fontSize: 16,
      fontWeight: '700',
    },
    selectedText: {
      color: disc.onAccent,
    },
  });
}
