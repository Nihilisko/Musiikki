import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import ChipRow from '../components/ChipRow';
import Fretboard, { type LabelMode } from '../components/Fretboard';
import { BLUE_NOTES } from '../music/blueNotes';
import { degreeLabels } from '../music/degrees';
import { KEY_NAMES } from '../music/notes';
import { cellKey, positionCount, positionName, scalePosition } from '../music/positions';
import { SCALES, scalePitchClasses } from '../music/scales';
import { spellScale } from '../music/spelling';
import { useInstrument } from '../state/InstrumentContext';
import { colors, noteColors } from '../theme/colors';

// First option shows every note; the rest are the scales.
const SCALE_OPTIONS = ['All notes', ...SCALES.map((s) => s.name)];

const LABEL_MODES: LabelMode[] = ['names', 'degrees', 'both'];
const LABEL_OPTIONS = ['Names', 'Degrees', 'Both'];
const BLUE_OPTIONS = BLUE_NOTES.map((b) => b.label);

export default function ScalesScreen() {
  const { instrument, tuning } = useInstrument();
  const [root, setRoot] = useState(0); // pitch class, 0 = C
  const [scaleOption, setScaleOption] = useState(0);
  const [labelOption, setLabelOption] = useState(0);
  const [blueOptions, setBlueOptions] = useState<number[]>([]); // which BLUE_NOTES are on
  const [positionOption, setPositionOption] = useState(0); // 0 = whole neck

  function selectScale(option: number) {
    setScaleOption(option);
    setPositionOption(0); // scales have different numbers of positions
  }

  function toggleBlue(index: number) {
    setBlueOptions((current) =>
      current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
    );
  }

  const scale = scaleOption > 0 ? SCALES[scaleOption - 1] : undefined;
  const highlight = scale ? { root, pitchClasses: scalePitchClasses(root, scale) } : undefined;
  const blueIntervals = blueOptions.map((i) => BLUE_NOTES[i].interval);
  const blueNotes = blueIntervals.map((interval) => (root + interval) % 12);
  const spelled = spellScale(root, scale, blueIntervals);

  // Positions: 0 = whole neck, 1.. = one box / 3NPS shape.
  const positions = scale ? positionCount(scale) : 0;
  const positionOptions = scale
    ? ['Whole neck', ...Array.from({ length: positions }, (_, i) => positionName(scale, i))]
    : [];
  const cells =
    scale && positionOption > 0
      ? scalePosition(tuning.strings, root, scale, positionOption - 1, blueNotes)
      : undefined;
  const visibleCells = cells && new Set(cells.map((c) => cellKey(c.string, c.fret)));
  const firstFret = cells ? Math.min(...cells.map((c) => c.fret)) : 0;
  // The scale's notes in order, e.g. "A C D E♭ E G".
  const scaleNotes = scale
    ? scale.intervals.map((interval) => spelled.names[(root + interval) % 12]).join('  ')
    : '';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Key</Text>
      <ChipRow options={KEY_NAMES} selected={root} onSelect={setRoot} />

      <Text style={styles.sectionLabel}>Scale</Text>
      <ChipRow options={SCALE_OPTIONS} selected={scaleOption} onSelect={selectScale} />

      {positions > 0 && (
        <>
          <Text style={styles.sectionLabel}>Position</Text>
          <ChipRow
            options={positionOptions}
            selected={positionOption}
            onSelect={setPositionOption}
          />
        </>
      )}

      <Text style={styles.sectionLabel}>Labels</Text>
      <ChipRow options={LABEL_OPTIONS} selected={labelOption} onSelect={setLabelOption} />

      <Text style={styles.sectionLabel}>Blue notes</Text>
      <ChipRow options={BLUE_OPTIONS} selected={blueOptions} onSelect={toggleBlue} />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>
          {spelled.rootName} {scale ? scale.name : '(all notes)'}
        </Text>
        {scale && <Text style={styles.summaryNotes}>{scaleNotes}</Text>}
        {blueNotes.length > 0 && (
          <Text style={styles.summaryBlue}>
            Blue notes: {blueNotes.map((pc) => spelled.names[pc]).join('  ')}
          </Text>
        )}
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
          blueNotes={blueNotes}
          visibleCells={visibleCells}
          scrollToFret={firstFret}
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
