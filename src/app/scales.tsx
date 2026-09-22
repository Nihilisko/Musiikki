import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import ChipRow from '../components/ChipRow';
import Fretboard, { type Highlight, type LabelMode } from '../components/Fretboard';
import { BLUE_NOTES } from '../music/blueNotes';
import { CHORD_TYPES } from '../music/chords';
import { degreeLabels } from '../music/degrees';
import { KEY_NAMES } from '../music/notes';
import {
  arpeggioPosition,
  cellKey,
  positionCount,
  positionName,
  scalePosition,
  type Cell,
} from '../music/positions';
import { pitchClass, SCALES, scalePitchClasses } from '../music/scales';
import { spellChord, spellScale } from '../music/spelling';
import { useInstrument } from '../state/InstrumentContext';
import { noteColors, type Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

const MODE_OPTIONS = ['Scales', 'Arpeggios'];
// First option shows every note; the rest are the scales.
const SCALE_OPTIONS = ['All notes', ...SCALES.map((s) => s.name)];
const CHORD_OPTIONS = CHORD_TYPES.map((c) => c.name);

const LABEL_MODES: LabelMode[] = ['names', 'degrees', 'both'];
const LABEL_OPTIONS = ['Names', 'Degrees', 'Both'];
const BLUE_OPTIONS = BLUE_NOTES.map((b) => b.label);

/** Everything the fretboard and summary need, for either a scale or an arpeggio. */
type FretboardView = {
  title: string;
  /** The notes in order, e.g. "A C D E♭ E G". */
  notes: string;
  highlight?: Highlight;
  noteNames: (string | undefined)[];
  degrees: string[];
  positionOptions: string[];
  cells?: Cell[];
};

export default function ScalesScreen() {
  const styles = useThemedStyles(makeStyles);
  const { instrument, tuning } = useInstrument();
  const [modeOption, setModeOption] = useState(0); // 0 = scales, 1 = arpeggios
  const [root, setRoot] = useState(0); // pitch class, 0 = C
  const [scaleOption, setScaleOption] = useState(0);
  const [chordOption, setChordOption] = useState(0);
  const [labelOption, setLabelOption] = useState(0);
  const [blueOptions, setBlueOptions] = useState<number[]>([]); // which BLUE_NOTES are on
  const [positionOption, setPositionOption] = useState(0); // 0 = whole neck

  const isArpeggio = modeOption === 1;

  // Scales and chords have different numbers of positions, so start again from the whole neck.
  function selectMode(option: number) {
    setModeOption(option);
    setPositionOption(0);
  }
  function selectScale(option: number) {
    setScaleOption(option);
    setPositionOption(0);
  }
  function selectChord(option: number) {
    setChordOption(option);
    setPositionOption(0);
  }
  function toggleBlue(index: number) {
    setBlueOptions((current) =>
      current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
    );
  }

  const blueIntervals = isArpeggio ? [] : blueOptions.map((i) => BLUE_NOTES[i].interval);
  const blueNotes = blueIntervals.map((interval) => pitchClass(root + interval));
  const view = isArpeggio
    ? arpeggioView(tuning.strings, root, chordOption, positionOption)
    : scaleView(tuning.strings, root, scaleOption, positionOption, blueIntervals);

  const visibleCells = view.cells && new Set(view.cells.map((c) => cellKey(c.string, c.fret)));
  const firstFret = view.cells ? Math.min(...view.cells.map((c) => c.fret)) : 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.modeRow}>
        <ChipRow options={MODE_OPTIONS} selected={modeOption} onSelect={selectMode} />
      </View>

      <Text style={styles.sectionLabel}>Key</Text>
      <ChipRow options={KEY_NAMES} selected={root} onSelect={setRoot} />

      {isArpeggio ? (
        <>
          <Text style={styles.sectionLabel}>Chord</Text>
          <ChipRow options={CHORD_OPTIONS} selected={chordOption} onSelect={selectChord} />
        </>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Scale</Text>
          <ChipRow options={SCALE_OPTIONS} selected={scaleOption} onSelect={selectScale} />
        </>
      )}

      {view.positionOptions.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Position</Text>
          <ChipRow
            options={view.positionOptions}
            selected={positionOption}
            onSelect={setPositionOption}
          />
        </>
      )}

      <Text style={styles.sectionLabel}>Labels</Text>
      <ChipRow options={LABEL_OPTIONS} selected={labelOption} onSelect={setLabelOption} />

      {!isArpeggio && (
        <>
          <Text style={styles.sectionLabel}>Blue notes</Text>
          <ChipRow options={BLUE_OPTIONS} selected={blueOptions} onSelect={toggleBlue} />
        </>
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{view.title}</Text>
        {view.notes !== '' && <Text style={styles.summaryNotes}>{view.notes}</Text>}
        {blueNotes.length > 0 && (
          <Text style={styles.summaryBlue}>
            Blue notes: {blueNotes.map((pc) => view.noteNames[pc]).join('  ')}
          </Text>
        )}
      </View>

      <View style={styles.fretboard}>
        <Fretboard
          strings={tuning.strings}
          frets={instrument.frets}
          octaveCourses={instrument.octaveCourses}
          highlight={view.highlight}
          labelMode={LABEL_MODES[labelOption]}
          degreeLabels={view.degrees}
          noteNames={view.noteNames}
          flats={tuning.flats}
          blueNotes={blueNotes}
          visibleCells={visibleCells}
          scrollToFret={firstFret}
        />
      </View>
    </ScrollView>
  );
}

function scaleView(
  strings: number[],
  root: number,
  scaleOption: number,
  positionOption: number,
  blueIntervals: number[],
): FretboardView {
  const scale = scaleOption > 0 ? SCALES[scaleOption - 1] : undefined;
  const spelled = spellScale(root, scale, blueIntervals);
  if (!scale) {
    return {
      title: `${spelled.rootName} (all notes)`,
      notes: '',
      noteNames: spelled.names,
      degrees: degreeLabels(root),
      positionOptions: [],
    };
  }
  const count = positionCount(scale);
  const blueNotes = blueIntervals.map((interval) => pitchClass(root + interval));
  return {
    title: `${spelled.rootName} ${scale.name}`,
    notes: scale.intervals.map((i) => spelled.names[pitchClass(root + i)]).join('  '),
    highlight: { root, pitchClasses: scalePitchClasses(root, scale) },
    noteNames: spelled.names,
    degrees: degreeLabels(root, scale),
    positionOptions:
      count > 0
        ? ['Whole neck', ...Array.from({ length: count }, (_, i) => positionName(scale, i))]
        : [],
    cells:
      positionOption > 0
        ? scalePosition(strings, root, scale, positionOption - 1, blueNotes)
        : undefined,
  };
}

function arpeggioView(
  strings: number[],
  root: number,
  chordOption: number,
  positionOption: number,
): FretboardView {
  const chord = CHORD_TYPES[chordOption];
  const spelled = spellChord(root, chord);
  const intervals = chord.tones.map((t) => t.interval);
  // Degree names come from the chord (♯5, ♭♭7), not from a scale.
  const degrees: string[] = new Array(12).fill('');
  chord.tones.forEach((t) => (degrees[pitchClass(root + t.interval)] = t.degree));

  return {
    title: `${spelled.rootName}${chord.symbol} arpeggio`,
    notes: chord.tones.map((t) => spelled.names[pitchClass(root + t.interval)]).join('  '),
    highlight: { root, pitchClasses: intervals.map((i) => pitchClass(root + i)) },
    noteNames: spelled.names,
    degrees,
    positionOptions: ['Whole neck', ...chord.tones.map((_, i) => `Pos ${i + 1}`)],
    cells:
      positionOption > 0
        ? arpeggioPosition(strings, root, intervals, positionOption - 1)
        : undefined,
  };
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      paddingBottom: 32,
    },
    modeRow: {
      marginTop: 16,
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
      color: colors.accentText,
      fontSize: 17,
      fontWeight: '600',
    },
    summaryBlue: {
      color: noteColors.blue.background,
      fontSize: 15,
      fontWeight: '600',
    },
    fretboard: {
      marginTop: 16,
      paddingLeft: 12,
    },
  });
}
