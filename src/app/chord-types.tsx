import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useNotePlayer } from '../audio/useNotePlayer';
import ChipRow from '../components/ChipRow';
import ChordDiagram from '../components/ChordDiagram';
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
  BROKEN_GAP_MS,
  CHORD_LEVELS,
  chordShort,
  DEFAULT_CUSTOM,
  makeChordQuestion,
  PLAY_STYLES,
  QUIZ_CHORD_TYPES,
  type ChordQuestion,
} from '../music/chordQuiz';
import { CHORD_TYPES } from '../music/chords';
import { pitchClass } from '../music/scales';
import { spellChord } from '../music/spelling';
import { chordVoicings } from '../music/voicings';
import { useInstrument } from '../state/InstrumentContext';
import { useNoteColors } from '../state/NoteColorContext';
import { usePracticeProgress } from '../state/usePracticeProgress';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const ALL_ITEMS: PracticeItem[] = QUIZ_CHORD_TYPES.map((t) => ({
  id: t,
  short: chordShort(t),
  name: CHORD_TYPES[t].name,
}));
const item = (type: number) => ALL_ITEMS.find((i) => i.id === type)!;
const DIAGRAM_WIDTH = 150;

// Chord type ear training: a chord plays, you tell what kind of chord it is.
export default function ChordTypesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { play } = useNotePlayer();
  const { instrument, tuning } = useInstrument();
  const { noteColors } = useNoteColors();
  const progress = usePracticeProgress({
    storageKey: 'ear-chord-types',
    levelCount: CHORD_LEVELS.length,
    modeCount: PLAY_STYLES.length,
    defaultCustom: DEFAULT_CUSTOM,
    isValidItem: (t) => QUIZ_CHORD_TYPES.includes(t),
  });

  const [question, setQuestion] = useState<ChordQuestion | null>(null);
  const [answer, setAnswer] = useState<number | null>(null); // the chosen chord type
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });

  const types = progress.isCustom
    ? QUIZ_CHORD_TYPES.filter((t) => progress.custom.includes(t)) // in the usual order
    : CHORD_LEVELS[progress.levelIndex].types;
  const style = PLAY_STYLES[progress.modeIndex].id;

  function reset() {
    setQuestion(null);
    setAnswer(null);
    setScore({ right: 0, total: 0, streak: 0 });
  }

  function playQuestion(q: ChordQuestion) {
    play(q.notes, q.style === 'broken' ? BROKEN_GAP_MS : 0);
  }

  function next() {
    const q = makeChordQuestion(types, style, question ?? undefined);
    setQuestion(q);
    setAnswer(null);
    playQuestion(q); // straight from the tap, so a phone browser allows the sound
  }

  function choose(type: number) {
    if (!question || answer !== null) return;
    setAnswer(type);
    const right = type === question.type;
    setScore((s) => ({
      right: s.right + (right ? 1 : 0),
      total: s.total + 1,
      streak: right ? s.streak + 1 : 0,
    }));
    progress.record(right);
  }

  const answered = question !== null && answer !== null;
  const correct = answered && answer === question.type;

  // After answering: the chord's name, notes and degrees, and a shape on your instrument.
  let reveal: { name: string; notes: string; degrees: string } | null = null;
  let diagram: { frets: number[]; root: number; labels: (string | undefined)[] } | null = null;
  if (answered) {
    const chord = CHORD_TYPES[question.type];
    const root = pitchClass(question.notes[0]);
    const spelled = spellChord(root, chord);
    const pcs = chord.tones.map((t) => pitchClass(root + t.interval));
    reveal = {
      name: `${spelled.rootName}${chord.symbol}`,
      notes: pcs.map((pc) => spelled.names[pc]).join(' '),
      degrees: chord.tones.map((t) => t.degree).join(' '),
    };
    const voicing = chordVoicings(tuning.strings, root, chord, { limit: 1 })[0];
    if (voicing) {
      const labels: (string | undefined)[] = new Array(12).fill(undefined);
      chord.tones.forEach((t, i) => (labels[pcs[i]] = t.degree));
      diagram = { frets: voicing.frets, root, labels };
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScoreHeader {...score} />

      <LevelPicker
        levelNames={CHORD_LEVELS.map((l) => l.name)}
        levelIndex={progress.levelIndex}
        onSelect={(i) => {
          progress.setLevelIndex(i);
          reset();
        }}
        allItems={ALL_ITEMS}
        items={types.map(item)}
        isCustom={progress.isCustom}
        custom={progress.custom}
        onToggleCustom={(id) => {
          progress.toggleCustom(id);
          reset();
        }}
        stats={progress.levelStats}
      />

      <Text style={styles.sectionLabel}>Play</Text>
      <ChipRow
        options={PLAY_STYLES.map((s) => s.label)}
        selected={progress.modeIndex}
        onSelect={(i) => {
          progress.setModeIndex(i);
          reset();
        }}
      />

      <View style={styles.stage}>
        {!question ? (
          <Text style={styles.prompt}>Press Start and listen to a chord.</Text>
        ) : !answered ? (
          <Text style={styles.prompt}>What kind of chord?</Text>
        ) : (
          <View style={styles.feedback}>
            <Text style={[styles.verdict, { color: correct ? RIGHT : WRONG }]}>
              {correct ? '✓ ' : '✗ '}
              {CHORD_TYPES[question.type].name}
            </Text>
            {!correct && <Text style={styles.hint}>You chose {CHORD_TYPES[answer!].name}.</Text>}
            <Text style={styles.hint}>
              {reveal!.name}: {reveal!.notes} ({reveal!.degrees})
            </Text>
          </View>
        )}
        {diagram && (
          <View style={styles.diagram}>
            <Text style={styles.hint}>On your {instrument.name.toLowerCase()}</Text>
            <ChordDiagram
              strings={tuning.strings}
              frets={diagram.frets}
              root={diagram.root}
              labels={diagram.labels}
              noteColors={noteColors}
              lineColor={colors.textMuted}
              textColor={colors.text}
              width={DIAGRAM_WIDTH}
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
        items={types.map(item)}
        idle={question === null}
        answered={answered}
        rightId={question?.type}
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
    feedback: {
      alignItems: 'center',
      gap: 4,
    },
    verdict: {
      fontSize: 22,
      fontWeight: '800',
    },
    diagram: {
      alignItems: 'center',
      gap: 4,
    },
  });
}
