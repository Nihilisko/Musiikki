import { Fragment } from 'react';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

import { pitchClass } from '../music/scales';
import { diagramStart } from '../music/voicings';
import type { NoteColors } from '../theme/noteColors';

// A chord box like in chord books: strings standing up (lowest on the left), frets across,
// a dot for each pressed note, "o" above open strings and "×" above muted ones.

const ROWS = 5; // frets shown
const MUTED = -1;

type Props = {
  /** Open strings, lowest first (MIDI). */
  strings: number[];
  /** Fret for each string: −1 muted, 0 open. */
  frets: number[];
  /** Pitch class of the chord's root, coloured as the root. */
  root: number;
  /** Text for each pitch class (index 0 = C … 11 = B): a note name or a degree. */
  labels: (string | undefined)[];
  noteColors: NoteColors;
  /** Colours for the lines and small text, from the theme. */
  lineColor: string;
  textColor: string;
  width: number;
};

export default function ChordDiagram({
  strings,
  frets,
  root,
  labels,
  noteColors,
  lineColor,
  textColor,
  width,
}: Props) {
  const count = strings.length;
  const start = diagramStart(frets, ROWS);
  // Drawing units: the box is scaled to `width`.
  // The box is always the same width, so 4- and 6-string diagrams look alike in size.
  const left = 64; // room for the "10fr" label, clear of a barre
  const top = 36; // room for o and ×
  const boxWidth = 210;
  const gap = boxWidth / Math.max(1, count - 1); // between strings
  const row = 48; // between frets
  const w = left + boxWidth + 26;
  const h = top + row * ROWS + 12;
  const dot = Math.min(20, gap * 0.46);

  const x = (string: number) => left + string * gap;
  const y = (fret: number) => top + (fret - start + 0.5) * row; // middle of the fret space

  // A barre: one finger across several strings on the lowest pressed fret, drawn as a bar.
  const pressed = frets.map((f, i) => ({ f, i })).filter((p) => p.f > 0);
  const lowest = pressed.length ? Math.min(...pressed.map((p) => p.f)) : 0;
  const onLowest = pressed.filter((p) => p.f === lowest).map((p) => p.i);
  const barreFrom = onLowest[0];
  const barreTo = onLowest[onLowest.length - 1];
  const barre =
    pressed.length > 4 &&
    onLowest.length >= 2 &&
    frets.every((f, i) => i < barreFrom || i > barreTo || f >= lowest);

  return (
    <Svg width={width} height={(width * h) / w} viewBox={`0 0 ${w} ${h}`}>
      {/* The nut (thick) when the diagram starts at the first fret, otherwise a fret number */}
      {start === 1 ? (
        <Rect x={left - 2} y={top - 6} width={boxWidth + 4} height={7} rx={2} fill={textColor} />
      ) : (
        <SvgText
          x={left - dot - 6}
          y={top + row * 0.5 + 6}
          fill={textColor}
          fontSize={17}
          fontWeight="700"
          textAnchor="end"
        >
          {`${start}fr`}
        </SvgText>
      )}
      {Array.from({ length: ROWS + 1 }, (_, r) => (
        <Line
          key={`f${r}`}
          x1={left}
          x2={left + boxWidth}
          y1={top + r * row}
          y2={top + r * row}
          stroke={lineColor}
          strokeWidth={2}
        />
      ))}
      {strings.map((_, s) => (
        <Line
          key={`s${s}`}
          x1={x(s)}
          x2={x(s)}
          y1={top}
          y2={top + ROWS * row}
          stroke={lineColor}
          strokeWidth={2}
        />
      ))}

      {barre && (
        <Rect
          x={x(barreFrom) - dot}
          y={y(lowest) - dot}
          width={x(barreTo) - x(barreFrom) + dot * 2}
          height={dot * 2}
          rx={dot}
          fill={noteColors.scale.background}
          opacity={0.45}
        />
      )}

      {frets.map((fret, s) => {
        if (fret === MUTED || fret === 0) {
          return (
            <SvgText
              key={`m${s}`}
              x={x(s)}
              y={top - 14}
              fill={textColor}
              fontSize={20}
              fontWeight="700"
              textAnchor="middle"
            >
              {fret === MUTED ? '×' : 'o'}
            </SvgText>
          );
        }
        const pc = pitchClass(strings[s] + fret);
        const role = pc === root ? noteColors.root : noteColors.scale;
        return (
          <Fragment key={`d${s}`}>
            <Circle cx={x(s)} cy={y(fret)} r={dot} fill={role.background} />
            <SvgText
              x={x(s)}
              y={y(fret) + 6}
              fill={role.text}
              fontSize={labels[pc] && labels[pc]!.length > 2 ? 13 : 17}
              fontWeight="700"
              textAnchor="middle"
            >
              {labels[pc] ?? ''}
            </SvgText>
          </Fragment>
        );
      })}
    </Svg>
  );
}
