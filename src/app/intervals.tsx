import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useIntervalPlayer } from '../audio/useIntervalPlayer';
import ChipRow from '../components/ChipRow';
import MiniNeck from '../components/MiniNeck';
import { intervalShape } from '../music/intervalShape';
import {
  DIRECTIONS,
  INTERVAL_LEVELS,
  INTERVALS,
  intervalInfo,
  makeQuestion,
  type IntervalQuestion,
} from '../music/intervals';
import { noteName } from '../music/notes';
import {
  cleanStats,
  EMPTY_STATS,
  readyForNext,
  recordAnswer,
  type PracticeStats,
} from '../music/practiceStats';
import { useInstrument } from '../state/InstrumentContext';
import { loadJson, saveJson } from '../state/storage';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const RIGHT = '#2e9d57';
const WRONG = '#d93a3a';
/** The "Custom" choice comes after the levels. */
const CUSTOM = INTERVAL_LEVELS.length;
const STORAGE_KEY = 'ear-intervals';

/** What is saved on the phone: the last settings and the statistics of each level. */
type Saved = {
  levelIndex: number;
  directionIndex: number;
  custom: number[];
  stats: Record<string, PracticeStats>;
};

// Interval ear training: two notes play, you pick the interval between them.
export default function IntervalsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { play } = useIntervalPlayer();

  const { instrument, tuning } = useInstrument();

  const [levelIndex, setLevelIndex] = useState(0);
  const [directionIndex, setDirectionIndex] = useState(0);
  const [custom, setCustom] = useState<number[]>([3, 4, 7]);
  const [stats, setStats] = useState<Record<string, PracticeStats>>({});
  const [loaded, setLoaded] = useState(false);
  const [question, setQuestion] = useState<IntervalQuestion | null>(null);
  const [answer, setAnswer] = useState<number | null>(null); // the chosen interval
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });

  // Read the saved settings and statistics once; check them, the data may be old.
  useEffect(() => {
    loadJson<Partial<Saved>>(STORAGE_KEY).then((saved) => {
      if (saved) {
        const index = (n: unknown, max: number) =>
          typeof n === 'number' && n >= 0 && n <= max ? n : 0;
        setLevelIndex(index(saved.levelIndex, CUSTOM));
        setDirectionIndex(index(saved.directionIndex, DIRECTIONS.length - 1));
        const picked = Array.isArray(saved.custom)
          ? saved.custom.filter((n) => INTERVALS.some((i) => i.semitones === n))
          : [];
        if (picked.length >= 2) setCustom(picked);
        const cleaned: Record<string, PracticeStats> = {};
        Object.entries(saved.stats ?? {}).forEach(
          ([key, value]) => (cleaned[key] = cleanStats(value)),
        );
        setStats(cleaned);
      }
      setLoaded(true);
    });
  }, []);

  // Save whenever something changes (but not before the saved data has been read).
  useEffect(() => {
    if (loaded)
      saveJson(STORAGE_KEY, { levelIndex, directionIndex, custom, stats } satisfies Saved);
  }, [loaded, levelIndex, directionIndex, custom, stats]);

  const isCustom = levelIndex === CUSTOM;
  const intervals = isCustom
    ? [...custom].sort((a, b) => a - b)
    : INTERVAL_LEVELS[levelIndex].intervals;
  const statsKey = isCustom ? 'custom' : `level${levelIndex + 1}`;
  const levelStats = stats[statsKey] ?? EMPTY_STATS;
  const levelName = isCustom ? 'Custom' : INTERVAL_LEVELS[levelIndex].name;
  const direction = DIRECTIONS[directionIndex].id;

  function reset() {
    setQuestion(null);
    setAnswer(null);
    setScore({ right: 0, total: 0, streak: 0 });
  }

  function chooseLevel(i: number) {
    setLevelIndex(i);
    reset();
  }

  /** Custom mode: turn an interval on or off; at least two stay on. */
  function toggleCustom(semitones: number) {
    if (custom.includes(semitones)) {
      if (custom.length > 2) setCustom(custom.filter((s) => s !== semitones));
    } else {
      setCustom([...custom, semitones]);
    }
    reset();
  }

  function next() {
    const q = makeQuestion(intervals, direction, question ?? undefined);
    setQuestion(q);
    setAnswer(null);
    play(q); // straight from the tap, so a phone browser allows the sound
  }

  function choose(semitones: number) {
    if (!question || answer !== null) return;
    setAnswer(semitones);
    const right = semitones === question.semitones;
    setScore((s) => ({
      right: s.right + (right ? 1 : 0),
      total: s.total + 1,
      streak: right ? s.streak + 1 : 0,
    }));
    setStats((all) => ({ ...all, [statsKey]: recordAnswer(all[statsKey] ?? EMPTY_STATS, right) }));
  }

  const answered = question !== null && answer !== null;
  const correct = answered && answer === question.semitones;
  const info = question ? intervalInfo(question.semitones) : undefined;
  const song =
    info && (question?.direction === 'down' ? (info.songDown ?? info.songUp) : info.songUp);
  const percent = score.total ? Math.round((score.right / score.total) * 100) : 0;
  const allTimePercent = levelStats.total
    ? Math.round((levelStats.right / levelStats.total) * 100)
    : 0;
  const showNextLevel = !isCustom && levelIndex < CUSTOM - 1 && readyForNext(levelStats);
  // Where the interval is on your instrument, shown after you answer.
  const shape = answered ? intervalShape(question.low, question.high, tuning.strings) : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.scoreRow}>
        <Text style={styles.score}>
          {score.right} / {score.total}
          {score.total > 0 && <Text style={styles.scoreSub}> {percent}%</Text>}
        </Text>
        <Text style={styles.scoreSub}>Streak {score.streak}</Text>
      </View>

      <Text style={styles.sectionLabel}>Level</Text>
      <ChipRow
        options={[...INTERVAL_LEVELS.map((l) => l.name), 'Custom']}
        selected={levelIndex}
        onSelect={chooseLevel}
      />
      {isCustom ? (
        <View style={styles.customGrid}>
          {INTERVALS.map((i) => {
            const on = custom.includes(i.semitones);
            return (
              <Pressable
                key={i.semitones}
                onPress={() => toggleCustom(i.semitones)}
                style={[styles.customChip, on && styles.customOn]}
                accessibilityLabel={`${i.name} ${on ? 'on' : 'off'}`}
              >
                <Text style={[styles.customText, on && styles.customTextOn]}>{i.short}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.hint}>{intervals.map((s) => intervalInfo(s).short).join('  ')}</Text>
      )}
      {levelStats.total > 0 && (
        <Text style={styles.hint}>
          All time on {levelName}: {allTimePercent}% right of {levelStats.total}
        </Text>
      )}
      {showNextLevel && (
        <Pressable
          onPress={() => chooseLevel(levelIndex + 1)}
          style={({ pressed }) => [styles.nextLevel, pressed && styles.pressed]}
        >
          <Ionicons name="trophy-outline" size={20} color={colors.onBrand} />
          <Text style={styles.nextLevelText}>
            17+ of your last 20 right. Try {INTERVAL_LEVELS[levelIndex + 1].name}!
          </Text>
        </Pressable>
      )}

      <Text style={styles.sectionLabel}>Direction</Text>
      <ChipRow
        options={DIRECTIONS.map((d) => d.label)}
        selected={directionIndex}
        onSelect={(i) => {
          setDirectionIndex(i);
          reset();
        }}
      />

      <View style={styles.stage}>
        {!question ? (
          <Text style={styles.prompt}>Press Start and listen to two notes.</Text>
        ) : !answered ? (
          <Text style={styles.prompt}>
            Which interval? <Text style={styles.dir}>({question.direction})</Text>
          </Text>
        ) : (
          <View style={styles.feedback}>
            <Text style={[styles.verdict, { color: correct ? RIGHT : WRONG }]}>
              {correct ? '✓ ' : '✗ '}
              {info!.name}
            </Text>
            {!correct && <Text style={styles.hint}>You chose {intervalInfo(answer!).name}.</Text>}
            {song && <Text style={styles.hint}>Remember it: “{song}”</Text>}
          </View>
        )}
        {shape && (
          <View style={styles.neck}>
            <Text style={styles.hint}>
              On your {instrument.name.toLowerCase()}
              {shape.octaves !== 0 &&
                ` (${Math.abs(shape.octaves)} octave${Math.abs(shape.octaves) > 1 ? 's' : ''} ${shape.octaves < 0 ? 'lower' : 'higher'})`}
              : R = root, {info!.short} = the other note
            </Text>
            <MiniNeck
              strings={tuning.strings}
              stringNames={tuning.strings.map((m) => noteName(m, tuning.flats))}
              notes={[
                { position: shape.low, label: 'R', active: true },
                { position: shape.high, label: info!.short, active: false },
              ]}
            />
          </View>
        )}
        <View style={styles.buttons}>
          {question && (
            <Pressable
              onPress={() => play(question)}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
              accessibilityLabel="Play again"
            >
              <Ionicons name="repeat" size={20} color={colors.text} />
              <Text style={styles.secondaryText}>Again</Text>
            </Pressable>
          )}
          {(!question || answered) && (
            <Pressable
              onPress={next}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
              accessibilityLabel={question ? 'Next interval' : 'Start'}
            >
              <Ionicons
                name={question ? 'play-forward' : 'play'}
                size={20}
                color={colors.onBrand}
              />
              <Text style={styles.primaryText}>{question ? 'Next' : 'Start'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.grid}>
        {intervals.map((s) => {
          const i = intervalInfo(s);
          const isAnswer = answered && s === question!.semitones;
          const isWrongPick = answered && s === answer && !correct;
          return (
            <Pressable
              key={s}
              disabled={!question || answered}
              onPress={() => choose(s)}
              style={({ pressed }) => [
                styles.choice,
                isAnswer && { backgroundColor: RIGHT },
                isWrongPick && { backgroundColor: WRONG },
                pressed && styles.pressed,
                !question && styles.idle,
              ]}
              accessibilityLabel={i.name}
            >
              <Text style={[styles.choiceShort, (isAnswer || isWrongPick) && styles.onColor]}>
                {i.short}
              </Text>
              <Text style={[styles.choiceName, (isAnswer || isWrongPick) && styles.onColor]}>
                {i.name}
              </Text>
            </Pressable>
          );
        })}
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
    scoreRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    score: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
    },
    scoreSub: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '600',
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: -6,
    },
    hint: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    stage: {
      gap: 14,
      padding: 16,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    prompt: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    dir: {
      color: colors.textMuted,
      fontWeight: '600',
    },
    feedback: {
      alignItems: 'center',
      gap: 4,
    },
    verdict: {
      fontSize: 22,
      fontWeight: '800',
    },
    buttons: {
      flexDirection: 'row',
      gap: 10,
    },
    primary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 12,
      backgroundColor: colors.brand,
    },
    primaryText: {
      color: colors.onBrand,
      fontSize: 16,
      fontWeight: '700',
    },
    secondary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 18,
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
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    choice: {
      width: '31.8%',
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    customGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    customChip: {
      width: '15%',
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    customOn: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    customText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    customTextOn: {
      color: colors.onAccent,
    },
    nextLevel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.brand,
    },
    nextLevelText: {
      flex: 1,
      color: colors.onBrand,
      fontSize: 14,
      fontWeight: '700',
    },
    neck: {
      alignSelf: 'stretch',
      gap: 6,
    },
    idle: {
      opacity: 0.5,
    },
    choiceShort: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    choiceName: {
      color: colors.textMuted,
      fontSize: 11,
    },
    onColor: {
      color: '#fff',
    },
  });
}
