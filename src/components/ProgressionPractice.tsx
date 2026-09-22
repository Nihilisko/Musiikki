import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { KeyMode } from '../music/circle';
import { degreeLabels } from '../music/degrees';
import { cellKey, scalePosition } from '../music/positions';
import {
  keyScale,
  keyTonic,
  PROGRESSIONS,
  progressionChords,
  type KeyChord,
} from '../music/progressions';
import { pitchClass, scalePitchClasses, type Scale } from '../music/scales';
import { spellChord, spellScale } from '../music/spelling';
import { useInstrument } from '../state/InstrumentContext';
import { colors } from '../theme/colors';
import ChipRow from './ChipRow';
import Fretboard, { type LabelMode } from './Fretboard';

type Props = {
  /** Position on the circle of fifths (0 = C). */
  index: number;
  mode: KeyMode;
};

const LABEL_MODES: LabelMode[] = ['names', 'degrees', 'both'];
const LABEL_OPTIONS = ['Names', 'Degrees', 'Both'];
const POSITION_OPTIONS = ['Whole neck', ...Array.from({ length: 7 }, (_, i) => `Pos ${i + 1}`)];

/**
 * Pick a progression and see its chords' arpeggios on the fretboard.
 * Each chord can be switched on and off; notes shared by chords get a stripe of each colour.
 * With every chord off, the fretboard shows the key's scale in the normal colours.
 */
export default function ProgressionPractice({ index, mode }: Props) {
  const { instrument, tuning } = useInstrument();
  const [progressionOption, setProgressionOption] = useState(0); // 0 = none
  const [enabled, setEnabled] = useState<number[]>([0]); // which chords are switched on
  const [labelOption, setLabelOption] = useState(0);
  const [positionOption, setPositionOption] = useState(0);

  const progressions = PROGRESSIONS[mode];
  const progression = progressionOption > 0 ? progressions[progressionOption - 1] : undefined;
  const tonic = keyTonic(index, mode);
  const scale = keyScale(mode);
  const chords = progression ? progressionChords(tonic, mode, progression) : [];
  const activeChords = chords.filter((_, i) => enabled.includes(i));

  function selectProgression(option: number) {
    setProgressionOption(option);
    setEnabled([0]); // start with the first chord on
  }
  function toggleChord(i: number) {
    setEnabled((current) =>
      current.includes(i)
        ? current.filter((x) => x !== i)
        : [...current, i].sort((a, b) => a - b),
    );
  }

  // Positions follow the key's scale shapes; progression notes inside that area are shown.
  const area =
    positionOption > 0 ? scalePosition(tuning.strings, tonic, scale, positionOption - 1) : undefined;
  const visibleCells = area && fretWindow(area, tuning.strings.length);
  const firstFret = area ? Math.min(...area.map((c) => c.fret)) : 0;

  return (
    <View>
      <Text style={styles.sectionLabel}>Progression</Text>
      <ChipRow
        options={['None', ...progressions.map((p) => p.name)]}
        selected={progressionOption}
        onSelect={selectProgression}
      />

      {progression && (
        <>
          <Text style={styles.sectionLabel}>Chords (tap to switch on / off)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chordRow}
          >
            {chords.map((chord, i) => {
              const on = enabled.includes(i);
              return (
                <Pressable
                  key={chord.numeral}
                  onPress={() => toggleChord(i)}
                  style={[styles.chord, on && { backgroundColor: chord.color }]}
                >
                  <Text style={[styles.numeral, on && styles.onText]}>{chord.numeral}</Text>
                  <Text style={[styles.chordName, on && styles.onText]}>{chord.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>Position</Text>
          <ChipRow
            options={POSITION_OPTIONS}
            selected={positionOption}
            onSelect={setPositionOption}
          />

          <Text style={styles.sectionLabel}>Labels</Text>
          <ChipRow options={LABEL_OPTIONS} selected={labelOption} onSelect={setLabelOption} />

          <Text style={styles.status}>
            {activeChords.length === 0
              ? 'All chords off: showing the key’s scale.'
              : activeChords.length === 1
                ? `${activeChords[0].name} arpeggio`
                : 'Striped notes belong to more than one chord.'}
          </Text>

          <View style={styles.fretboard}>
            <Fretboard
              strings={tuning.strings}
              frets={instrument.frets}
              octaveCourses={instrument.octaveCourses}
              flats={tuning.flats}
              labelMode={LABEL_MODES[labelOption]}
              degreeLabels={degreeLabels(tonic, scale)}
              noteNames={chordNoteNames(tonic, scale, activeChords)}
              visibleCells={visibleCells}
              scrollToFret={firstFret}
              {...(activeChords.length > 0
                ? { noteFill: chordFills(activeChords) }
                : { highlight: { root: tonic, pitchClasses: scalePitchClasses(tonic, scale) } })}
            />
          </View>
        </>
      )}
    </View>
  );
}

/** Colours for each pitch class: one per active chord that contains it. */
function chordFills(chords: KeyChord[]): (string[] | undefined)[] {
  const fills: (string[] | undefined)[] = new Array(12).fill(undefined);
  for (const chord of chords) {
    for (const tone of chord.type.tones) {
      const pc = pitchClass(chord.root + tone.interval);
      fills[pc] = [...(fills[pc] ?? []), chord.color];
    }
  }
  return fills;
}

/** Note names: the key's spelling, plus each chord's own spelling for notes outside the key. */
function chordNoteNames(
  tonic: number,
  scale: Scale,
  chords: KeyChord[],
): (string | undefined)[] {
  const names = [...spellScale(tonic, scale).names];
  for (const chord of chords) {
    spellChord(chord.root, chord.type).names.forEach((name, pc) => {
      if (name && !names[pc]) names[pc] = name;
    });
  }
  return names;
}

/** Every cell inside the frets an area covers, so chord notes outside the scale still show. */
function fretWindow(area: { fret: number }[], stringCount: number): Set<string> {
  const min = Math.min(...area.map((c) => c.fret));
  const max = Math.max(...area.map((c) => c.fret));
  const cells = new Set<string>();
  for (let string = 0; string < stringCount; string++) {
    for (let fret = min; fret <= max; fret++) cells.add(cellKey(string, fret));
  }
  return cells;
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  chordRow: {
    gap: 8,
    paddingHorizontal: 16,
  },
  chord: {
    alignItems: 'center',
    minWidth: 64,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  numeral: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chordName: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  onText: {
    color: '#ffffff',
  },
  status: {
    color: colors.textMuted,
    fontSize: 14,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  fretboard: {
    marginTop: 12,
    paddingLeft: 12,
  },
});
