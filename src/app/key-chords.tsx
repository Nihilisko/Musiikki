import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ChipRow from '../components/ChipRow';
import KeyPicker from '../components/KeyPicker';
import { KEY_SCALES, keyChords, type HarmonicFunction } from '../music/keyChords';
import { spellScale } from '../music/spelling';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

// One colour per function, so the three groups stand out in the table.
const FUNCTION_COLORS: Record<HarmonicFunction, string> = {
  Tonic: '#2e9d57',
  Subdominant: '#1e7be0',
  Dominant: '#d93a3a',
};

const FUNCTION_HINTS: Record<HarmonicFunction, string> = {
  Tonic: 'home, rest',
  Subdominant: 'moving away',
  Dominant: 'tension, wants to go home',
};

// The chords of a key in a table: degree, triad, seventh chord and function. Tapping a chord
// opens its shapes in the chord book.
export default function KeyChordsScreen() {
  const styles = useThemedStyles(makeStyles);
  const [tonic, setTonic] = useState(0);
  const [scaleIndex, setScaleIndex] = useState(0);

  const { scale } = KEY_SCALES[scaleIndex];
  const rows = keyChords(tonic, scale);
  const tonicName = spellScale(tonic, scale).rootName;

  function openChord(root: number, type?: number) {
    if (type === undefined) return;
    router.push({ pathname: '/chords', params: { root: String(root), type: String(type) } });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <KeyPicker root={tonic} rootName={tonicName} onChange={setTonic} />
        <ChipRow
          options={KEY_SCALES.map((k) => k.label)}
          selected={scaleIndex}
          onSelect={setScaleIndex}
        />
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.headerRow]}>
          <Text style={[styles.header, styles.colDegree]}>Degree</Text>
          <Text style={[styles.header, styles.colChord]}>Triad</Text>
          <Text style={[styles.header, styles.colChord]}>Seventh</Text>
          <Text style={[styles.header, styles.colFunction]}>Function</Text>
        </View>
        {rows.map((r) => (
          <View key={r.numeral} style={styles.tableRow}>
            <Text
              style={[styles.numeral, styles.colDegree, { color: FUNCTION_COLORS[r.function] }]}
            >
              {r.numeral}
            </Text>
            <Pressable
              onPress={() => openChord(r.root, r.triadType)}
              style={[styles.colChord, styles.chordCell]}
              accessibilityLabel={`Open ${r.triad} in the chord book`}
            >
              <Text style={styles.chord}>{r.triad}</Text>
            </Pressable>
            <Pressable
              onPress={() => openChord(r.root, r.seventhType)}
              disabled={r.seventhType === undefined}
              style={[styles.colChord, styles.chordCell]}
              accessibilityLabel={`Open ${r.seventh} in the chord book`}
            >
              <Text style={styles.chord}>{r.seventh}</Text>
            </Pressable>
            <Text
              style={[styles.function, styles.colFunction, { color: FUNCTION_COLORS[r.function] }]}
            >
              {r.function}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        {(Object.keys(FUNCTION_COLORS) as HarmonicFunction[]).map((f) => (
          <Text key={f} style={styles.legendText}>
            <Text style={{ color: FUNCTION_COLORS[f], fontWeight: '700' }}>{f}</Text>:{' '}
            {FUNCTION_HINTS[f]}
          </Text>
        ))}
        <Text style={styles.legendText}>Tap a chord to see its shapes.</Text>
        {KEY_SCALES[scaleIndex].id === 'harmonic' && (
          <Text style={styles.legendText}>
            Harmonic minor raises the 7th note, so V becomes major ({rows[4].triad}) and pulls
            strongly home to {rows[0].triad}.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 14,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    table: {
      borderRadius: 14,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    headerRow: {
      borderTopWidth: 0,
      paddingVertical: 10,
    },
    header: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    colDegree: {
      width: 64,
    },
    colChord: {
      flex: 1,
    },
    colFunction: {
      width: 96,
      textAlign: 'right',
    },
    numeral: {
      fontSize: 18,
      fontWeight: '800',
    },
    chordCell: {
      paddingVertical: 10,
    },
    chord: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    function: {
      fontSize: 12,
      fontWeight: '700',
    },
    legend: {
      gap: 4,
    },
    legendText: {
      color: colors.textMuted,
      fontSize: 13,
    },
  });
}
