import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useIntervalPlayer } from '../audio/useIntervalPlayer';
import ChipRow from '../components/ChipRow';
import {
  DIRECTIONS,
  INTERVAL_LEVELS,
  intervalInfo,
  makeQuestion,
  type IntervalQuestion,
} from '../music/intervals';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const RIGHT = '#2e9d57';
const WRONG = '#d93a3a';

// Interval ear training: two notes play, you pick the interval between them.
export default function IntervalsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { play } = useIntervalPlayer();

  const [levelIndex, setLevelIndex] = useState(0);
  const [directionIndex, setDirectionIndex] = useState(0);
  const [question, setQuestion] = useState<IntervalQuestion | null>(null);
  const [answer, setAnswer] = useState<number | null>(null); // the chosen interval
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });

  const level = INTERVAL_LEVELS[levelIndex];
  const direction = DIRECTIONS[directionIndex].id;

  function reset() {
    setQuestion(null);
    setAnswer(null);
    setScore({ right: 0, total: 0, streak: 0 });
  }

  function next() {
    const q = makeQuestion(level.intervals, direction, question ?? undefined);
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
  }

  const answered = question !== null && answer !== null;
  const correct = answered && answer === question.semitones;
  const info = question ? intervalInfo(question.semitones) : undefined;
  const song =
    info && (question?.direction === 'down' ? (info.songDown ?? info.songUp) : info.songUp);
  const percent = score.total ? Math.round((score.right / score.total) * 100) : 0;

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
        options={INTERVAL_LEVELS.map((l) => l.name)}
        selected={levelIndex}
        onSelect={(i) => {
          setLevelIndex(i);
          reset();
        }}
      />
      <Text style={styles.hint}>
        {level.intervals.map((s) => intervalInfo(s).short).join('  ')}
      </Text>

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
        {level.intervals.map((s) => {
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
