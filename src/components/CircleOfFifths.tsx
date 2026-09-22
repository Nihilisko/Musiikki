import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, Text as SvgText } from 'react-native-svg';

import { circleSegment, type KeyMode } from '../music/circle';
import { colors } from '../theme/colors';

type Props = {
  /** Position at the top of the circle: 0 = C, 1 = G ... 11 = F. */
  index: number;
  mode: KeyMode;
  onChange: (index: number) => void;
  onModeChange: (mode: KeyMode) => void;
  size: number;
};

const SEGMENT = 30; // degrees per key (360 / 12)

const MASK = '#0c0d0f';
const LINE = '#8a9099';
const CELL = '#26292f';

/**
 * Numerals printed on the fixed mask, like a cardboard circle of fifths.
 * Each side repeats the window's layout turned a quarter circle: the major legend on the right,
 * the minor legend on the left. Slots are left / middle / right of the window.
 */
type Legend = { turn: number; outer: string[]; middle: string[]; inner: string };
const LEGENDS: Record<KeyMode, Legend> = {
  major: { turn: 90, outer: ['IV', 'I', 'V'], middle: ['ii', 'vi', 'iii'], inner: 'vii°' },
  minor: { turn: -90, outer: ['VI', 'III', 'VII'], middle: ['iv', 'i', 'v'], inner: 'ii°' },
};

/**
 * A circle of fifths you can turn with a finger, like the cardboard ones.
 * A fixed mask covers the disc; only the window at the top shows the key's seven chords.
 */
export default function CircleOfFifths({ index, mode, onChange, onModeChange, size }: Props) {
  // While dragging, the exact angle follows the finger; otherwise it sits on `index`.
  const [dragRotation, setDragRotation] = useState<number | null>(null);
  const rotation = dragRotation ?? index * SEGMENT;

  const center = size / 2;
  const r = {
    outer: size / 2 - 2,
    middle: size * 0.36,
    inner: size * 0.25,
    hub: size * 0.15,
  };
  const rings = {
    outer: [r.middle, r.outer],
    middle: [r.inner, r.middle],
    inner: [r.hub, r.inner],
  } as const;

  // The gesture handlers are created once, so they read the latest values through refs.
  const latest = useRef({ onChange, onModeChange, rotation });
  latest.current = { onChange, onModeChange, rotation };
  const drag = useRef({ startX: 0, startY: 0, lastAngle: 0, rotation: 0, moved: false });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        drag.current = {
          startX: locationX,
          startY: locationY,
          lastAngle: angleAt(locationX, locationY, center),
          rotation: latest.current.rotation,
          moved: false,
        };
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) + Math.abs(gesture.dy) > 6) drag.current.moved = true;
        const angle = angleAt(
          drag.current.startX + gesture.dx,
          drag.current.startY + gesture.dy,
          center,
        );
        // Add up small steps so crossing the top (359° -> 0°) doesn't jump.
        let step = angle - drag.current.lastAngle;
        if (step > 180) step -= 360;
        if (step < -180) step += 360;
        drag.current.lastAngle = angle;
        drag.current.rotation -= step; // turning clockwise brings earlier keys to the top
        setDragRotation(drag.current.rotation);
      },
      onPanResponderRelease: () => {
        const { moved, startX, startY, rotation: finalRotation } = drag.current;
        setDragRotation(null);
        if (moved) {
          latest.current.onChange(wrap(Math.round(finalRotation / SEGMENT)));
          return;
        }
        // A tap: in the window it brings that chord's key to the top;
        // on the printed legends it switches between major and minor.
        const tapped = angleAt(startX, startY, center);
        if (tapped <= 45 || tapped >= 315) {
          const signed = tapped > 180 ? tapped - 360 : tapped;
          latest.current.onChange(wrap(Math.round((signed + latest.current.rotation) / SEGMENT)));
        } else if (tapped > 45 && tapped < 180) {
          latest.current.onModeChange('major');
        } else {
          latest.current.onModeChange('minor');
        }
      },
      onPanResponderTerminate: () => setDragRotation(null),
    }),
  ).current;

  // The window: three cells in the outer and middle rings, one in the inner ring.
  const windowCells = [
    ...[-1, 0, 1].map((slot) => ({ ring: rings.outer, angle: slot * SEGMENT })),
    ...[-1, 0, 1].map((slot) => ({ ring: rings.middle, angle: slot * SEGMENT })),
    { ring: rings.inner, angle: 0 },
  ];
  const tonicRing = mode === 'major' ? rings.outer : rings.middle;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <ClipPath id="window">
            {windowCells.map((cell, i) => (
              <Path key={i} d={ringSegment(center, cell.ring[0], cell.ring[1], cell.angle)} />
            ))}
          </ClipPath>
        </Defs>

        {/* The mask: a dark disc that hides everything outside the window. */}
        <Circle cx={center} cy={center} r={r.outer} fill={MASK} />

        {/* Window cells stay still; the tonic cell is highlighted. */}
        {windowCells.map((cell, i) => (
          <Path
            key={i}
            d={ringSegment(center, cell.ring[0], cell.ring[1], cell.angle)}
            fill={cell.ring === tonicRing && cell.angle === 0 ? colors.accent : CELL}
          />
        ))}

        {/* The turning disc, visible only through the window. */}
        <G clipPath="url(#window)">
          {Array.from({ length: 12 }, (_, i) => {
            const angle = normalise(i * SEGMENT - rotation);
            const segment = circleSegment(i);
            const atTop = Math.abs(angle) < SEGMENT / 2;
            const dark = (ring: readonly number[]) => atTop && ring === tonicRing;
            return (
              <G key={i}>
                <Label
                  center={center}
                  angle={angle}
                  r={(r.middle + r.outer) / 2}
                  text={segment.major}
                  size={size * 0.07}
                  color={dark(rings.outer) ? '#1a1a1a' : colors.text}
                  bold
                />
                <Label
                  center={center}
                  angle={angle}
                  r={(r.inner + r.middle) / 2}
                  text={segment.minor}
                  size={size * 0.05}
                  color={dark(rings.middle) ? '#1a1a1a' : colors.text}
                  bold
                />
                <Label
                  center={center}
                  angle={angle}
                  r={(r.hub + r.inner) / 2}
                  text={segment.diminished}
                  size={size * 0.042}
                  color={colors.text}
                />
              </G>
            );
          })}
        </G>

        {/* Outlines of the window, drawn on top so they don't move. */}
        {windowCells.map((cell, i) => (
          <Path
            key={i}
            d={ringSegment(center, cell.ring[0], cell.ring[1], cell.angle)}
            fill="none"
            stroke={LINE}
            strokeWidth={1.5}
          />
        ))}

        {/* Legends printed on the mask: major on the right, minor on the left. */}
        {(['major', 'minor'] as KeyMode[]).map((legendMode) => {
          const legend = LEGENDS[legendMode];
          const active = legendMode === mode;
          const textColor = active ? colors.accent : '#5d626b';
          const lineColor = active ? LINE : '#3a3d44';
          const slots = [-1, 0, 1];
          const cells = [
            ...slots.map((slot) => ({ ring: rings.outer, slot, text: legend.outer[slot + 1] })),
            ...slots.map((slot) => ({ ring: rings.middle, slot, text: legend.middle[slot + 1] })),
            { ring: rings.inner, slot: 0, text: legend.inner },
          ];
          return (
            <G key={legendMode}>
              {cells.map((cell, i) => {
                const angle = cell.slot * SEGMENT + legend.turn;
                return (
                  <G key={i}>
                    <Path
                      d={ringSegment(center, cell.ring[0], cell.ring[1], angle)}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={1.5}
                    />
                    <Label
                      center={center}
                      angle={angle}
                      r={(cell.ring[0] + cell.ring[1]) / 2}
                      text={cell.text}
                      size={size * (cell.ring === rings.outer ? 0.05 : 0.04)}
                      color={textColor}
                      bold
                    />
                  </G>
                );
              })}
            </G>
          );
        })}

        {/* Hub with the two labels, like the printed circle. */}
        <Circle cx={center} cy={center} r={r.hub} fill={MASK} stroke={LINE} strokeWidth={1.5} />
        <Path
          d={`M ${center} ${center - r.hub} L ${center} ${center + r.hub}`}
          stroke={LINE}
          strokeWidth={1.5}
        />
        <HubLabel
          x={center - r.hub / 2}
          y={center}
          text="Minor"
          size={size * 0.034}
          active={mode === 'minor'}
        />
        <HubLabel
          x={center + r.hub / 2}
          y={center}
          text="Major"
          size={size * 0.034}
          active={mode === 'major'}
        />
      </Svg>
      {/* A clear layer on top catches the finger, so positions are measured from the circle. */}
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />
    </View>
  );
}

type LabelProps = {
  center: number;
  angle: number;
  r: number;
  text: string;
  size: number;
  color: string;
  bold?: boolean;
};

function Label({ center, angle, r, text, size, color, bold }: LabelProps) {
  const [x, y] = polar(center, angle, r);
  return (
    <SvgText
      x={x}
      y={y + size * 0.35}
      fill={color}
      fontSize={size}
      fontFamily="sans-serif"
      fontWeight={bold ? '700' : '500'}
      textAnchor="middle"
    >
      {text}
    </SvgText>
  );
}

type HubLabelProps = { x: number; y: number; text: string; size: number; active: boolean };

function HubLabel({ x, y, text, size, active }: HubLabelProps) {
  return (
    <SvgText
      x={x}
      y={y + size * 0.35}
      fill={active ? colors.accent : '#5d626b'}
      fontSize={size}
      fontFamily="sans-serif"
      fontWeight="700"
      textAnchor="middle"
    >
      {text}
    </SvgText>
  );
}

function wrap(i: number): number {
  return ((i % 12) + 12) % 12;
}

/** Angle folded into -180...180, so "near the top" is simply a small number. */
function normalise(angle: number): number {
  const a = ((angle % 360) + 360) % 360;
  return a > 180 ? a - 360 : a;
}

/** Point at `angle` degrees clockwise from the top, `r` away from the centre. */
function polar(center: number, angle: number, r: number): [number, number] {
  const radians = (angle * Math.PI) / 180;
  return [center + r * Math.sin(radians), center - r * Math.cos(radians)];
}

/** Angle of a point, in degrees clockwise from the top (0-360). */
function angleAt(x: number, y: number, center: number): number {
  const degrees = (Math.atan2(x - center, center - y) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

/** SVG path of one ring slice between radii r1 < r2, centred on `angle`. */
function ringSegment(center: number, r1: number, r2: number, angle: number): string {
  const a0 = angle - SEGMENT / 2;
  const a1 = angle + SEGMENT / 2;
  const [x0, y0] = polar(center, a0, r2);
  const [x1, y1] = polar(center, a1, r2);
  const [x2, y2] = polar(center, a1, r1);
  const [x3, y3] = polar(center, a0, r1);
  return `M ${x0} ${y0} A ${r2} ${r2} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${r1} ${r1} 0 0 0 ${x3} ${y3} Z`;
}
