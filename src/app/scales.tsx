import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import ChipRow from '../components/ChipRow';
import Fretboard, { type LabelMode } from '../components/Fretboard';
import { degreeLabels } from '../music/degrees';
import { KEY_NAMES } from '../music/notes';
import { SCALES, scalePitchClasses } from '../music/scales';
import { spellScale } from '../music/spelling';
import { useInstrument } from '../state/InstrumentContext';
import { colors } from '../theme/colors';

// First option shows every note; the rest are the scales.
const SCALE_OPTIONS = ['All notes', ...SCALES.map((s) => s.name)];

const LABEL_MODES: LabelMode[] = ['names', 'degrees', 'both'];
const LABEL_OPTIONS = ['Names', 'Degrees', 'Both'];

export default function ScalesScreen() {
  const { instrument, tuning } = useInstrument();
  const [root, setRoot] = useState(0); // pitch class, 0 = C
  const [scaleOption, setScaleOption] = useState(0);
  const [labelOption, setLabelOption] = useState(0);

  const scale = scaleOption > 0 ? SCALES[scaleOption - 1] : undefined;
  const highlight = scale ? { root, pitchClasses: scalePitchClasses(root, scale) } : undefined;
  const spelled = spellScale(root, scale);
  // The scale's notes in order, e.g. "A C D E♭ E G".
  const scaleNotes = scale
    ? scale.intervals.map((interval) => spelled.names[(root + interval) % 12]).join('  ')
    : '';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Key</Text>
      <ChipRow options={KEY_NAMES} selected={root} onSelect={setRoot} />

      <Text style={styles.sectionLabel}>Scale</Text>
      <ChipRow options={SCALE_OPTIONS} selected={scaleOption} onSelect={setScaleOption} />

      <Text style={styles.sectionLabel}>Labels</Text>
      <ChipRow options={LABEL_OPTIONS} selected={labelOption} onSelect={setLabelOption} />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>
          {spelled.rootName} {scale ? scale.name : '(all notes)'}
        </Text>
        {scale && <Text style={styles.summaryNotes}>{scaleNotes}</Text>}
      </View>

      <View style={styles.fretboard}>
        <Fretboard
          strings={tuning.strings}
          frets={instrument.frets}
          octaveCourses={instrument.octaveCourses}
          highlight={highlight}
          labelMode={LABEL_MODES[labelOption]}
          degreeLabels={degreeLabels(root, scale)}
          noteNames={spelled.names}
          flats={tuning.flats}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  summary: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 4,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  summaryNotes: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '600',
  },
  fretboard: {
    marginTop: 16,
    paddingLeft: 12,
  },
});
