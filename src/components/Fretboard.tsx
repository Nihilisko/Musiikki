import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { noteName, noteNameWithOctave } from '../music/notes';

type Props = {
  /** Strings from lowest to highest, as MIDI numbers. */
  strings: number[];
  frets: number;
  /** 12-string: how many of the lowest courses have an octave string. */
  octaveCourses?: number;
};

const FRET_WIDTH = 46;
const OPEN_WIDTH = 40;
const STRING_HEIGHT = 36;
const SINGLE_DOTS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_DOTS = [12, 24];

export default function Fretboard({ strings, frets, octaveCourses = 0 }: Props) {
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
            <Text style={styles.labelText}>{noteNameWithOctave(midi)}</Text>
            {index < octaveCourses && (
              <Text style={styles.octaveText}>+{noteNameWithOctave(midi + 12)}</Text>
            )}
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    <View style={styles.note}>
                      <Text style={styles.noteText}>{noteName(midi + fret)}</Text>
                    </View>
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
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 3,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
});
