import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import ChipRow from '../components/ChipRow';
import Fretboard from '../components/Fretboard';
import { NOTE_NAMES } from '../music/notes';
import { SCALES, scalePitchClasses } from '../music/scales';
import { useInstrument } from '../state/InstrumentContext';
import { colors } from '../theme/colors';

// First option shows every note; the rest are the scales.
const SCALE_OPTIONS = ['All notes', ...SCALES.map((s) => s.name)];

export default function ScalesScreen() {
  const { instrument, tuning } = useInstrument();
  const [root, setRoot] = useState(0); // pitch class, 0 = C
  const [scaleOption, setScaleOption] = useState(0);

  const scale = scaleOption > 0 ? SCALES[scaleOption - 1] : undefined;
  const highlight = scale ? { root, pitchClasses: scalePitchClasses(root, scale) } : undefined;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Key</Text>
      <ChipRow options={NOTE_NAMES} selected={root} onSelect={setRoot} />

      <Text style={styles.sectionLabel}>Scale</Text>
      <ChipRow options={SCALE_OPTIONS} selected={scaleOption} onSelect={setScaleOption} />

      <View style={styles.fretboard}>
        <Fretboard
          strings={tuning.strings}
          frets={instrument.frets}
          octaveCourses={instrument.octaveCourses}
          highlight={highlight}
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
  fretboard: {
    marginTop: 24,
    paddingLeft: 12,
  },
});
