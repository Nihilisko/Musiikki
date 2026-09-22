import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import type { Wood } from '../theme/woods';

// Drawn in a 1000 × 100 box and stretched to the neck's size, so it fits any fretboard.
const WIDTH = 1000;
const HEIGHT = 100;
const STREAKS = 18;

/**
 * A repeatable "random" number between 0 and 1. The same seed always gives the same number,
 * so the grain looks natural but does not change every time the screen is drawn.
 */
function random(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Streak = { d: string; dark: boolean; width: number; opacity: number };

/** Long, gently waving lines along the neck, like the grain of a real fretboard. */
function makeStreaks(): Streak[] {
  return Array.from({ length: STREAKS }, (_, i) => {
    const y = random(i + 1) * HEIGHT;
    const wave = 1 + random(i + 50) * 3; // how far the line drifts up and down
    const c1 = y + (random(i + 100) - 0.5) * 2 * wave;
    const c2 = y + (random(i + 150) - 0.5) * 2 * wave;
    const end = y + (random(i + 200) - 0.5) * wave;
    return {
      d: `M 0 ${y.toFixed(1)} C 330 ${c1.toFixed(1)}, 660 ${c2.toFixed(1)}, ${WIDTH} ${end.toFixed(1)}`,
      dark: i % 3 !== 0, // two dark streaks for every light one
      width: 0.4 + random(i + 250) * 1.4,
      opacity: 0.35 + random(i + 300) * 0.45,
    };
  });
}

// The same for every fretboard, so work it out once.
const STREAK_LINES = makeStreaks();

/** Fills its parent with the wood's colour and grain. Put it behind the strings and notes. */
export default function WoodGrain({ wood }: { wood: Wood }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
        <Rect width={WIDTH} height={HEIGHT} fill={wood.base} />
        {STREAK_LINES.map((s, i) => (
          <Path
            key={i}
            d={s.d}
            stroke={s.dark ? wood.grain[0] : wood.grain[1]}
            strokeWidth={s.width}
            strokeOpacity={s.opacity}
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}
