// Tuner maths: from a frequency to the nearest string of the chosen tuning, and how far off
// it is in cents (100 cents = one semitone = one fret).

export const DEFAULT_A4 = 440;
export const MIN_A4 = 432;
export const MAX_A4 = 446;

/** How close counts as "in tune", in cents. Most ears can't hear less than ±3. */
export const IN_TUNE_CENTS = 3;

/** Frequency of a MIDI note. A4 (MIDI 69) is the reference; each semitone is ×2^(1/12). */
export function frequencyOf(midi: number, a4 = DEFAULT_A4): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/** How many cents `frequency` is above (+) or below (−) `target`. */
export function centsOff(frequency: number, target: number): number {
  return 1200 * Math.log2(frequency / target);
}

export type TunerTarget = {
  /** Index of the string in the tuning (0 = lowest). */
  stringIndex: number;
  /** True for the octave string of a 12-string course. */
  octave: boolean;
  midi: number;
};

export type TunerReading = TunerTarget & { cents: number };

/** Every string the tuner can tune to: the tuning's strings plus 12-string octave strings. */
export function tunerTargets(strings: number[], octaveCourses = 0): TunerTarget[] {
  const targets: TunerTarget[] = strings.map((midi, stringIndex) => ({
    stringIndex,
    octave: false,
    midi,
  }));
  for (let i = 0; i < octaveCourses && i < strings.length; i++) {
    targets.push({ stringIndex: i, octave: true, midi: strings[i] + 12 });
  }
  return targets;
}

/** The string closest to `frequency`, and how far off it is. */
export function nearestString(
  frequency: number,
  targets: TunerTarget[],
  a4 = DEFAULT_A4,
): TunerReading | null {
  let best: TunerReading | null = null;
  for (const target of targets) {
    const cents = centsOff(frequency, frequencyOf(target.midi, a4));
    if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { ...target, cents };
  }
  return best;
}

/** The frequency range worth listening to for these strings, with some room either side. */
export function listeningRange(targets: TunerTarget[], a4 = DEFAULT_A4) {
  const midis = targets.map((t) => t.midi);
  return {
    // A string can be tuned far down (a new string) or up; allow about five semitones.
    min: frequencyOf(Math.min(...midis) - 5, a4),
    max: frequencyOf(Math.max(...midis) + 5, a4),
  };
}
