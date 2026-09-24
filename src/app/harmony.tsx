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
  GUESSED_CHORDS,
  KEY_CHORDS,
  makeProgressionQuestion,
  numeral,
  PROGRESSION_LEVELS,
  PROGRESSION_MODES,
  progressionNotes,
  type KeyMode,
  type ProgressionQuestion,
} from '../music/progressionQuiz';
import { pitchClass, SCALES } from '../music/scales';
import { spellScale } from '../music/spelling';
import { usePracticeProgress } from '../state/usePracticeProgress';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const DEGREE_NAMES = [
  'tonic',
  'supertonic',
  'mediant',
  'subdominant',
  'dominant',
  'submediant',
  'leading',
];
/** Answer buttons for a key mode: the chords of degrees 1-7. */
const itemsFor = (mode: KeyMode): PracticeItem[] =>
  KEY_CHORDS[mode].map((c, i) => ({ id: i + 1, short: c.numeral, name: DEGREE_NAMES[i] }));

/** Time from one chord to the next. */
const CHORD_MS = 1100;

// Harmony ear training: a four-chord progression plays, you name chords 2-4 by degree.
export default function HarmonyScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { playSteps } = useNotePlayer();
  const progress = usePracticeProgress({
    storageKey: 'ear-harmony',
    levelCount: PROGRESSION_LEVELS.length,
    modeCount: PROGRESSION_MODES.length,
    defaultCustom: [1, 4, 5, 6],
    isValidItem: (d) => Number.isInteger(d) && d >= 1 && d <= 7,
  });

  const [question, setQuestion] = useState<ProgressionQuestion | null>(null);
  const [guesses, setGuesses] = useState<number[]>([]); // degrees chosen for chords 2-4
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });

  const mode = PROGRESSION_MODES[progress.modeIndex].id;
  const degrees = progress.isCustom
    ? [...new Set([1, ...progress.custom])].sort((a, b) => a - b)
    : PROGRESSION_LEVELS[progress.levelIndex].degrees;
  // The buttons follow the key of the question (in Mixed, it changes from question to question).
  const shownMode: KeyMode = question?.mode ?? (mode === 'minor' ? 'minor' : 'major');
  const items = itemsFor(shownMode);
  const answerItems = degrees.map((d) => items[d - 1]);

  function reset() {
    setQuestion(null);
    setGuesses([]);
    setScore({ right: 0, total: 0, streak: 0 });
  }

  function playQuestion(q: ProgressionQuestion) {
    const steps: NoteStep[] = progressionNotes(q).map((c, i) => ({
      notes: c.piano,
      bass: [c.bass],
      at: i * CHORD_MS,
      damp: i > 0,
    }));
    playSteps(steps);
  }

  function next() {
    const q = makeProgressionQuestion(degrees, mode);
    setQuestion(q);
    setGuesses([]);
    playQuestion(q); // straight from the tap, so a phone browser allows the sound
  }

  function choose(degree: number) {
    if (!question || guesses.length >= GUESSED_CHORDS) return;
    const filled = [...guesses, degree];
    setGuesses(filled);
    if (filled.length < GUESSED_CHORDS) return;
    // All three chosen: score each chord on its own.
    let streak = score.streak;
    let right = 0;
    filled.forEach((g, i) => {
      const ok = g === question.degrees[i + 1];
      progress.record(ok);
      if (ok) right += 1;
      streak = ok ? streak + 1 : 0;
    });
    setScore((s) => ({ right: s.right + right, total: s.total + GUESSED_CHORDS, streak }));
  }

  const done = question !== null && guesses.length === GUESSED_CHORDS;

  // After answering: the chord names in this key, e.g. "C – Am – F – G".
  let chordNames: string[] = [];
  if (question && done) {
    const scale = SCALES.find(
      (s) => s.name === (question.mode === 'major' ? 'Major (Ionian)' : 'Minor (Aeolian)'),
    )!;
    const names = spellScale(question.tonic, scale).names;
    chordNames = question.degrees.map((d) => {
      const c = KEY_CHORDS[question.mode][d - 1];
      const root = names[pitchClass(question.tonic + c.semitones)] ?? '';
      const kind = c.fifth === 6 ? '°' : c.third === 3 ? 'm' : '';
      return root + kind;
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScoreHeader {...score} />

      <LevelPicker
        levelNames={PROGRESSION_LEVELS.map((l) => l.name)}
        levelIndex={progress.levelIndex}
        onSelect={(i) => {
          progress.setLevelIndex(i);
          reset();
        }}
        allItems={items.slice(1)} // the home chord is always in
        items={answerItems}
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
        options={PROGRESSION_MODES.map((m) => m.label)}
        selected={progress.modeIndex}
        onSelect={(i) => {
          progress.setModeIndex(i);
          reset();
        }}
      />

      <View style={styles.stage}>
        <Text style={styles.prompt}>
          {!question
            ? 'Press Start: four chords play. The first is always the home chord.'
            : done
              ? chordNames.join(' – ')
              : `Name chords 2–4 (${question.mode})`}
        </Text>

        {question && (
          <View style={styles.slots}>
            {question.degrees.map((d, i) => {
              const guess = i === 0 ? d : guesses[i - 1];
              const ok = done && guess === d;
              return (
                <View
                  key={i}
                  style={[
                    styles.slot,
                    i === guesses.length + 1 && !done && styles.slotNext,
                    done && i > 0 && { backgroundColor: ok ? RIGHT : WRONG },
                  ]}
                >
                  <Text style={[styles.slotText, done && i > 0 && styles.onColor]}>
                    {guess !== undefined ? numeral(question.mode, guess) : '?'}
                  </Text>
                  {done && i > 0 && !ok && (
                    <Text style={styles.slotFix}>{numeral(question.mode, d)}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {question && guesses.length > 0 && !done && (
          <Pressable
            onPress={() => setGuesses(guesses.slice(0, -1))}
            style={({ pressed }) => [styles.undo, pressed && { opacity: 0.7 }]}
            accessibilityLabel="Undo last choice"
          >
            <Ionicons name="arrow-undo" size={16} color={colors.accentText} />
            <Text style={styles.undoText}>Undo</Text>
          </Pressable>
        )}

        <PlayButtons
          started={question !== null}
          answered={done}
          onAgain={() => question && playQuestion(question)}
          onNext={next}
        />
      </View>

      <AnswerGrid items={answerItems} idle={question === null} answered={done} onChoose={choose} />
      <Text style={styles.hint}>
        Tip: listen to the bass. It plays each chord's root, so it walks the same steps as the
        degrees.
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
    slots: {
      flexDirection: 'row',
      gap: 8,
    },
    slot: {
      width: 64,
      height: 64,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    slotNext: {
      borderColor: colors.brand,
    },
    slotText: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    slotFix: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    onColor: {
      color: '#fff',
      textDecorationLine: 'none',
    },
    undo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    undoText: {
      color: colors.accentText,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
