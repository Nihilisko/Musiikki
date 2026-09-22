import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import ChipRow from './src/components/ChipRow';
import Fretboard from './src/components/Fretboard';
import { INSTRUMENTS } from './src/music/instruments';
import { NOTE_NAMES, noteName } from './src/music/notes';
import { SCALES, scalePitchClasses } from './src/music/scales';

// First option shows every note; the rest are the scales.
const SCALE_OPTIONS = ['All notes', ...SCALES.map((s) => s.name)];

export default function App() {
  const [instrumentIndex, setInstrumentIndex] = useState(0);
  const [tuningIndex, setTuningIndex] = useState(0);
  const [root, setRoot] = useState(0); // pitch class, 0 = C
  const [scaleOption, setScaleOption] = useState(0);

  const instrument = INSTRUMENTS[instrumentIndex];
  const tuning = instrument.tunings[tuningIndex];
  const scale = scaleOption > 0 ? SCALES[scaleOption - 1] : undefined;
  const highlight = scale ? { root, pitchClasses: scalePitchClasses(root, scale) } : undefined;

  function selectInstrument(index: number) {
    setInstrumentIndex(index);
    setTuningIndex(0); // every instrument has different tunings
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar style="light" />
      <Text style={styles.title}>Fretboard</Text>

      <Text style={styles.sectionLabel}>Instrument</Text>
      <ChipRow
        options={INSTRUMENTS.map((i) => i.name)}
        selected={instrumentIndex}
        onSelect={selectInstrument}
      />

      <Text style={styles.sectionLabel}>Tuning</Text>
      <ChipRow
        options={instrument.tunings.map((t) => t.name)}
        selected={tuningIndex}
        onSelect={setTuningIndex}
      />

      <Text style={styles.sectionLabel}>Key</Text>
      <ChipRow options={NOTE_NAMES} selected={root} onSelect={setRoot} />

      <Text style={styles.sectionLabel}>Scale</Text>
      <ChipRow options={SCALE_OPTIONS} selected={scaleOption} onSelect={setScaleOption} />

      <Text style={styles.tuningNotes}>{tuning.strings.map(noteName).join(' ')}</Text>

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
  screen: {
    flex: 1,
    backgroundColor: '#141518',
  },
  content: {
    paddingTop: 48,
    paddingBottom: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    color: '#9aa0a6',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  tuningNotes: {
    color: '#f0b429',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  fretboard: {
    marginTop: 16,
    paddingLeft: 12,
  },
});
