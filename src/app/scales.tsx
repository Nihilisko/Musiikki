import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import BackButton from '../components/BackButton';
import Dropdown from '../components/Dropdown';
import type { Highlight, LabelMode } from '../components/Fretboard';
import FretboardStage from '../components/FretboardStage';
import KeyPicker from '../components/KeyPicker';
import Stepper from '../components/Stepper';
import { BLUE_NOTES } from '../music/blueNotes';
import { CHORD_TYPES } from '../music/chords';
import { degreeLabels } from '../music/degrees';
import {
  arpeggioPosition,
  cellKey,
  positionCount,
  scalePosition,
  type Cell,
} from '../music/positions';
import { pitchClass, SCALES, scalePitchClasses, type Scale } from '../music/scales';
import { spellChord, spellScale } from '../music/spelling';
import { useInstrument } from '../state/InstrumentContext';
import { useLandscape } from '../state/orientation';
import { useCustomScales } from '../state/CustomScaleContext';
import { useNoteColors } from '../state/NoteColorContext';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

// One list for everything the fretboard can show: all notes, the scales, the arpeggios,
// then the user's own scales and a "+ New scale" item at the end.
const BUILT_IN_OPTIONS = [
  'All notes',
  ...SCALES.map((s) => s.name),
  ...CHORD_TYPES.map((c) => `${c.name} arpeggio`),
];
const FIRST_ARPEGGIO = 1 + SCALES.length;
const FIRST_CUSTOM = BUILT_IN_OPTIONS.length;
const NEW_SCALE = '+ New scale';

const LABEL_MODES: LabelMode[] = ['names', 'degrees', 'both'];
const LABEL_OPTIONS = ['Names', 'Degrees', 'Both'];
const BLUE_OPTIONS = BLUE_NOTES.map((b) => b.label);

/** Everything the fretboard and status line need, for either a scale or an arpeggio. */
type FretboardView = {
  rootName: string;
  title: string;
  /** The notes in order, e.g. "A C D E♭ E G". */
  notes: string;
  highlight?: Highlight;
  noteNames: (string | undefined)[];
  degrees: string[];
  /** How many positions the stepper can go through (0 = none). */
  positions: number;
  /** Word under the stepper's number, e.g. "Box". */
  positionWord: string;
  cells?: Cell[];
};

// Scales and arpeggios on the whole neck, turned sideways like the practice view.
export default function ScalesScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { tuning } = useInstrument();
  const { noteColors } = useNoteColors();
  // Opened from a theory note with a key, a scale (by name) and a label mode to show first.
  const params = useLocalSearchParams<{ scale?: string; labels?: string; root?: string }>();
  const [root, setRoot] = useState(() => (Number(params.root) || 0) % 12); // pitch class, 0 = C
  const [shapeOption, setShapeOption] = useState(() => {
    const i = SCALES.findIndex((s) => s.name === params.scale);
    return i >= 0 ? i + 1 : 0;
  });
  const [labelOption, setLabelOption] = useState(() => (params.labels === 'degrees' ? 1 : 0));
  const [blueOptions, setBlueOptions] = useState<number[]>([]); // which BLUE_NOTES are on
  const [position, setPosition] = useState(0); // 0 = whole neck
  const { scales: customScales } = useCustomScales();

  const shapeOptions = [...BUILT_IN_OPTIONS, ...customScales.map((c) => c.name), NEW_SCALE];
  const newScaleOption = shapeOptions.length - 1;

  // When a scale has just been made in the editor, show it straight away; when one has been
  // deleted, go back to all notes (the menu's order has changed).
  const customCount = useRef(customScales.length);
  useEffect(() => {
    if (customScales.length > customCount.current) {
      setShapeOption(FIRST_CUSTOM + customScales.length - 1);
      setPosition(0);
    } else if (customScales.length < customCount.current) {
      setShapeOption(0);
      setPosition(0);
    }
    customCount.current = customScales.length;
  }, [customScales.length]);
  const selectedCustom =
    shapeOption >= FIRST_CUSTOM ? customScales[shapeOption - FIRST_CUSTOM] : undefined;

  useLandscape(); // sideways while this screen is open

  const isArpeggio = shapeOption >= FIRST_ARPEGGIO && shapeOption < FIRST_CUSTOM;
  const scale: Scale | undefined =
    shapeOption >= FIRST_CUSTOM
      ? customScales[shapeOption - FIRST_CUSTOM]
      : !isArpeggio && shapeOption > 0
        ? SCALES[shapeOption - 1]
        : undefined;
  // Blue notes that are part of the scale itself (♭5 in minor blues) are always on.
  const builtInBlue = BLUE_NOTES.flatMap((b, i) =>
    scale?.blueNotes?.includes(b.interval) ? [i] : [],
  );
  const activeBlue = [...new Set([...blueOptions, ...builtInBlue])].sort((a, b) => a - b);

  // Scales and chords have different numbers of positions, so start again from the whole neck.
  function selectShape(option: number) {
    if (option === newScaleOption) {
      router.push('/scale-editor');
      return;
    }
    setShapeOption(option);
    setPosition(0);
  }
  function toggleBlue(index: number) {
    if (builtInBlue.includes(index)) return; // part of the scale, can't be turned off
    setBlueOptions((current) =>
      current.includes(index)
        ? current.filter((i) => i !== index)
        : [...current, index].sort((a, b) => a - b),
    );
  }

  const blueIntervals = isArpeggio ? [] : activeBlue.map((i) => BLUE_NOTES[i].interval);
  const blueNotes = blueIntervals.map((interval) => pitchClass(root + interval));
  const view = isArpeggio
    ? arpeggioView(tuning.strings, root, shapeOption - FIRST_ARPEGGIO, position)
    : scaleView(tuning.strings, root, scale, position, blueIntervals);
  // A position lights up its notes and fades the rest of the neck, so nothing moves.
  const focusCells = view.cells && new Set(view.cells.map((c) => cellKey(c.string, c.fret)));

  const blueLabel =
    activeBlue.length === 0
      ? 'Blue: off'
      : `Blue: ${activeBlue.map((i) => BLUE_OPTIONS[i]).join(' ')}`;

  return (
    <FretboardStage
      back={<BackButton label={params.scale ? 'Back' : 'Menu'} />}
      controls={
        <>
          <KeyPicker root={root} rootName={view.rootName} onChange={setRoot} />
          <Dropdown
            label={shapeOptions[shapeOption] ?? shapeOptions[0]}
            options={shapeOptions}
            selected={shapeOption}
            onSelect={selectShape}
            headers={{ [FIRST_CUSTOM]: 'My scales' }}
          />
          {selectedCustom && (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/scale-editor', params: { id: selectedCustom.id } })
              }
              style={styles.edit}
              accessibilityLabel={`Edit ${selectedCustom.name}`}
            >
              <Ionicons name="pencil" size={16} color={colors.accentText} />
            </Pressable>
          )}
          <Dropdown
            label={LABEL_OPTIONS[labelOption]}
            options={LABEL_OPTIONS}
            selected={labelOption}
            onSelect={setLabelOption}
          />
          {!isArpeggio && (
            <Dropdown
              label={blueLabel}
              options={BLUE_OPTIONS.map((label, i) =>
                builtInBlue.includes(i) ? `${label} (in scale)` : label,
              )}
              optionColors={BLUE_OPTIONS.map(() => noteColors.blue.background)}
              selected={activeBlue}
              onSelect={toggleBlue}
              multi
            />
          )}
          {view.positions > 0 && (
            <Stepper
              value={position}
              min={0}
              max={view.positions}
              onChange={setPosition}
              caption={position === 0 ? 'Whole neck' : view.positionWord}
            />
          )}
        </>
      }
      fretboard={{
        highlight: view.highlight,
        labelMode: LABEL_MODES[labelOption],
        degreeLabels: view.degrees,
        noteNames: view.noteNames,
        blueNotes,
        focusCells,
      }}
      status={
        <>
          <Text style={styles.title}>{view.title}</Text>
          {view.notes !== '' && <Text style={styles.notes}>{'   ' + view.notes}</Text>}
          {blueNotes.length > 0 && (
            <Text style={[styles.blue, { color: noteColors.blue.background }]}>
              {'   blue: ' + blueNotes.map((pc) => view.noteNames[pc]).join(' ')}
            </Text>
          )}
        </>
      }
    />
  );
}

function scaleView(
  strings: number[],
  root: number,
  scale: Scale | undefined,
  position: number,
  blueIntervals: number[],
): FretboardView {
  const spelled = spellScale(root, scale, blueIntervals);
  if (!scale) {
    return {
      rootName: spelled.rootName,
      title: `${spelled.rootName} (all notes)`,
      notes: '',
      noteNames: spelled.names,
      degrees: degreeLabels(root),
      positions: 0,
      positionWord: '',
    };
  }
  const count = positionCount(scale);
  const blueNotes = blueIntervals.map((interval) => pitchClass(root + interval));
  return {
    rootName: spelled.rootName,
    title: `${spelled.rootName} ${scale.name}`,
    notes: scale.intervals.map((i) => spelled.names[pitchClass(root + i)]).join(' '),
    highlight: { root, pitchClasses: scalePitchClasses(root, scale) },
    noteNames: spelled.names,
    degrees: degreeLabels(root, scale),
    positions: count,
    positionWord: count === 5 ? 'Box' : '3NPS',
    cells: position > 0 ? scalePosition(strings, root, scale, position - 1, blueNotes) : undefined,
  };
}

function arpeggioView(
  strings: number[],
  root: number,
  chordOption: number,
  position: number,
): FretboardView {
  const chord = CHORD_TYPES[chordOption];
  const spelled = spellChord(root, chord);
  const intervals = chord.tones.map((t) => t.interval);
  // Degree names come from the chord (♯5, ♭♭7), not from a scale.
  const degrees: string[] = new Array(12).fill('');
  chord.tones.forEach((t) => (degrees[pitchClass(root + t.interval)] = t.degree));

  return {
    rootName: spelled.rootName,
    title: `${spelled.rootName}${chord.symbol} arpeggio`,
    notes: chord.tones.map((t) => spelled.names[pitchClass(root + t.interval)]).join(' '),
    highlight: { root, pitchClasses: intervals.map((i) => pitchClass(root + i)) },
    noteNames: spelled.names,
    degrees,
    positions: chord.tones.length,
    positionWord: 'Position',
    cells: position > 0 ? arpeggioPosition(strings, root, intervals, position - 1) : undefined,
  };
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    title: {
      color: colors.text,
      fontWeight: '700',
    },
    edit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    notes: {
      color: colors.accentText,
      fontWeight: '600',
    },
    blue: {
      fontWeight: '600',
    },
  });
}
