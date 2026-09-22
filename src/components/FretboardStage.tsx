import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useInstrument } from '../state/InstrumentContext';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';
import Fretboard, { LABEL_WIDTH, OPEN_FRET_WIDTH, type FretboardProps } from './Fretboard';

type Props = {
  /** Stays at the left edge of the control row, e.g. a back button. */
  back: ReactNode;
  /** Dropdowns, steppers... shown centred in the control row. */
  controls: ReactNode;
  /** Everything the fretboard shows; the strings and size come from the chosen instrument. */
  fretboard: Omit<FretboardProps, 'strings' | 'frets' | 'octaveCourses' | 'flats' | 'fretWidth'>;
  /** A line under the fretboard, e.g. "C major · C7 arpeggio". */
  status?: ReactNode;
};

/** Side padding around the fretboard. */
const SIDE_PADDING = 16;
/** Width the back button's column keeps; the same space is left free on the right. */
const BACK_COLUMN = 110;
/** Below this screen width the right-hand spacer is dropped so the controls fit. */
const WIDE_SCREEN = 900;

/**
 * The landscape fretboard layout shared by the scale and practice screens:
 * one row of controls on top (back button at the left, the rest centred)
 * and the whole neck centred below, sized to fit the screen width.
 */
export default function FretboardStage({ back, controls, fretboard, status }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { instrument, tuning } = useInstrument();
  const { width } = useWindowDimensions();

  const fixedWidth = LABEL_WIDTH + OPEN_FRET_WIDTH;
  const fitted = Math.floor((width - 2 * SIDE_PADDING - fixedWidth) / instrument.frets);
  const fretWidth = Math.max(30, Math.min(46, fitted));
  // The fretboard's exact width, so it can sit in the middle of the screen.
  const fretboardWidth = fixedWidth + instrument.frets * fretWidth;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={styles.backColumn}>{back}</View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.centreScroll}
          contentContainerStyle={styles.centre}
        >
          {controls}
        </ScrollView>
        {/* As wide as the back button's column, so the centre is the screen's centre. */}
        {width >= WIDE_SCREEN && <View style={styles.backColumn} />}
      </View>

      <View style={styles.stage}>
        <View style={{ width: fretboardWidth }}>
          <Fretboard
            {...fretboard}
            strings={tuning.strings}
            frets={instrument.frets}
            octaveCourses={instrument.octaveCourses}
            flats={tuning.flats}
            fretWidth={fretWidth}
          />
          {status !== undefined && <Text style={styles.status}>{status}</Text>}
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 8,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SIDE_PADDING,
      paddingVertical: 8,
    },
    backColumn: {
      width: BACK_COLUMN,
    },
    centreScroll: {
      flex: 1,
    },
    centre: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    stage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 8,
    },
    status: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 8,
    },
  });
}
