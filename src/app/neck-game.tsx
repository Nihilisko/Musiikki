import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import BackButton from '../components/BackButton';
import Dropdown from '../components/Dropdown';
import type { CellMark } from '../components/Fretboard';
import FretboardStage from '../components/FretboardStage';
import {
  clock,
  isRecord,
  isRunning,
  NEW_CHALLENGE,
  secondsLeft,
  startChallenge,
  type Challenge,
} from '../music/challenge';
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
import { loadJson, saveJson } from '../state/storage';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

const MODES = ['Practice', 'Challenge'];
const STORAGE_KEY = 'neck-game';
/** A finished task stays on screen this long in the challenge, so you see it turn green. */
const NEXT_TASK_MS = 400;

/** What is saved on the phone: the last level and the best challenge score of each level. */
type Saved = { level: number; bests: Record<string, number> };

// The neck game: a task like "Tap every E" and you tap the places on your own instrument.
// Practice goes at your own pace; the challenge counts how many tasks you finish in a minute.
export default function NeckGameScreen() {
  useLandscape();
  const styles = useThemedStyles(makeStyles);
  const { instrument, tuning } = useInstrument();

  const [level, setLevel] = useState(0);
  const [mode, setMode] = useState(0);
  const [task, setTask] = useState<NeckTask>(() => makeNeckTask(0));
  const [found, setFound] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState({ tasks: 0, perfect: 0 });
  const [challenge, setChallenge] = useState<Challenge>(NEW_CHALLENGE);
  const [now, setNow] = useState(Date.now());
  const [bests, setBests] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [recordMade, setRecordMade] = useState(false);
  const nextTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isChallenge = mode === 1;
  const running = isChallenge && isRunning(challenge);
  const targets = targetCells(task, tuning.strings);
  const area = areaCells(task, tuning.strings, instrument.frets);
  const done = revealed || found.size === targets.size;
  const wholeNeck = task.fromFret === 0 && task.toFret >= 12;
  const levelKey = `level${level + 1}`;
  const best = bests[levelKey];

  // Read the saved level and records once; check them, the data may be old.
  useEffect(() => {
    loadJson<Partial<Saved>>(STORAGE_KEY).then((saved) => {
      if (saved) {
        const l = saved.level;
        if (typeof l === 'number' && l >= 0 && l < NECK_LEVELS.length) {
          setLevel(l);
          setTask(makeNeckTask(l));
        }
        const clean: Record<string, number> = {};
        Object.entries(saved.bests ?? {}).forEach(([k, v]) => {
          if (typeof v === 'number' && v >= 0) clean[k] = v;
        });
        setBests(clean);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) saveJson(STORAGE_KEY, { level, bests } satisfies Saved);
  }, [loaded, level, bests]);

  // The clock: tick while the challenge runs, and end it when the minute is up.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setChallenge((c) => (isRunning(c) && secondsLeft(c, t) === 0 ? { ...c, finished: true } : c));
    }, 250);
    return () => clearInterval(timer);
  }, [running]);

  // When the minute ends, keep the score if it beats the record.
  useEffect(() => {
    if (!challenge.finished) return;
    const record = isRecord(challenge, bests[levelKey]);
    setRecordMade(record);
    if (record) setBests((b) => ({ ...b, [levelKey]: challenge.score }));
    // Only when a challenge finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.finished]);

  // Leaving the screen mid-task: don't let a pending "next task" fire afterwards.
  useEffect(() => () => clearTimeout(nextTimer.current), []);

  function newTask(levelIndex = level) {
    clearTimeout(nextTimer.current);
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
    if (done || (isChallenge && !running)) return;
    const key = cellKey(string, fret);
    if (!area.has(key) || found.has(key) || wrong.has(key)) return; // outside the task's frets
    if (targets.has(key)) {
      const next = new Set(found).add(key);
      setFound(next);
      if (next.size === targets.size) {
        finish(wrong.size === 0);
        if (running) {
          setChallenge((c) => ({ ...c, score: c.score + 1 }));
          nextTimer.current = setTimeout(() => newTask(), NEXT_TASK_MS);
        }
      }
    } else {
      setWrong(new Set(wrong).add(key));
      if (running) setChallenge((c) => ({ ...c, misses: c.misses + 1 }));
    }
  }

  function reveal() {
    if (done) return;
    setRevealed(true);
    finish(false);
  }

  function start() {
    const t = Date.now();
    setNow(t);
    setChallenge(startChallenge(t));
    newTask();
  }

  function chooseMode(i: number) {
    setMode(i);
    setChallenge(NEW_CHALLENGE);
    newTask();
  }

  // What the neck shows: found notes green, wrong taps red, and (at the end) missed ones ringed.
  const marks = new Map<string, CellMark>();
  found.forEach((k) => marks.set(k, 'right'));
  wrong.forEach((k) => marks.set(k, 'wrong'));
  if (revealed) targets.forEach((k) => !found.has(k) && marks.set(k, 'missed'));

  const newRecord = isChallenge && challenge.finished && recordMade;
  let prompt: string;
  if (isChallenge && challenge.finished) {
    prompt = `Time! ${challenge.score} task${challenge.score === 1 ? '' : 's'}${newRecord ? ' · New record!' : ''}`;
  } else if (isChallenge && !running) {
    prompt = `Finish as many tasks as you can in one minute${best ? ` · Record ${best}` : ''}`;
  } else {
    prompt = done ? task.answer : task.prompt;
  }

  return (
    <FretboardStage
      back={<BackButton label="Menu" />}
      controls={
        <>
          <Dropdown
            label={`${NECK_LEVELS[level].name} · ${NECK_LEVELS[level].hint}`}
            options={NECK_LEVELS.map((l) => `${l.name} · ${l.hint}`)}
            selected={level}
            onSelect={(i) => {
              setLevel(i);
              setChallenge(NEW_CHALLENGE);
              newTask(i);
            }}
          />
          <Dropdown label={MODES[mode]} options={MODES} selected={mode} onSelect={chooseMode} />
        </>
      }
      fretboard={{
        noteNames: task.names,
        onCellPress: tap,
        cellMarks: marks,
        focusCells: wholeNeck ? undefined : area,
      }}
      status={
        <Text style={styles.prompt}>
          {running && <Text style={styles.clock}>{clock(secondsLeft(challenge, now))} </Text>}
          {prompt}
          {(!isChallenge || running) && (
            <Text style={styles.count}>
              {'   '}
              {found.size} / {targets.size} found
              {wrong.size > 0 && ` · ${wrong.size} miss${wrong.size > 1 ? 'es' : ''}`}
            </Text>
          )}
        </Text>
      }
      footer={
        <View style={styles.footer}>
          <Text style={styles.session}>
            {isChallenge
              ? running || challenge.finished
                ? `Score ${challenge.score} · ${challenge.misses} miss${challenge.misses === 1 ? '' : 'es'}${best ? ` · Record ${best}` : ''}`
                : 'Skipping gives no point'
              : `${wholeNeck ? 'Frets 0–12' : `Only frets ${task.fromFret}–${task.toFret} count`}${
                  session.tasks > 0
                    ? ` · ${session.perfect} of ${session.tasks} without a miss`
                    : ''
                }`}
          </Text>
          {isChallenge && !running ? (
            <Pressable
              onPress={start}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            >
              <Text style={styles.primaryText}>{challenge.finished ? 'Play again' : 'Start'}</Text>
            </Pressable>
          ) : (
            <>
              {!done && !isChallenge && (
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
            </>
          )}
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
    clock: {
      color: colors.accentText,
      fontVariant: ['tabular-nums'],
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
