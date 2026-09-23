import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import ChipRow from '../components/ChipRow';
import ChordDiagram from '../components/ChordDiagram';
import KeyPicker from '../components/KeyPicker';
import { CHORD_TYPES } from '../music/chords';
import { pitchClass } from '../music/scales';
import { spellChord } from '../music/spelling';
import { chordVoicings } from '../music/voicings';
import { useInstrument } from '../state/InstrumentContext';
import { useNoteColors } from '../state/NoteColorContext';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const LABEL_OPTIONS = ['Names', 'Degrees'];

// The chord book: pick a root and a chord type, and see playable shapes for the chosen
// instrument and tuning, worked out rather than looked up.
export default function ChordsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const { instrument, tuning } = useInstrument();
  const { noteColors } = useNoteColors();
  const [root, setRoot] = useState(0);
  const [type, setType] = useState(0);
  const [labelOption, setLabelOption] = useState(0);

  const chord = CHORD_TYPES[type];
  const spelled = spellChord(root, chord);
  const voicings = useMemo(
    () => chordVoicings(tuning.strings, root, chord),
    [tuning.strings, root, chord],
  );

  // Text for each pitch class: its name in this chord, or its degree (1, ♭3, 5…).
  const labels: (string | undefined)[] = new Array(12).fill(undefined);
  for (const tone of chord.tones) {
    const pc = pitchClass(root + tone.interval);
    labels[pc] = labelOption === 0 ? spelled.names[pc] : tone.degree;
  }
  const noteList = chord.tones.map((t) => spelled.names[pitchClass(root + t.interval)]).join(' ');

  // Two diagrams side by side on a phone, more on wider screens.
  const columns = width >= 700 ? 3 : 2;
  const cardWidth = (width - 32 - (columns - 1) * 12) / columns;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        {instrument.name} · {tuning.name}
      </Text>

      <View style={styles.row}>
        <KeyPicker root={root} rootName={spelled.rootName} onChange={setRoot} />
        <ChipRow options={LABEL_OPTIONS} selected={labelOption} onSelect={setLabelOption} />
      </View>
      <ChipRow options={CHORD_TYPES.map((c) => c.name)} selected={type} onSelect={setType} />

      <View style={styles.heading}>
        <Text style={styles.chordName}>
          {spelled.rootName}
          {chord.symbol}
        </Text>
        <Text style={styles.notes}>{noteList}</Text>
      </View>

      {voicings.length === 0 ? (
        <Text style={styles.empty}>
          No playable shape for this chord in this tuning. Try another chord type or tuning.
        </Text>
      ) : (
        <View style={styles.grid}>
          {voicings.map((v) => (
            <View key={v.frets.join(',')} style={[styles.card, { width: cardWidth }]}>
              <ChordDiagram
                strings={tuning.strings}
                frets={v.frets}
                root={root}
                labels={labels}
                noteColors={noteColors}
                lineColor={colors.textMuted}
                textColor={colors.text}
                width={cardWidth - 16}
              />
              <Text style={styles.shape}>{v.frets.map((f) => (f < 0 ? '×' : f)).join(' ')}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 12,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 13,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heading: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 12,
      marginTop: 4,
    },
    chordName: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
    },
    notes: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '600',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    card: {
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: colors.surface,
      gap: 4,
    },
    shape: {
      color: colors.textMuted,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
      letterSpacing: 1,
    },
    empty: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 24,
    },
  });
}
