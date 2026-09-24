import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

import type { FretPosition } from '../music/bassFingering';
import { useWood } from '../state/WoodContext';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

export type BoardNote = {
  position: FretPosition;
  /** Short text on the dot, e.g. order numbers in a bass line ("2 8") or "R". */
  label: string;
  /** Filled in: the note sounding now, or the root of an interval. */
  active: boolean;
};

type Props = {
  /** Open strings from lowest to highest, as MIDI numbers. */
  strings: number[];
  stringNames: string[];
  notes: BoardNote[];
};

const FRETS_SHOWN = 6;
const FRET_W = 50;
const STRING_H = 30;
const LEFT = 30; // string names
const TOP = 8;
const BOTTOM = 22; // fret numbers
const DOT = 12;

/**
 * A short piece of neck with a few notes on it, each in its place with a short label:
 * a bass line numbered in playing order (the note sounding now filled in), or the two notes
 * of an interval.
 */
export default function MiniNeck({ strings, stringNames, notes }: Props) {
  const { colors } = useTheme();
  const { wood } = useWood();
  const styles = useThemedStyles(makeStyles);

  // Show the nut when the line is near it; otherwise start one fret below the lowest note.
  const fretted = notes.map((n) => n.position.fret).filter((f) => f > 0);
  const lowest = fretted.length ? Math.min(...fretted) : 1;
  const first = lowest <= 3 || notes.some((n) => n.position.fret === 0) ? 1 : lowest - 1;
  const showNut = first === 1;

  const width = LEFT + FRET_W * (FRETS_SHOWN + 0.5);
  const height = TOP + STRING_H * strings.length + BOTTOM;
  const rowY = (string: number) => TOP + STRING_H * (strings.length - 1 - string + 0.5);
  // Open notes sit left of the nut; fretted notes in the middle of their fret.
  const noteX = (fret: number) =>
    fret === 0 ? LEFT + FRET_W * 0.25 : LEFT + FRET_W * (fret - first + 1);
  const fretLineX = (i: number) => LEFT + FRET_W * (i + 0.5);
  const boardLeft = fretLineX(0);

  return (
    <View style={styles.wrap} accessibilityLabel="Notes on the neck">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Rect
          x={boardLeft}
          y={TOP}
          width={width - boardLeft}
          height={STRING_H * strings.length}
          fill={wood.base}
          rx={4}
        />
        {[3, 5, 7, 9, 12].map((f) =>
          f >= first && f < first + FRETS_SHOWN ? (
            <Circle
              key={f}
              cx={noteX(f)}
              cy={TOP + (STRING_H * strings.length) / 2}
              r={5}
              fill={wood.dot}
              opacity={0.6}
            />
          ) : null,
        )}
        {Array.from({ length: FRETS_SHOWN + 1 }, (_, i) => (
          <Line
            key={i}
            x1={fretLineX(i)}
            x2={fretLineX(i)}
            y1={TOP}
            y2={TOP + STRING_H * strings.length}
            stroke={wood.metal}
            strokeWidth={i === 0 && showNut ? 5 : 1.5}
          />
        ))}
        {strings.map((_, s) => (
          <Line
            key={s}
            x1={boardLeft}
            x2={width}
            y1={rowY(s)}
            y2={rowY(s)}
            stroke={wood.metal}
            strokeWidth={1 + (strings.length - s) * 0.4}
          />
        ))}
        {stringNames.map((name, s) => (
          <SvgText
            key={s}
            x={12}
            y={rowY(s) + 5}
            fill={colors.textMuted}
            fontSize={13}
            fontWeight="700"
            textAnchor="middle"
          >
            {name}
          </SvgText>
        ))}
        {Array.from({ length: FRETS_SHOWN }, (_, i) => (
          <SvgText
            key={i}
            x={noteX(first + i)}
            y={height - 6}
            fill={colors.textMuted}
            fontSize={11}
            textAnchor="middle"
          >
            {first + i}
          </SvgText>
        ))}
        {notes.map((n, i) => {
          const cx = noteX(n.position.fret);
          const cy = rowY(n.position.string);
          return (
            <Circle
              key={`c${i}`}
              cx={cx}
              cy={cy}
              r={DOT}
              fill={n.active ? colors.brand : colors.surface}
              stroke={colors.brand}
              strokeWidth={2}
            />
          );
        })}
        {notes.map((n, i) => (
          <SvgText
            key={`t${i}`}
            x={noteX(n.position.fret)}
            y={rowY(n.position.string) + 4}
            fill={n.active ? colors.onBrand : colors.text}
            fontSize={n.label.length > 2 ? 9 : 12}
            fontWeight="800"
            textAnchor="middle"
          >
            {n.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    wrap: {
      borderRadius: 14,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
  });
}
