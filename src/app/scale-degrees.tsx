import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useNotePlayer, type NoteStep } from '../audio/useNotePlayer';
import ChipRow from '../components/ChipRow';
import {
  AnswerGrid,
  LevelPicker,
  PlayButtons,
  RIGHT,
  ScoreHeader,
  WRONG,
  type PracticeItem,
} from '../components/practice/PracticeParts';
import {
  answerSemitones,
  cadence,
  DEGREE_LEVELS,
  DEGREES,
  KEY_MODES,
  levelSemitones,
  makeDegreeQuestion,
  type DegreeQuestion,
} from '../music/degreeQuiz';
import { noteName } from '../music/notes';
import { pitchClass, SCALES } from '../music/scales';
import { spellScale } from '../music/spelling';
import { usePracticeProgress } from '../state/usePracticeProgress';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const ALL_ITEMS: PracticeItem[] = DEGREES.map((d) => ({
  id: d.semitones,
  short: d.short,
  name: d.solfege,
}));
const item = (semitones: number) => ALL_ITEMS[semitones];

/** Timing: the four chords of the cadence, then a pause, then the note. */
const CHORD_MS = 650;
const NOTE_AFTER_MS = 1000;

// Scale degree ear training: hear the key, then name the degree of one note.
export default function ScaleDegreesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { play, playSteps } = useNotePlayer();
  const progress = usePracticeProgress({
    storageKey: 'ear-scale-degrees',
    levelCount: DEGREE_LEVELS.length,
    modeCount: KEY_MODES.length,
    defaultCustom: [0, 4, 7, 11],
    isValidItem: (s) => Number.isInteger(s) && s >= 0 && s < 12,
  });

  const [question, setQuestion] = useState<DegreeQuestion | null>(null);
  const [answer, setAnswer] = useState<number | null>(null); // the chosen degree
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });

  const mode = KEY_MODES[progress.modeIndex].id;
  const custom = [...progress.custom].sort((a, b) => a - b);
  const answers = progress.isCustom ? custom : answerSemitones(progress.levelIndex, mode);

  function reset() {
    setQuestion(null);
    setAnswer(null);
    setScore({ right: 0, total: 0, streak: 0 });
  }

  function playQuestion(q: DegreeQuestion) {
    const chords = cadence(q.tonic, q.mode);
    const steps: NoteStep[] = chords.map((notes, i) => ({ notes, at: i * CHORD_MS }));
    steps.push({ notes: [q.note], at: (chords.length - 1) * CHORD_MS + NOTE_AFTER_MS });
    playSteps(steps);
  }

  function next() {
    const pool = (m: 'major' | 'minor') =>
      progress.isCustom ? custom : levelSemitones(progress.levelIndex, m);
    const q = makeDegreeQuestion(pool, mode, question ?? undefined);
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

  // After answering: which note it was in this key, e.g. "In E minor the ♭3 is G".
  let reveal = '';
  if (question && answered) {
    const scale = SCALES.find(
      (s) => s.name === (question.mode === 'major' ? 'Major (Ionian)' : 'Minor (Aeolian)'),
    )!;
    const names = spellScale(pitchClass(question.tonic), scale).names;
    const tonicName = names[pitchClass(question.tonic)]!;
    const noteLabel = names[pitchClass(question.note)] ?? noteName(question.note);
    reveal = `In ${tonicName} ${question.mode} the ${DEGREES[question.semitones].short} is ${noteLabel}.`;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScoreHeader {...score} />

      <LevelPicker
        levelNames={DEGREE_LEVELS.map((l) => l.name)}
        levelIndex={progress.levelIndex}
        onSelect={(i) => {
          progress.setLevelIndex(i);
          reset();
        }}
        allItems={ALL_ITEMS}
        items={answers.map(item)}
        isCustom={progress.isCustom}
        custom={progress.custom}
        onToggleCustom={(id) => {
          progress.toggleCustom(id);
          reset();
        }}
        stats={progress.levelStats}
      />

      <Text style={styles.sectionLabel}>Key</Text>
      <ChipRow
        options={KEY_MODES.map((m) => m.label)}
        selected={progress.modeIndex}
        onSelect={(i) => {
          progress.setModeIndex(i);
          reset();
        }}
      />

      <View style={styles.stage}>
        {!question ? (
          <Text style={styles.prompt}>
            Press Start: four chords set the key, then one note plays.
          </Text>
        ) : !answered ? (
          <Text style={styles.prompt}>
            Which degree? <Text style={styles.dir}>({question.mode})</Text>
          </Text>
        ) : (
          <View style={styles.feedback}>
            <Text style={[styles.verdict, { color: correct ? RIGHT : WRONG }]}>
              {correct ? '✓ ' : '✗ '}
              {DEGREES[question.semitones].short} ({DEGREES[question.semitones].solfege})
            </Text>
            {!correct && (
              <Text style={styles.hint}>
                You chose {DEGREES[answer!].short} ({DEGREES[answer!].solfege}).
              </Text>
            )}
            <Text style={styles.hint}>{reveal}</Text>
          </View>
        )}
        {question && (
          <Pressable
            onPress={() => play([question.note], 0)}
            style={({ pressed }) => [styles.noteOnly, pressed && { opacity: 0.7 }]}
            accessibilityLabel="Play the note only"
          >
            <Ionicons name="musical-note" size={16} color={colors.accentText} />
            <Text style={styles.noteOnlyText}>Note only</Text>
          </Pressable>
        )}
        <PlayButtons
          started={question !== null}
          answered={answered}
          onAgain={() => question && playQuestion(question)}
          onNext={next}
        />
      </View>

      <AnswerGrid
        items={answers.map(item)}
        idle={question === null}
        answered={answered}
        rightId={question?.semitones}
        chosenId={answer ?? undefined}
        onChoose={choose}
      />
      <Text style={styles.hint}>
        Tip: sing the note, then walk it down step by step to the home note (1). Count the steps.
      </Text>
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
      textAlign: 'center',
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
    noteOnly: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    noteOnlyText: {
      color: colors.accentText,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
