import { Fragment } from 'react';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

import { noteNameWithOctave } from '../music/notes';
import type { SlideChord } from '../music/openTuning';
import type { Wood } from '../theme/woods';

// The open tuning chord map: the neck seen from the front, with a coloured bar across all
// strings wherever a chord of the key can be played with a slide or one finger.

type Props = {
  strings: number[];
  frets: number;
  chords: SlideChord[];
  /** Show only I, IV and V. */
  primaryOnly: boolean;
  flats?: boolean;
  wood: Wood;
  textColor: string;
  mutedTextColor: string;
  width: number;
};

const LABEL_W = 40; // string names on the left
const OPEN_W = 34; // the open-string column
const TOP = 46; // room for chord labels above the neck
const STRING_GAP = 30;

export default function SlideMap({
  strings,
  frets,
  chords,
  primaryOnly,
  flats,
  wood,
  textColor,
  mutedTextColor,
  width,
}: Props) {
  const fretW = (width - LABEL_W - OPEN_W - 8) / frets;
  const neckH = STRING_GAP * (strings.length - 1) + 24;
  const height = TOP + neckH + 26;
  // x of the middle of a fret space (0 = the open column).
  const cx = (fret: number) =>
    fret === 0 ? LABEL_W + OPEN_W / 2 : LABEL_W + OPEN_W + (fret - 0.5) * fretW;
  // Highest string at the top, as on the other fretboards.
  const sy = (string: number) => TOP + 12 + (strings.length - 1 - string) * STRING_GAP;
  const shown = chords.filter((c) => !primaryOnly || c.primary);

  return (
    <Svg width={width} height={height}>
      {/* Neck, nut and frets */}
      <Rect
        x={LABEL_W + OPEN_W}
        y={TOP}
        width={fretW * frets}
        height={neckH}
        rx={4}
        fill={wood.base}
      />
      <Rect x={LABEL_W + OPEN_W - 5} y={TOP} width={5} height={neckH} fill="#eee8d5" />
      {Array.from({ length: frets }, (_, i) => (
        <Line
          key={`f${i}`}
          x1={LABEL_W + OPEN_W + (i + 1) * fretW}
          x2={LABEL_W + OPEN_W + (i + 1) * fretW}
          y1={TOP}
          y2={TOP + neckH}
          stroke={wood.metal}
          strokeWidth={2}
        />
      ))}
      {Array.from({ length: frets + 1 }, (_, fret) => (
        <SvgText
          key={`n${fret}`}
          x={cx(fret)}
          y={TOP + neckH + 18}
          fill={mutedTextColor}
          fontSize={11}
          textAnchor="middle"
        >
          {fret === 0 ? 'Open' : fret}
        </SvgText>
      ))}
      {strings.map((midi, s) => (
        <Fragment key={`s${s}`}>
          <Line
            x1={LABEL_W + 4}
            x2={LABEL_W + OPEN_W + fretW * frets}
            y1={sy(s)}
            y2={sy(s)}
            stroke={wood.metal}
            strokeWidth={1 + (strings.length - s) * 0.25}
          />
          <SvgText
            x={LABEL_W - 6}
            y={sy(s) + 4}
            fill={textColor}
            fontSize={12}
            fontWeight="600"
            textAnchor="end"
          >
            {noteNameWithOctave(midi, flats)}
          </SvgText>
        </Fragment>
      ))}

      {/* One bar per chord position, with the strings to press a fret away as dots */}
      {shown.map((chord) =>
        chord.positions.map((pos) => {
          const x = cx(pos.fret);
          const opacity = chord.primary ? 1 : 0.55;
          const barW = Math.min(18, fretW * 0.6);
          return (
            <Fragment key={`${chord.numeral}-${pos.fret}`}>
              <Rect
                x={x - barW / 2}
                y={TOP + 4}
                width={barW}
                height={neckH - 8}
                rx={barW / 2}
                fill={chord.color}
                opacity={opacity}
              />
              {pos.changed.map((c) => (
                <Circle
                  key={`c${c.string}`}
                  cx={cx(c.fret)}
                  cy={sy(c.string)}
                  r={9}
                  fill={chord.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
              {pos.muted.map((string) => (
                <SvgText
                  key={`m${string}`}
                  x={x}
                  y={sy(string) + 5}
                  fill="#ffffff"
                  fontSize={14}
                  fontWeight="800"
                  textAnchor="middle"
                >
                  ×
                </SvgText>
              ))}
              <SvgText
                x={x}
                y={TOP - 24}
                fill={chord.primary ? textColor : mutedTextColor}
                fontSize={12}
                fontWeight="700"
                textAnchor="middle"
              >
                {chord.numeral}
              </SvgText>
              <SvgText
                x={x}
                y={TOP - 8}
                fill={chord.primary ? textColor : mutedTextColor}
                fontSize={14}
                fontWeight="800"
                textAnchor="middle"
              >
                {chord.name}
              </SvgText>
            </Fragment>
          );
        }),
      )}
    </Svg>
  );
}
