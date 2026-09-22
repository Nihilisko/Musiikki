import { useState, type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

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
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import Dropdown from './Dropdown';
import type { LabelMode } from './Fretboard';
import FretboardStage from './FretboardStage';
import Stepper from './Stepper';

type Props = {
  /** Position on the circle of fifths (0 = C). */
  index: number;
  mode: KeyMode;
  /** Stays at the left edge of the control row, e.g. a back button. */
  back?: ReactNode;
  /** Shown under the fretboard, e.g. the key name. */
  title?: string;
};

const LABEL_MODES: LabelMode[] = ['names', 'degrees', 'both'];
const LABEL_OPTIONS = ['Names', 'Degrees', 'Both'];
const POSITIONS = 7;

/**
 * Pick a progression and see its chords' arpeggios on the whole neck.
 * One row of compact controls on top; the fretboard fills the width below.
 * Notes shared by chords get a stripe of each colour; with every chord off,
 * the fretboard shows the key's scale in the normal colours.
 */
export default function ProgressionPractice({ index, mode, back, title }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { tuning } = useInstrument();
  const [progressionOption, setProgressionOption] = useState(0); // 0 = none
  const [enabled, setEnabled] = useState<number[]>([0]); // which chords are switched on
  const [labelOption, setLabelOption] = useState(0);
  const [position, setPosition] = useState(0); // 0 = whole neck

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
      current.includes(i) ? current.filter((x) => x !== i) : [...current, i].sort((a, b) => a - b),
    );
  }

  // A position lights up its frets and fades the rest of the neck.
  const area = position > 0 ? scalePosition(tuning.strings, tonic, scale, position - 1) : undefined;
  const focusCells = area && fretWindow(area, tuning.strings.length);

  const chordLabel =
    activeChords.length === 0
      ? 'Chords: off'
      : `Chords: ${activeChords.map((c) => c.numeral).join(' ')}`;

  return (
    <FretboardStage
      back={back}
      controls={
        <>
          <Dropdown
            label={progression ? progression.name : 'Progression'}
            options={['None', ...progressions.map((p) => p.name)]}
            selected={progressionOption}
            onSelect={selectProgression}
          />
          {progression && (
            <Dropdown
              label={chordLabel}
              options={chords.map((c) => `${c.numeral}  ${c.name}`)}
              optionColors={chords.map((c) => c.color)}
              selected={enabled}
              onSelect={toggleChord}
              multi
            />
          )}
          <Dropdown
            label={LABEL_OPTIONS[labelOption]}
            options={LABEL_OPTIONS}
            selected={labelOption}
            onSelect={setLabelOption}
          />
          <Stepper
            value={position}
            min={0}
            max={POSITIONS}
            onChange={setPosition}
            caption={position === 0 ? 'Whole neck' : 'Position'}
          />
        </>
      }
      fretboard={{
        labelMode: LABEL_MODES[labelOption],
        degreeLabels: degreeLabels(tonic, scale),
        noteNames: chordNoteNames(tonic, scale, activeChords),
        focusCells,
        ...(activeChords.length > 0
          ? { noteFill: chordFills(activeChords) }
          : { highlight: { root: tonic, pitchClasses: scalePitchClasses(tonic, scale) } }),
      }}
      status={
        <>
          {title && <Text style={styles.title}>{title} · </Text>}
          {activeChords.length === 0
            ? 'all chords off, showing the key’s scale'
            : activeChords.length === 1
              ? `${activeChords[0].name} arpeggio`
              : 'striped notes belong to more than one chord'}
        </>
      }
    />
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
function chordNoteNames(tonic: number, scale: Scale, chords: KeyChord[]): (string | undefined)[] {
  const names = [...spellScale(tonic, scale).names];
  for (const chord of chords) {
    spellChord(chord.root, chord.type).names.forEach((name, pc) => {
      if (name && !names[pc]) names[pc] = name;
    });
  }
  return names;
}

/** Every cell inside the frets an area covers, so chord notes outside the scale count too. */
function fretWindow(area: { fret: number }[], stringCount: number): Set<string> {
  const min = Math.min(...area.map((c) => c.fret));
  const max = Math.max(...area.map((c) => c.fret));
  const cells = new Set<string>();
  for (let string = 0; string < stringCount; string++) {
    for (let fret = min; fret <= max; fret++) cells.add(cellKey(string, fret));
  }
  return cells;
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    title: {
      color: colors.text,
      fontWeight: '700',
    },
  });
}
