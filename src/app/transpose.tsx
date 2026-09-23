import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import Stepper from '../components/Stepper';
import { pitchClass } from '../music/scales';
import {
  capoOptions,
  guessKey,
  keyLabel,
  namesForKey,
  parseChart,
  transposeChord,
  type ChartToken,
} from '../music/transpose';
import { loadJson, saveJson } from '../state/storage';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

const CHART_KEY = 'transpose-chart';
const MAX_CAPO = 9;

// Capo & transpose: type a song's chords, move it to another key, and see the shapes to play
// with a capo.
export default function TransposeScreen() {
  const styles = useThemedStyles(makeStyles);
  const [chart, setChartState] = useState('');
  const [semitones, setSemitones] = useState(0);
  const [capo, setCapo] = useState(0);

  // Remember the last song, so it is still there next time.
  useEffect(() => {
    loadJson<string>(CHART_KEY).then((saved) => {
      if (typeof saved === 'string') setChartState(saved);
    });
  }, []);
  function setChart(text: string) {
    setChartState(text);
    saveJson(CHART_KEY, text);
  }

  const tokens = useMemo(() => parseChart(chart), [chart]);
  const chords = tokens.flatMap((t) => (t.chord ? [t.chord] : []));
  const key = guessKey(chords);
  const unknown = tokens.filter((t) => !t.chord).map((t) => t.text);

  // Transposed: how the song sounds. Shapes: what you finger with the capo on.
  const target = key && { tonic: pitchClass(key.tonic + semitones), minor: key.minor };
  const shapesKey = target && { tonic: pitchClass(target.tonic - capo), minor: target.minor };
  const soundingNames = target ? namesForKey(target) : [];
  const shapeNames = shapesKey ? namesForKey(shapesKey) : [];
  const options = capoOptions(
    chords.map((c) => ({ ...c, root: pitchClass(c.root + semitones) })),
  ).filter((o) => o.easy > 0);

  function renderRow(list: ChartToken[], shift: number, names: string[]) {
    return (
      <View style={styles.chips}>
        {list.map((t, i) => (
          <Text key={i} style={[styles.chip, !t.chord && styles.chipBad]}>
            {t.chord ? transposeChord(t.chord, shift, names) : t.text}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Song chords</Text>
      <TextInput
        value={chart}
        onChangeText={setChart}
        placeholder="e.g. G D Em C  (paste from a tab site)"
        placeholderTextColor={styles.placeholder.color}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {unknown.length > 0 && (
        <Text style={styles.warning}>Not recognised: {unknown.join(' ')}</Text>
      )}

      {key && target && shapesKey && (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>Transpose</Text>
            <View style={styles.row}>
              <Stepper
                value={semitones}
                min={-11}
                max={11}
                onChange={setSemitones}
                caption="semitones"
              />
              <Text style={styles.keys}>
                {keyLabel(key)}
                {semitones !== 0 && `  →  ${keyLabel(target)}`}
              </Text>
            </View>
            {renderRow(tokens, semitones, soundingNames)}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Capo</Text>
            <View style={styles.row}>
              <Stepper value={capo} min={0} max={MAX_CAPO} onChange={setCapo} caption="fret" />
              <Text style={styles.keys}>
                {capo === 0 ? 'No capo' : `Play ${keyLabel(shapesKey)} shapes`}
              </Text>
            </View>
            {capo > 0 && renderRow(tokens, semitones - capo, shapeNames)}

            {options.length > 0 && (
              <>
                <Text style={styles.small}>Easiest capo positions (open chord shapes):</Text>
                <View style={styles.chips}>
                  {options.slice(0, 4).map((o) => (
                    <Pressable
                      key={o.capo}
                      onPress={() => setCapo(o.capo)}
                      style={[styles.option, o.capo === capo && styles.optionOn]}
                    >
                      <Text style={[styles.optionText, o.capo === capo && styles.optionTextOn]}>
                        {o.capo === 0 ? 'No capo' : `Capo ${o.capo}`} · {o.easy}/{o.total} easy
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 10,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    input: {
      minHeight: 80,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: 17,
      textAlignVertical: 'top',
    },
    placeholder: {
      color: colors.textMuted,
    },
    warning: {
      color: colors.brand,
      fontSize: 13,
    },
    section: {
      gap: 10,
      marginTop: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    keys: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
      overflow: 'hidden',
    },
    chipBad: {
      color: colors.brand,
      textDecorationLine: 'line-through',
    },
    small: {
      color: colors.textMuted,
      fontSize: 13,
    },
    option: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    optionOn: {
      backgroundColor: colors.accent,
    },
    optionText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
    optionTextOn: {
      color: colors.onAccent,
    },
  });
}
