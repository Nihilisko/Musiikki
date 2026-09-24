import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import BackButton from '../components/BackButton';
import Dropdown from '../components/Dropdown';
import type { CellMark } from '../components/Fretboard';
import FretboardStage from '../components/FretboardStage';
import {
  areaCells,
  makeNeckTask,
  NECK_LEVELS,
  targetCells,
  type NeckTask,
} from '../music/neckGame';
import { cellKey } from '../music/positions';
import { useInstrument } from '../state/InstrumentContext';
import { useLandscape } from '../state/orientation';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

// The neck game: a task like "Tap every E" and you tap the places on your own instrument.
export default function NeckGameScreen() {
  useLandscape();
  const styles = useThemedStyles(makeStyles);
  const { instrument, tuning } = useInstrument();

  const [level, setLevel] = useState(0);
  const [task, setTask] = useState<NeckTask>(() => makeNeckTask(0));
  const [found, setFound] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState({ tasks: 0, perfect: 0 });

  const targets = targetCells(task, tuning.strings);
  const area = areaCells(task, tuning.strings, instrument.frets);
  const done = revealed || found.size === targets.size;
  const wholeNeck = task.fromFret === 0 && task.toFret >= 12;

  function newTask(levelIndex = level) {
    let next = makeNeckTask(levelIndex);
    if (next.prompt === task.prompt) next = makeNeckTask(levelIndex); // not the same twice
    setTask(next);
    setFound(new Set());
    setWrong(new Set());
    setRevealed(false);
  }

  function finish(perfect: boolean) {
    setSession((s) => ({ tasks: s.tasks + 1, perfect: s.perfect + (perfect ? 1 : 0) }));
  }

  function tap(string: number, fret: number) {
    if (done) return;
    const key = cellKey(string, fret);
    if (!area.has(key) || found.has(key) || wrong.has(key)) return; // outside the task's frets
    if (targets.has(key)) {
      const next = new Set(found).add(key);
      setFound(next);
      if (next.size === targets.size) finish(wrong.size === 0);
    } else {
      setWrong(new Set(wrong).add(key));
    }
  }

  function reveal() {
    if (done) return;
    setRevealed(true);
    finish(false);
  }

  // What the neck shows: found notes green, wrong taps red, and (at the end) missed ones ringed.
  const marks = new Map<string, CellMark>();
  found.forEach((k) => marks.set(k, 'right'));
  wrong.forEach((k) => marks.set(k, 'wrong'));
  if (revealed) targets.forEach((k) => !found.has(k) && marks.set(k, 'missed'));

  return (
    <FretboardStage
      back={<BackButton label="Menu" />}
      controls={
        <Dropdown
          label={`${NECK_LEVELS[level].name} · ${NECK_LEVELS[level].hint}`}
          options={NECK_LEVELS.map((l) => `${l.name} · ${l.hint}`)}
          selected={level}
          onSelect={(i) => {
            setLevel(i);
            newTask(i);
          }}
        />
      }
      fretboard={{
        noteNames: task.names,
        onCellPress: tap,
        cellMarks: marks,
        focusCells: wholeNeck ? undefined : area,
      }}
      status={
        <Text style={styles.prompt}>
          {done ? task.answer : task.prompt}
          <Text style={styles.count}>
            {'   '}
            {found.size} / {targets.size} found
            {wrong.size > 0 && ` · ${wrong.size} miss${wrong.size > 1 ? 'es' : ''}`}
          </Text>
        </Text>
      }
      footer={
        <View style={styles.footer}>
          <Text style={styles.session}>
            {wholeNeck ? 'Frets 0–12' : `Only frets ${task.fromFret}–${task.toFret} count`}
            {session.tasks > 0 && ` · ${session.perfect} of ${session.tasks} without a miss`}
          </Text>
          {!done && (
            <Pressable
              onPress={reveal}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>Show answer</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => newTask()}
            style={({ pressed }) => [
              done ? styles.primary : styles.secondary,
              pressed && styles.pressed,
            ]}
          >
            <Text style={done ? styles.primaryText : styles.secondaryText}>
              {done ? 'Next' : 'Skip'}
            </Text>
          </Pressable>
        </View>
      }
    />
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    prompt: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
    },
    count: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    session: {
      color: colors.textMuted,
      fontSize: 13,
      marginRight: 8,
    },
    primary: {
      paddingVertical: 10,
      paddingHorizontal: 22,
      borderRadius: 10,
      backgroundColor: colors.brand,
    },
    primaryText: {
      color: colors.onBrand,
      fontSize: 15,
      fontWeight: '700',
    },
    secondary: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
