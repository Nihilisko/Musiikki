import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useNotePlayer } from '../audio/useNotePlayer';
import ChipRow from '../components/ChipRow';
import MiniNeck from '../components/MiniNeck';
import {
  AnswerGrid,
  LevelPicker,
  PlayButtons,
  RIGHT,
  ScoreHeader,
  WRONG,
  type PracticeItem,
} from '../components/practice/PracticeParts';
import { intervalShape } from '../music/intervalShape';
import {
  DIRECTIONS,
  INTERVAL_LEVELS,
  INTERVALS,
  intervalInfo,
  makeQuestion,
  questionNotes,
  type IntervalQuestion,
} from '../music/intervals';
import { noteName } from '../music/notes';
import { useInstrument } from '../state/InstrumentContext';
import { usePracticeProgress } from '../state/usePracticeProgress';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

const ALL_ITEMS: PracticeItem[] = INTERVALS.map((i) => ({
  id: i.semitones,
  short: i.short,
  name: i.name,
}));
const item = (semitones: number) => ALL_ITEMS.find((i) => i.id === semitones)!;

// Interval ear training: two notes play, you pick the interval between them.
export default function IntervalsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { play } = useNotePlayer();
  const { instrument, tuning } = useInstrument();
  const progress = usePracticeProgress({
    storageKey: 'ear-intervals',
    levelCount: INTERVAL_LEVELS.length,
    modeCount: DIRECTIONS.length,
    defaultCustom: [3, 4, 7],
    isValidItem: (n) => INTERVALS.some((i) => i.semitones === n),
  });

  const [question, setQuestion] = useState<IntervalQuestion | null>(null);
  const [answer, setAnswer] = useState<number | null>(null); // the chosen interval
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });

  const intervals = progress.isCustom
    ? [...progress.custom].sort((a, b) => a - b)
    : INTERVAL_LEVELS[progress.levelIndex].intervals;
  const direction = DIRECTIONS[progress.modeIndex].id;

  function reset() {
    setQuestion(null);
    setAnswer(null);
    setScore({ right: 0, total: 0, streak: 0 });
  }

  function playQuestion(q: IntervalQuestion) {
    const { notes, gapMs } = questionNotes(q);
    play(notes, gapMs);
  }

  function next() {
    const q = makeQuestion(intervals, direction, question ?? undefined);
    setQuestion(q);
    setAnswer(null);
    playQuestion(q); // straight from the tap, so a phone browser allows the sound
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
    progress.record(right);
  }

  const answered = question !== null && answer !== null;
  const correct = answered && answer === question.semitones;
  const info = question ? intervalInfo(question.semitones) : undefined;
  const song =
    info && (question?.direction === 'down' ? (info.songDown ?? info.songUp) : info.songUp);
  // Where the interval is on your instrument, shown after you answer.
  const shape = answered ? intervalShape(question.low, question.high, tuning.strings) : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScoreHeader {...score} />

      <LevelPicker
        levelNames={INTERVAL_LEVELS.map((l) => l.name)}
        levelIndex={progress.levelIndex}
        onSelect={(i) => {
          progress.setLevelIndex(i);
          reset();
        }}
        allItems={ALL_ITEMS}
        items={intervals.map(item)}
        isCustom={progress.isCustom}
        custom={progress.custom}
        onToggleCustom={(id) => {
          progress.toggleCustom(id);
          reset();
        }}
        stats={progress.levelStats}
      />

      <Text style={styles.sectionLabel}>Direction</Text>
      <ChipRow
        options={DIRECTIONS.map((d) => d.label)}
        selected={progress.modeIndex}
        onSelect={(i) => {
          progress.setModeIndex(i);
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
        <PlayButtons
          started={question !== null}
          answered={answered}
          onAgain={() => question && playQuestion(question)}
          onNext={next}
        />
      </View>

      <AnswerGrid
        items={intervals.map(item)}
        idle={question === null}
        answered={answered}
        rightId={question?.semitones}
        chosenId={answer ?? undefined}
        onChoose={choose}
      />
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 14,
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
    neck: {
      alignSelf: 'stretch',
      gap: 6,
    },
  });
}
