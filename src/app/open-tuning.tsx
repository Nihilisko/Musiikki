import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import BackButton from '../components/BackButton';
import ChipRow from '../components/ChipRow';
import KeyPicker from '../components/KeyPicker';
import SlideMap from '../components/SlideMap';
import type { KeyMode } from '../music/circle';
import { slideChart, tuningChord } from '../music/openTuning';
import { keyScale } from '../music/progressions';
import { spellScale } from '../music/spelling';
import { useInstrument } from '../state/InstrumentContext';
import { useLandscape } from '../state/orientation';
import { useWood } from '../state/WoodContext';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const MODES: KeyMode[] = ['major', 'minor'];
const MODE_OPTIONS = ['Major', 'Minor'];
const SHOW_OPTIONS = ['I – IV – V', 'All chords'];

// Where the chords of a key are in an open tuning: lay a slide (or one finger) across all
// strings at the bar. Minor chords need the dotted strings a fret lower.
export default function OpenTuningScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const { instrument, tuning } = useInstrument();
  const { wood } = useWood();
  const chordOfTuning = tuningChord(tuning.strings);
  const [tonic, setTonic] = useState(chordOfTuning?.root ?? 0); // start in the tuning's key
  const [modeIndex, setModeIndex] = useState(0);
  const [show, setShow] = useState(0);

  useLandscape();

  const mode = MODES[modeIndex];
  const chords = slideChart(tuning.strings, tonic, mode, instrument.frets);
  const tonicName = spellScale(tonic, keyScale(mode)).rootName;
  const primary = chords.filter((c) => c.primary);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.bar}>
        <BackButton label="Chords" />
        <KeyPicker root={tonic} rootName={tonicName} onChange={setTonic} />
        <ChipRow options={MODE_OPTIONS} selected={modeIndex} onSelect={setModeIndex} />
        <ChipRow options={SHOW_OPTIONS} selected={show} onSelect={setShow} />
      </View>

      <SlideMap
        strings={tuning.strings}
        frets={instrument.frets}
        chords={chords}
        primaryOnly={show === 0}
        flats={tuning.flats}
        wood={wood}
        textColor={colors.text}
        mutedTextColor={colors.textMuted}
        width={width - 32}
      />

      <Text style={styles.status}>
        <Text style={styles.title}>
          {tonicName} {mode} in {tuning.name}
        </Text>
        {'   '}
        {primary
          .map((c) => `${c.numeral} ${c.name}: ${c.positions.map((p) => p.fret).join(' / ')}`)
          .join('   ·   ')}
      </Text>
      <Text style={styles.hint}>
        {chordOfTuning?.third === null
          ? 'These strings have no 3rd, so each bar sounds as a power chord and fits both major and minor.'
          : 'Bars are major chords. For minor chords press the dotted strings a fret lower. With a slide, hold it right over the fret wire.'}
      </Text>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingTop: 12,
      gap: 10,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    status: {
      color: colors.textMuted,
      fontSize: 14,
    },
    title: {
      color: colors.text,
      fontWeight: '700',
    },
    hint: {
      color: colors.textMuted,
      fontSize: 12,
    },
  });
}
