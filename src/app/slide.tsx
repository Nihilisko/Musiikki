import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CHIME_MS, useChime } from '../audio/useChime';
import { useDrone } from '../audio/useDrone';
import { useTuner } from '../audio/useTuner';
import ChipRow from '../components/ChipRow';
import Dropdown from '../components/Dropdown';
import KeyPicker from '../components/KeyPicker';
import MiniNeck from '../components/MiniNeck';
import TunerGauge from '../components/TunerGauge';
import { DEGREES } from '../music/degreeQuiz';
import { noteName, noteNameWithOctave } from '../music/notes';
import { pitchClass } from '../music/scales';
import {
  HOLD_MS,
  pickTarget,
  SLIDE_SCALES,
  slideTargets,
  TOLERANCES,
  updateHold,
  type SlideTarget,
} from '../music/slideTrainer';
import { spellScale } from '../music/spelling';
import { useInstrument } from '../state/InstrumentContext';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const ORDINAL = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
/** After a hit, the next target comes this long after the chime. */
const NEXT_MS = 700;

// Slide intonation: play the target note with the slide and hold it in tune for a second.
export default function SlideScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const { tuning } = useInstrument();
  const playChime = useChime();

  const [root, setRoot] = useState(7); // G: the key of Open G, the classic slide tuning
  const [scaleIndex, setScaleIndex] = useState(0);
  const [toleranceIndex, setToleranceIndex] = useState(0);
  const [droneOn, setDroneOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [target, setTarget] = useState<SlideTarget | null>(null);
  const [holdSince, setHoldSince] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [hits, setHits] = useState(0);
  const [justHit, setJustHit] = useState(false);
  const nextTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const scale = SLIDE_SCALES[scaleIndex].scale;
  const tolerance = TOLERANCES[toleranceIndex].cents;
  const targets = useMemo(
    () => slideTargets(tuning.strings, root, scale),
    [tuning.strings, root, scale],
  );
  const names = spellScale(root, scale).names;

  // A new target when the key, scale or tuning changes (and the first one).
  useEffect(() => {
    setTarget(pickTarget(targets));
    setHoldSince(null);
  }, [targets]);

  // The tuner listens for just this one note, so it measures how far off it you are.
  const tunerTargets = useMemo(
    () => (target ? [{ stringIndex: target.string, octave: false, midi: target.midi }] : []),
    [target],
  );
  const { status, reading, pause } = useTuner(tunerTargets, listening && target !== null);
  useDrone({ root, fifth: true, volume: 0.35, playing: droneOn && listening });

  const cents = reading ? reading.cents : null;
  const inTune = cents !== null && Math.abs(cents) <= tolerance && !justHit;

  // Holding: count how long the note stays in tune; after a second, it's a hit.
  useEffect(() => {
    if (!listening || justHit) return;
    const t = Date.now();
    const { since, held } = updateHold(holdSince, inTune, t);
    if (since !== holdSince) setHoldSince(since);
    if (held) {
      setHits((h) => h + 1);
      setJustHit(true);
      setHoldSince(null);
      playChime();
      pause(CHIME_MS + 150); // don't let the tuner hear the chime
      nextTimer.current = setTimeout(() => {
        setTarget((old) => pickTarget(targets, old));
        setJustHit(false);
      }, NEXT_MS);
    }
    // Runs for every reading and clock tick; the functions above are stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTune, now, listening]);

  // A clock tick while holding, so the progress bar fills smoothly between readings.
  useEffect(() => {
    if (holdSince === null) return;
    const timer = setInterval(() => setNow(Date.now()), 80);
    return () => clearInterval(timer);
  }, [holdSince]);

  useEffect(() => () => clearTimeout(nextTimer.current), []);

  function skip() {
    clearTimeout(nextTimer.current);
    setJustHit(false);
    setHoldSince(null);
    setTarget((old) => pickTarget(targets, old));
  }

  const progress =
    holdSince === null ? (justHit ? 1 : 0) : Math.min(1, (now - holdSince) / HOLD_MS);
  const stringCount = tuning.strings.length;
  const stringName = target
    ? `${ORDINAL[stringCount - 1 - target.string] ?? `${stringCount - target.string}th`} string (${noteName(tuning.strings[target.string], tuning.flats)})`
    : '';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <KeyPicker root={root} rootName={names[root]!} onChange={setRoot} />
        <Dropdown
          label={SLIDE_SCALES[scaleIndex].label}
          options={SLIDE_SCALES.map((s) => s.label)}
          selected={scaleIndex}
          onSelect={setScaleIndex}
        />
      </View>
      <ChipRow
        options={TOLERANCES.map((t) => t.label)}
        selected={toleranceIndex}
        onSelect={setToleranceIndex}
      />

      {target && (
        <View style={styles.card}>
          <Text style={styles.target}>
            {names[pitchClass(target.midi)] ?? noteNameWithOctave(target.midi)}
            <Text style={styles.degree}> {DEGREES[target.degree].short}</Text>
          </Text>
          <Text style={styles.hint}>
            {stringName}, fret {target.fret} · slide straight over the fret wire
          </Text>
          <MiniNeck
            strings={tuning.strings}
            stringNames={tuning.strings.map((m) => noteName(m, tuning.flats))}
            notes={[
              {
                position: { string: target.string, fret: target.fret },
                label: DEGREES[target.degree].short,
                active: true,
              },
            ]}
          />
        </View>
      )}

      <View style={styles.gauge}>
        <TunerGauge
          cents={listening ? cents : null}
          note={target ? noteNameWithOctave(target.midi, tuning.flats) : ''}
          size={Math.min(width - 32, 300)}
          inTuneCents={tolerance}
        />
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.hint}>
          {Platform.OS === 'web'
            ? 'The trainer listens through the microphone in the phone app; it does not work in the browser preview.'
            : !listening
              ? 'Press Listen, then play the note with the slide and hold it.'
              : status === 'denied'
                ? 'Microphone permission was denied. Allow it in the phone settings.'
                : status === 'unavailable'
                  ? 'The microphone could not be started.'
                  : justHit
                    ? 'In tune! Next note…'
                    : cents === null
                      ? 'Listening…'
                      : inTune
                        ? 'Hold it…'
                        : cents < 0
                          ? 'Too low: move the slide towards the body'
                          : 'Too high: move the slide towards the nut'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.hits}>Hits {hits}</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Drone</Text>
          <Switch
            value={droneOn}
            onValueChange={setDroneOn}
            trackColor={{ true: colors.brand, false: colors.border }}
            thumbColor={colors.onBrand}
            accessibilityLabel="Drone"
          />
        </View>
      </View>
      {droneOn && (
        <Text style={styles.hint}>
          Use headphones with the drone, or the microphone may hear the drone instead of you.
        </Text>
      )}

      <View style={styles.buttons}>
        <Pressable
          onPress={skip}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>Skip</Text>
        </Pressable>
        <Pressable
          onPress={() => setListening((l) => !l)}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          accessibilityLabel={listening ? 'Stop listening' : 'Listen'}
        >
          <Ionicons name={listening ? 'stop' : 'mic'} size={20} color={colors.onBrand} />
          <Text style={styles.primaryText}>{listening ? 'Stop' : 'Listen'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 14,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    card: {
      gap: 8,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    target: {
      color: colors.text,
      fontSize: 34,
      fontWeight: '800',
    },
    degree: {
      color: colors.accentText,
      fontSize: 20,
      fontWeight: '700',
    },
    hint: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
    },
    gauge: {
      alignItems: 'center',
      gap: 10,
    },
    bar: {
      alignSelf: 'stretch',
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      backgroundColor: '#2e9d57',
    },
    hits: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    label: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    primary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 12,
      backgroundColor: colors.brand,
    },
    primaryText: {
      color: colors.onBrand,
      fontSize: 17,
      fontWeight: '700',
    },
    secondary: {
      paddingVertical: 14,
      paddingHorizontal: 22,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
