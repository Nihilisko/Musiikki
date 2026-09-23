import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import BackButton from '../components/BackButton';
import Dropdown from '../components/Dropdown';
import type { LabelMode } from '../components/Fretboard';
import FretboardStage from '../components/FretboardStage';
import KeyPicker from '../components/KeyPicker';
import Stepper from '../components/Stepper';
import { CHORD_TYPES } from '../music/chords';
import { cellKey } from '../music/positions';
import { pitchClass } from '../music/scales';
import { spellChord } from '../music/spelling';
import {
  INVERSION_NAMES,
  stringSetName,
  stringSets,
  triadShapes,
  type Inversion,
} from '../music/triads';
import { useInstrument } from '../state/InstrumentContext';
import { useLandscape } from '../state/orientation';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

/** The three-note chords: major, minor, diminished, augmented, sus2, sus4. */
const TRIADS = CHORD_TYPES.filter((c) => c.tones.length === 3);
const INVERSION_FILTERS = ['All inversions', 'Root position', '1st inversion', '2nd inversion'];
/** Shorter text for the button, so the whole control row fits. */
const INVERSION_SHORT = ['All', 'Root pos.', '1st inv.', '2nd inv.'];
const LABEL_MODES: LabelMode[] = ['names', 'degrees'];
const LABEL_OPTIONS = ['Names', 'Degrees'];

// Triads on three neighbouring strings: every shape up the neck, in root position and both
// inversions. The stepper picks one shape and fades the rest, like scale positions.
export default function TriadsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { instrument, tuning } = useInstrument();
  const sets = stringSets(tuning.strings.length);
  const [root, setRoot] = useState(0);
  const [type, setType] = useState(0);
  const [setIndex, setSetIndex] = useState(Math.max(0, sets.length - 1)); // highest strings
  const [filter, setFilter] = useState(0);
  const [shapeIndex, setShapeIndex] = useState(0); // 0 = all shapes
  const [labelOption, setLabelOption] = useState(0);

  useLandscape();

  const chord = TRIADS[type];
  const spelled = spellChord(root, chord);
  const set = sets[Math.min(setIndex, sets.length - 1)] ?? [];
  const allShapes = useMemo(
    () => (set.length === 3 ? triadShapes(tuning.strings, set, root, chord, instrument.frets) : []),
    [tuning.strings, set, root, chord, instrument.frets],
  );
  const shapes =
    filter === 0 ? allShapes : allShapes.filter((s) => s.inversion === ((filter - 1) as Inversion));
  const chosen = shapeIndex > 0 ? shapes[shapeIndex - 1] : undefined;

  // Changing anything that changes the list starts again from "all shapes".
  function reset<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setShapeIndex(0);
    };
  }

  const degrees: string[] = new Array(12).fill('');
  chord.tones.forEach((t) => (degrees[pitchClass(root + t.interval)] = t.degree));
  const visibleCells = new Set(
    shapes.flatMap((s) => s.cells.map((c) => cellKey(c.string, c.fret))),
  );
  const focusCells = chosen && new Set(chosen.cells.map((c) => cellKey(c.string, c.fret)));
  const bassName = chosen
    ? spelled.names[pitchClass(root + chord.tones[chosen.inversion].interval)]
    : '';

  return (
    <FretboardStage
      back={<BackButton label="Chords" />}
      controls={
        <>
          <KeyPicker root={root} rootName={spelled.rootName} onChange={reset(setRoot)} />
          <Dropdown
            label={chord.name}
            options={TRIADS.map((c) => c.name)}
            selected={type}
            onSelect={reset(setType)}
          />
          <Dropdown
            label={set.length ? stringSetName(set, tuning.strings.length) : 'Strings'}
            options={sets.map((s) => stringSetName(s, tuning.strings.length))}
            selected={setIndex}
            onSelect={reset(setSetIndex)}
          />
          <Dropdown
            label={INVERSION_SHORT[filter]}
            options={INVERSION_FILTERS}
            selected={filter}
            onSelect={reset(setFilter)}
          />
          <Dropdown
            label={LABEL_OPTIONS[labelOption]}
            options={LABEL_OPTIONS}
            selected={labelOption}
            onSelect={setLabelOption}
          />
          {shapes.length > 0 && (
            <Stepper
              value={shapeIndex}
              min={0}
              max={shapes.length}
              onChange={setShapeIndex}
              caption={shapeIndex === 0 ? 'All shapes' : 'Shape'}
            />
          )}
        </>
      }
      fretboard={{
        highlight: { root, pitchClasses: chord.tones.map((t) => pitchClass(root + t.interval)) },
        labelMode: LABEL_MODES[labelOption],
        degreeLabels: degrees,
        noteNames: spelled.names,
        visibleCells,
        focusCells,
      }}
      status={
        <>
          <Text style={styles.title}>
            {spelled.rootName}
            {chord.symbol || ' major'}
          </Text>
          <Text style={styles.notes}>
            {'   ' + chord.tones.map((t) => spelled.names[pitchClass(root + t.interval)]).join(' ')}
          </Text>
          <Text>
            {chosen
              ? `   ${INVERSION_NAMES[chosen.inversion]} – ${bassName} in the bass`
              : shapes.length === 0
                ? '   No shapes on these strings'
                : `   ${shapes.length} shapes`}
          </Text>
        </>
      }
    />
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    title: {
      color: colors.text,
      fontWeight: '700',
    },
    notes: {
      color: colors.accentText,
      fontWeight: '600',
    },
  });
}
