import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { circleSegment, type KeyMode } from '../music/circle';
import { colors } from '../theme/colors';

type Props = {
  /** Position at the top of the circle: 0 = C, 1 = G ... 11 = F. */
  index: number;
  mode: KeyMode;
  onChange: (index: number) => void;
  size: number;
};

const SEGMENT = 30; // degrees per key (360 / 12)

/** Roman numerals printed on the fixed window, left / middle / right of the top. */
const NUMERALS: Record<KeyMode, { outer: string[]; middle: string[]; inner: string }> = {
  major: { outer: ['IV', 'I', 'V'], middle: ['ii', 'vi', 'iii'], inner: 'vii°' },
  minor: { outer: ['VI', 'III', 'VII'], middle: ['iv', 'i', 'v'], inner: 'ii°' },
};

/**
 * A circle of fifths you can turn with a finger, like the cardboard ones.
 * The chord names turn; the window at the top with I, IV, V... stays still.
 */
export default function CircleOfFifths({ index, mode, onChange, size }: Props) {
  // While dragging, the exact angle follows the finger; otherwise it sits on `index`.
  const [dragRotation, setDragRotation] = useState<number | null>(null);
  const rotation = dragRotation ?? index * SEGMENT;

  const center = size / 2;
  const radius = {
    outer: size / 2 - 2,
    middle: size * 0.36,
    inner: size * 0.25,
    hub: size * 0.16,
  };

  // The gesture handlers are created once, so they read the latest values through refs.
  const latest = useRef({ index, onChange, rotation });
  latest.current = { index, onChange, rotation };
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
        const angle = angleAt(drag.current.startX + gesture.dx, drag.current.startY + gesture.dy, center);
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
        let target: number;
        if (!moved) {
          // A tap: bring the tapped key to the top.
          const tapped = angleAt(startX, startY, center) + latest.current.rotation;
          target = Math.round(tapped / SEGMENT);
        } else {
          target = Math.round(finalRotation / SEGMENT); // snap to the nearest key
        }
        setDragRotation(null);
        latest.current.onChange(((target % 12) + 12) % 12);
      },
      onPanResponderTerminate: () => setDragRotation(null),
    }),
  ).current;

  const topIndex = Math.round(rotation / SEGMENT);
  const numerals = NUMERALS[mode];

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {Array.from({ length: 12 }, (_, i) => {
          const angle = i * SEGMENT - rotation;
          const segment = circleSegment(i);
          // Distance from the top: -1, 0, 1 are inside the window.
          const offset = ((((i - topIndex) % 12) + 18) % 12) - 6;
          const inWindow = Math.abs(offset) <= 1;
          const tonicOuter = offset === 0 && mode === 'major';
          const tonicMiddle = offset === 0 && mode === 'minor';
          return (
            <G key={i}>
              <Path
                d={ringSegment(center, radius.middle, radius.outer, angle)}
                fill={tonicOuter ? colors.accent : inWindow ? '#3a3e46' : colors.surface}
                stroke={colors.background}
                strokeWidth={2}
              />
              <Path
                d={ringSegment(center, radius.inner, radius.middle, angle)}
                fill={tonicMiddle ? colors.accent : inWindow ? '#33363d' : '#1a1c20'}
                stroke={colors.background}
                strokeWidth={2}
              />
              <Path
                d={ringSegment(center, radius.hub, radius.inner, angle)}
                fill={offset === 0 ? '#33363d' : '#17181b'}
                stroke={colors.background}
                strokeWidth={2}
              />
              <Label
                center={center}
                angle={angle}
                r={(radius.middle + radius.outer) / 2 + size * 0.02}
                text={segment.major}
                size={size * 0.06}
                color={tonicOuter ? '#1a1a1a' : inWindow ? colors.text : colors.textMuted}
                bold
              />
              <Label
                center={center}
                angle={angle}
                r={(radius.inner + radius.middle) / 2 + size * 0.015}
                text={segment.minor}
                size={size * 0.042}
                color={tonicMiddle ? '#1a1a1a' : inWindow ? colors.text : colors.textMuted}
              />
              <Label
                center={center}
                angle={angle}
                r={(radius.hub + radius.inner) / 2 + size * 0.01}
                text={segment.diminished}
                size={size * 0.034}
                color={offset === 0 ? colors.text : '#6b7078'}
              />
            </G>
          );
        })}

        {/* The fixed window: numerals that don't turn with the chords. */}
        {[-1, 0, 1].map((slot) => (
          <G key={slot}>
            <Label
              center={center}
              angle={slot * SEGMENT}
              r={(radius.middle + radius.outer) / 2 - size * 0.045}
              text={numerals.outer[slot + 1]}
              size={size * 0.034}
              color={slot === 0 && mode === 'major' ? '#1a1a1a' : colors.accent}
            />
            <Label
              center={center}
              angle={slot * SEGMENT}
              r={(radius.inner + radius.middle) / 2 - size * 0.035}
              text={numerals.middle[slot + 1]}
              size={size * 0.03}
              color={slot === 0 && mode === 'minor' ? '#1a1a1a' : colors.accent}
            />
          </G>
        ))}
        <Label
          center={center}
          angle={0}
          r={(radius.hub + radius.inner) / 2 - size * 0.028}
          text={numerals.inner}
          size={size * 0.026}
          color={colors.accent}
        />
        <Circle cx={center} cy={center} r={radius.hub - 2} fill={colors.background} />
        <SvgText
          x={center}
          y={center + size * 0.015}
          fill={colors.textMuted}
          fontSize={size * 0.04}
          fontFamily="sans-serif"
          fontWeight="600"
          textAnchor="middle"
        >
          {mode === 'major' ? 'Major' : 'Minor'}
        </SvgText>
      </Svg>
      {/* A clear layer on top catches the finger, so positions are always measured from the circle. */}
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
