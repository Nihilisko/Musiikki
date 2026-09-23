import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { IN_TUNE_CENTS } from '../music/tuner';

// A vintage car speedometer: cream face, chrome rim, black serif numbers and a red needle.
// The needle shows cents (−50 … +50); the "odometer" window shows the note and lights up
// from red to green as the string comes into tune.

const SIZE = 300; // drawing units; the gauge is scaled to the width it is given
const C = SIZE / 2;
/** The needle sweeps ±135° from straight up, like a speedometer from 0 to top speed. */
const SWEEP = 135;
const MAX_CENTS = 50;

const FACE = '#f1e4c4';
const INK = '#2a1a10';
const NEEDLE = '#d42330';
const RED = [217, 58, 58];
const AMBER = [232, 160, 42];
const GREEN = [46, 157, 87];

function angleFor(cents: number): number {
  const clamped = Math.max(-MAX_CENTS, Math.min(MAX_CENTS, cents));
  return (clamped / MAX_CENTS) * SWEEP;
}

/** A point on a circle around the centre; 0° is straight up, positive is clockwise. */
function polar(radius: number, degrees: number) {
  const rad = (degrees * Math.PI) / 180;
  return { x: C + radius * Math.sin(rad), y: C - radius * Math.cos(rad) };
}

function arc(radius: number, from: number, to: number) {
  const a = polar(radius, from);
  const b = polar(radius, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`;
}

function mix(a: number[], b: number[], t: number) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** Window light: green when in tune, amber when close, red when far off. */
export function lightColor(cents: number | null): string {
  if (cents === null) return '#1a1411';
  const off = Math.abs(cents);
  if (off <= IN_TUNE_CENTS) return mix(GREEN, GREEN, 0);
  if (off <= 15) return mix(GREEN, AMBER, (off - IN_TUNE_CENTS) / (15 - IN_TUNE_CENTS));
  return mix(AMBER, RED, Math.min(1, (off - 15) / 20));
}

// The dial never changes, so its tick marks are worked out once.
const LADDER_INNER = 88;
const LADDER_OUTER = 104;
const RUNGS = Array.from({ length: 21 }, (_, i) => -50 + i * 5).map((cents) => {
  const deg = angleFor(cents);
  const inner = polar(LADDER_INNER, deg);
  const outer = polar(LADDER_OUTER, deg);
  return { cents, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
});
const LABELS = [-50, -25, 0, 25, 50].map((cents) => {
  const p = polar(119, angleFor(cents));
  return { cents, x: p.x, y: p.y + 6 }; // upright, like the numbers on a speedometer
});

type Props = {
  /** Cents off, or null when no note is heard. */
  cents: number | null;
  /** Note shown in the window, e.g. "E2". */
  note: string;
  /** Width in points. */
  size: number;
};

export default function TunerGauge({ cents, note, size }: Props) {
  // The needle glides to each new reading instead of jumping.
  const angle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(angle, {
      toValue: cents === null ? -SWEEP : angleFor(cents),
      useNativeDriver: true,
      speed: 14,
      bounciness: 4,
    }).start();
  }, [cents, angle]);

  const rotate = angle.interpolate({
    inputRange: [-180, 180],
    outputRange: ['-180deg', '180deg'],
  });
  const light = lightColor(cents);
  const inTune = cents !== null && Math.abs(cents) <= IN_TUNE_CENTS;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Defs>
          <LinearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" />
            <Stop offset="0.45" stopColor="#c9ced4" />
            <Stop offset="0.55" stopColor="#6d747c" />
            <Stop offset="1" stopColor="#e9ecef" />
          </LinearGradient>
          <RadialGradient id="face" cx="50%" cy="45%" r="55%">
            <Stop offset="0" stopColor="#f8efd9" />
            <Stop offset="0.8" stopColor={FACE} />
            <Stop offset="1" stopColor="#dccaa0" />
          </RadialGradient>
        </Defs>

        {/* Chrome rim and cream face */}
        <Circle cx={C} cy={C} r={148} fill="url(#chrome)" />
        <Circle cx={C} cy={C} r={138} fill="#1a1411" />
        <Circle cx={C} cy={C} r={134} fill="url(#face)" />

        {/* The "ladder" band: two arcs joined by rungs every 5 cents */}
        <Path d={arc(LADDER_INNER, -SWEEP, SWEEP)} stroke={INK} strokeWidth={2} fill="none" />
        <Path d={arc(LADDER_OUTER, -SWEEP, SWEEP)} stroke={INK} strokeWidth={2} fill="none" />
        {/* The in-tune zone in green between the arcs */}
        <Path
          d={arc(
            (LADDER_INNER + LADDER_OUTER) / 2,
            angleFor(-IN_TUNE_CENTS),
            angleFor(IN_TUNE_CENTS),
          )}
          stroke="#2e9d57"
          strokeWidth={LADDER_OUTER - LADDER_INNER - 3}
          fill="none"
        />
        {RUNGS.map((r) => (
          <Line
            key={r.cents}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke={INK}
            strokeWidth={r.cents % 25 === 0 ? 3 : 1.5}
          />
        ))}
        {LABELS.map((l) => (
          <SvgText
            key={l.cents}
            x={l.x}
            y={l.y}
            fill={INK}
            fontSize={17}
            fontWeight="700"
            fontFamily="serif"
            textAnchor="middle"
          >
            {l.cents > 0 ? `+${l.cents}` : l.cents}
          </SvgText>
        ))}

        <SvgText
          x={C}
          y={C - 34}
          fill={INK}
          fontSize={26}
          fontWeight="700"
          fontFamily="serif"
          textAnchor="middle"
          letterSpacing={2}
        >
          TUNE
        </SvgText>
        <SvgText
          x={C}
          y={C + 52}
          fill={INK}
          fontSize={15}
          fontWeight="700"
          fontFamily="serif"
          textAnchor="middle"
          letterSpacing={2}
        >
          CENTS
        </SvgText>

        {/* The odometer window: the note, lit from behind */}
        <Rect x={C - 44} y={C + 66} width={88} height={40} rx={4} fill="#0f0b09" />
        <Rect x={C - 40} y={C + 70} width={80} height={32} rx={2} fill={light} />
        <SvgText
          x={C}
          y={C + 95}
          fill={inTune || cents !== null ? '#ffffff' : '#6f6257'}
          fontSize={24}
          fontWeight="800"
          textAnchor="middle"
          letterSpacing={2}
        >
          {note}
        </SvgText>
      </Svg>

      {/* The needle turns around the centre, above the dial */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Path d={`M ${C - 4} ${C + 22} L ${C} ${C - 108} L ${C + 4} ${C + 22} Z`} fill={NEEDLE} />
          <Circle cx={C} cy={C} r={11} fill={NEEDLE} />
          <Circle cx={C} cy={C} r={4} fill="#7a0e14" />
        </Svg>
      </Animated.View>
    </View>
  );
}
