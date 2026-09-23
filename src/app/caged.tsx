import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import BackButton from '../components/BackButton';
import Dropdown from '../components/Dropdown';
import type { LabelMode } from '../components/Fretboard';
import FretboardStage from '../components/FretboardStage';
import KeyPicker from '../components/KeyPicker';
import {
  CAGED_ORDER,
  cagedShapes,
  notesAroundShape,
  supportsCaged,
  type CagedShape,
} from '../music/caged';
import { degreeLabels } from '../music/degrees';
import { cellKey, type Cell } from '../music/positions';
import { SCALES, scalePitchClasses } from '../music/scales';
import { spellScale } from '../music/spelling';
import { useInstrument } from '../state/InstrumentContext';
import { useLandscape } from '../state/orientation';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

const MAJOR = SCALES.find((s) => s.name === 'Major (Ionian)')!;
const MAJOR_PENTATONIC = SCALES.find((s) => s.name === 'Major pentatonic')!;
const SHAPE_OPTIONS = ['All shapes', ...CAGED_ORDER.map((n) => `${n} shape`)];
const LAYER_OPTIONS = ['Chord only', 'Major pentatonic', 'Major scale', 'Arpeggio'];
const LABEL_MODES: LabelMode[] = ['names', 'degrees'];
const LABEL_OPTIONS = ['Names', 'Degrees'];
const CHORD_INTERVALS = [0, 4, 7];

// CAGED: the five movable major chord shapes up the neck, with the scale around each one.
export default function CagedScreen() {
  const styles = useThemedStyles(makeStyles);
  const { instrument, tuning } = useInstrument();
  const [root, setRoot] = useState(0);
  const [shapeOption, setShapeOption] = useState(0);
  const [layer, setLayer] = useState(1); // major pentatonic: the classic CAGED companion
  const [labelOption, setLabelOption] = useState(0);

  useLandscape();

  const supported = supportsCaged(tuning.strings);
  const spelled = spellScale(root, MAJOR);
  const chordPcs = CHORD_INTERVALS.map((i) => (root + i) % 12);
  const layerScale = layer === 1 ? MAJOR_PENTATONIC : layer === 2 ? MAJOR : undefined;
  const layerPcs = layerScale ? scalePitchClasses(root, layerScale) : chordPcs;

  const allShapes = supported ? cagedShapes(tuning.strings, root, instrument.frets) : [];
  const shapes =
    shapeOption === 0
      ? allShapes
      : allShapes.filter((s) => s.name === CAGED_ORDER[shapeOption - 1]);

  // What to show: the chord shapes, and with a layer also the notes around them.
  const chordCells: Cell[] = shapes.flatMap((s) => s.cells);
  const layerCells: Cell[] =
    layer === 0
      ? []
      : shapes.flatMap((s: CagedShape) =>
          notesAroundShape(tuning.strings, s, layerPcs, instrument.frets),
        );
  const keys = (cells: Cell[]) => new Set(cells.map((c) => cellKey(c.string, c.fret)));
  const visibleCells = keys([...chordCells, ...layerCells]);
  // With a layer on, the chord stands out and the scale around it is faded.
  const focusCells = layer === 0 ? undefined : keys(chordCells);

  // Degree names: 1 3 5 for the chord, scale degrees for the scale layers.
  const degrees = layerScale
    ? degreeLabels(root, layerScale.intervals.length === 7 ? layerScale : undefined)
    : degreeLabels(root);

  const summary =
    shapeOption === 0
      ? allShapes // each shape's first place on the neck; the list repeats from fret 12
          .filter((s) => s.low < 12)
          .map((s) => `${s.name} ${s.low}`)
          .join(' · ')
      : shapes.map((s) => `${s.name} shape at fret ${s.low}`).join(', ');

  return (
    <FretboardStage
      back={<BackButton label="Menu" />}
      controls={
        <>
          <KeyPicker root={root} rootName={spelled.rootName} onChange={setRoot} />
          <Dropdown
            label={SHAPE_OPTIONS[shapeOption]}
            options={SHAPE_OPTIONS}
            selected={shapeOption}
            onSelect={setShapeOption}
          />
          <Dropdown
            label={LAYER_OPTIONS[layer]}
            options={LAYER_OPTIONS}
            selected={layer}
            onSelect={setLayer}
          />
          <Dropdown
            label={LABEL_OPTIONS[labelOption]}
            options={LABEL_OPTIONS}
            selected={labelOption}
            onSelect={setLabelOption}
          />
        </>
      }
      fretboard={{
        highlight: { root, pitchClasses: [...new Set([...layerPcs, ...chordPcs])] },
        labelMode: LABEL_MODES[labelOption],
        degreeLabels: degrees,
        noteNames: spelled.names,
        visibleCells,
        focusCells,
      }}
      status={
        supported ? (
          <>
            <Text style={styles.title}>{spelled.rootName} major</Text>
            <Text>{'   ' + summary}</Text>
          </>
        ) : (
          <Text>
            CAGED needs standard tuning (E A D G B E, or the same tuned lower). Choose it from the
            instrument menu.
          </Text>
        )
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
  });
}
