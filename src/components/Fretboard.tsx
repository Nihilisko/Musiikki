import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { noteName, noteNameWithOctave } from '../music/notes';
import { cellKey } from '../music/positions';
import { pitchClass } from '../music/scales';
import { noteColors } from '../theme/colors';

export type Highlight = {
  /** Pitch class of the root note (0-11). */
  root: number;
  /** Pitch classes to show; all other notes are hidden. */
  pitchClasses: number[];
};

export type LabelMode = 'names' | 'degrees' | 'both';

type Props = {
  /** Strings from lowest to highest, as MIDI numbers. */
  strings: number[];
  frets: number;
  /** 12-string: how many of the lowest courses have an octave string. */
  octaveCourses?: number;
  /** When given, only these notes are shown and the root is marked. */
  highlight?: Highlight;
  /** What to write on the notes. Degrees need `degreeLabels`. */
  labelMode?: LabelMode;
  /** Degree name for each pitch class (index 0 = C ... 11 = B). */
  degreeLabels?: string[];
  /** Note name for each pitch class, spelled for the key (e.g. B♭ in F major). */
  noteNames?: (string | undefined)[];
  /** Write string names and unnamed notes with flats instead of sharps. */
  flats?: boolean;
  /** Pitch classes of blue notes: always shown, in blue, even outside the scale. */
  blueNotes?: number[];
  /** When given, only these cells (see `cellKey`) are shown, e.g. one scale position. */
  visibleCells?: Set<string>;
  /** Scroll the neck so this fret is near the left edge. */
  scrollToFret?: number;
};

const FRET_WIDTH = 46;
const OPEN_WIDTH = 40;
const STRING_HEIGHT = 36;
const SINGLE_DOTS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_DOTS = [12, 24];

export default function Fretboard({
  strings,
  frets,
  octaveCourses = 0,
  highlight,
  labelMode = 'names',
  degreeLabels,
  noteNames,
  flats = false,
  blueNotes = [],
  visibleCells,
  scrollToFret,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);

  // When the position changes, bring it into view.
  useEffect(() => {
    if (scrollToFret !== undefined) {
      const x = scrollToFret <= 1 ? 0 : OPEN_WIDTH + (scrollToFret - 2) * FRET_WIDTH;
      scrollRef.current?.scrollTo({ x, animated: true });
    }
  }, [scrollToFret]);

  // Without degree names there is nothing else to show, so fall back to note names.
  const mode = degreeLabels ? labelMode : 'names';

  const fretNumbers = Array.from({ length: frets + 1 }, (_, i) => i);
  // Highest string on top, like in tabs.
  const rows = strings.map((midi, index) => ({ midi, index })).reverse();

  return (
    <View style={styles.wrapper}>
      {/* String names stay visible while the neck scrolls. */}
      <View style={styles.labels}>
        <View style={styles.numberRow} />
        {rows.map(({ midi, index }) => (
          <View key={index} style={styles.labelCell}>
            <Text style={styles.labelText}>{noteNameWithOctave(midi, flats)}</Text>
            {index < octaveCourses && (
              <Text style={styles.octaveText}>+{noteNameWithOctave(midi + 12, flats)}</Text>
            )}
          </View>
        ))}
      </View>

      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.numberRow}>
            {fretNumbers.map((fret) => (
              <Text key={fret} style={[styles.fretNumber, { width: cellWidth(fret) }]}>
                {fret === 0 ? 'Open' : fret}
              </Text>
            ))}
          </View>

          <View style={styles.neck}>
            {/* Inlay dots behind the strings */}
            <View style={styles.dotLayer} pointerEvents="none">
              {fretNumbers.map((fret) => (
                <View key={fret} style={[styles.dotCell, { width: cellWidth(fret) }]}>
                  {SINGLE_DOTS.includes(fret) && <View style={styles.dot} />}
                  {DOUBLE_DOTS.includes(fret) && (
                    <View style={{ gap: STRING_HEIGHT * 1.5 }}>
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                    </View>
                  )}
                </View>
              ))}
            </View>

            {rows.map(({ midi, index }) => (
              <View key={index} style={styles.stringRow}>
                <View style={styles.stringLine} />
                {fretNumbers.map((fret) => (
                  <View
                    key={fret}
                    style={[
                      styles.cell,
                      { width: cellWidth(fret) },
                      fret === 0 ? styles.openCell : styles.fretCell,
                    ]}
                  >
                    {(!visibleCells || visibleCells.has(cellKey(index, fret))) && (
                      <NoteDot
                        midi={midi + fret}
                        highlight={highlight}
                        mode={mode}
                        degreeLabels={degreeLabels}
                        name={noteNames?.[pitchClass(midi + fret)] ?? noteName(midi + fret, flats)}
                        blueNotes={blueNotes}
                      />
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

type NoteDotProps = {
  midi: number;
  name: string;
  blueNotes: number[];
  highlight?: Highlight;
  mode: LabelMode;
  degreeLabels?: string[];
};

function NoteDot({ midi, name, highlight, mode, degreeLabels, blueNotes }: NoteDotProps) {
  const pc = pitchClass(midi);
  const isBlue = blueNotes.includes(pc);
  if (highlight && !highlight.pitchClasses.includes(pc) && !isBlue) {
    return null; // not in the scale: leave the fret empty
  }
  const isRoot = highlight?.root === pc;
  // The root keeps its colour; otherwise blue notes win over the scale colour.
  const role = isRoot
    ? noteColors.root
    : isBlue
      ? noteColors.blue
      : highlight
        ? noteColors.scale
        : noteColors.plain;
  const degree = degreeLabels?.[pc] ?? '';
  const textStyle = [styles.noteText, { color: role.text }];

  return (
    <View style={[styles.note, { backgroundColor: role.background }, highlight && styles.outlined]}>
      {mode === 'names' && <Text style={textStyle}>{name}</Text>}
      {mode === 'degrees' && <Text style={textStyle}>{degree}</Text>}
      {mode === 'both' && (
        <>
          <Text style={[textStyle, styles.smallText]}>{name}</Text>
          <Text style={[textStyle, styles.tinyText]}>{degree}</Text>
        </>
      )}
    </View>
  );
}

function cellWidth(fret: number) {
  return fret === 0 ? OPEN_WIDTH : FRET_WIDTH;
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
  },
  labels: {
    paddingRight: 6,
  },
  labelCell: {
    height: STRING_HEIGHT,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  labelText: {
    color: '#f5f5f5',
    fontWeight: '600',
    fontSize: 13,
  },
  octaveText: {
    color: '#9aa0a6',
    fontSize: 10,
  },
  numberRow: {
    flexDirection: 'row',
    height: 20,
  },
  fretNumber: {
    color: '#9aa0a6',
    fontSize: 11,
    textAlign: 'center',
  },
  neck: {
    backgroundColor: '#5b3a21',
    borderRadius: 4,
  },
  dotLayer: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  dotCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e8d9b5',
    opacity: 0.5,
  },
  stringRow: {
    flexDirection: 'row',
    height: STRING_HEIGHT,
    alignItems: 'center',
  },
  stringLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#c9c9c9',
  },
  cell: {
    height: STRING_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openCell: {
    backgroundColor: '#2b2b2b',
    borderRightWidth: 5,
    borderRightColor: '#eee8d5',
  },
  fretCell: {
    borderRightWidth: 2,
    borderRightColor: '#b0b0b0',
  },
  note: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: {
    // A thin light edge keeps dark notes visible on dark wood.
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  noteText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
    lineHeight: 11,
  },
  tinyText: {
    fontSize: 8,
    lineHeight: 9,
    fontWeight: '400',
  },
});
