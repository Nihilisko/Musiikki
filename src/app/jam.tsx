import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useBacking } from '../audio/useBacking';
import BassLineBoard, { type BoardNote } from '../components/BassLineBoard';
import ChipRow from '../components/ChipRow';
import Dropdown from '../components/Dropdown';
import KeyPicker from '../components/KeyPicker';
import Stepper from '../components/Stepper';
import StrumPatternView from '../components/StrumPatternView';
import { GROOVES, grooveById, chordSoundName } from '../music/backing';
import { fingerBassLine, type FretPosition } from '../music/bassFingering';
import { bassLine, type BassNote } from '../music/bassLines';
import type { KeyMode } from '../music/circle';
import { clampBpm } from '../music/metronome';
import { keyScale, progressionChords, PROGRESSIONS } from '../music/progressions';
import { noteName } from '../music/notes';
import { pitchClass } from '../music/scales';
import { spellChord, spellScale } from '../music/spelling';
import { patternsForGroove } from '../music/strums';
import { useInstrument } from '../state/InstrumentContext';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const MODES: KeyMode[] = ['major', 'minor'];
const MIX = [0.4, 0.7, 1];
const MIX_OPTIONS = ['Soft', 'Medium', 'Loud'];

// Chord progressions with a drum groove and piano, to jam and practise scales over.
export default function JamScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [modeIndex, setModeIndex] = useState(0);
  const [progressionIndex, setProgressionIndex] = useState(0);
  const [tonic, setTonic] = useState(9); // A: the classic blues key for guitar
  const [grooveId, setGrooveId] = useState(PROGRESSIONS.major[0].groove);
  const [bpm, setBpm] = useState(grooveById(grooveId).defaultBpm);
  const [drumMix, setDrumMix] = useState(1);
  const [bassOn, setBassOn] = useState(true);
  const [pickedBar, setPickedBar] = useState(0); // bar whose bass line is shown when stopped
  const { instrument, tuning } = useInstrument();
  const isBass = instrument.id === 'bass';
  // The chosen strumming pattern for each groove; a groove starts with the one that suits it.
  const [patternChoice, setPatternChoice] = useState<Record<string, string>>({});

  const mode = MODES[modeIndex];
  const progressions = PROGRESSIONS[mode];
  const progression = progressions[Math.min(progressionIndex, progressions.length - 1)];
  const chords = progressionChords(tonic, mode, progression);
  const groove = grooveById(grooveId);
  const patterns = patternsForGroove(grooveId);
  const pattern = patterns.find((p) => p.id === patternChoice[grooveId]) ?? patterns[0];
  const tonicName = spellScale(tonic, keyScale(mode)).rootName;

  // The piano sound and bass line of every bar, remade only when the chords or groove change.
  const chordKey = chords.map((c) => c.name).join(' ');
  const bars = useMemo(
    () =>
      progression.bars.map((chordIndex, i) => {
        const chord = chords[chordIndex];
        const next = chords[progression.bars[(i + 1) % progression.bars.length]];
        return {
          chord: chordSoundName(chord.root, chord.type),
          bass: bassLine(grooveId, chord.root, chord.type, next.root),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chordKey, progression, grooveId],
  );

  const { running, bar, beat, step, toggle } = useBacking({
    groove,
    bpm,
    bars,
    pianoVolume: 0.8,
    drumVolume: MIX[drumMix],
    bassVolume: bassOn ? 0.55 : 0,
  });

  // Picking a progression also picks the groove that suits it (you can still change it).
  function chooseProgression(index: number, newMode = mode) {
    setProgressionIndex(index);
    const suited = grooveById(PROGRESSIONS[newMode][index].groove);
    setGrooveId(suited.id);
    setBpm(suited.defaultBpm);
  }

  // The bass line on the neck: the bar playing now, or the bar you tapped when stopped.
  // On a bass the neck has your tuning; on other instruments a 4-string bass (a guitar's four
  // lowest strings are the same notes an octave higher, so the shapes work there too).
  const shownBar = running ? Math.max(0, bar) : Math.min(pickedBar, bars.length - 1);
  const boardStrings = instrument.id === 'bass' ? tuning.strings : STANDARD_BASS;
  const shownChord = chords[progression.bars[shownBar]];
  const shownLine = bars[shownBar].bass;
  const positions = fingerBassLine(
    shownLine.map((n) => n.midi),
    boardStrings,
  );
  const sounding = running && bar === shownBar ? lastIndexAtOrBefore(shownLine, step) : -1;
  const boardNotes = groupByPosition(shownLine, positions, sounding);
  const chordNames = spellChord(shownChord.root, shownChord.type).names;
  const keyNames = spellScale(tonic, keyScale(mode)).names;
  const lineNames = shownLine
    .map((n) => chordNames[pitchClass(n.midi)] ?? keyNames[pitchClass(n.midi)] ?? noteName(n.midi))
    .join(' – ');

  const current = bar >= 0 ? chords[progression.bars[bar]] : undefined;
  const next = bar >= 0 ? chords[progression.bars[(bar + 1) % progression.bars.length]] : undefined;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.now}>
        <Text style={[styles.nowChord, current && { color: current.color }]}>
          {current ? current.name : running ? String(beat + 1) : chords[0].name}
        </Text>
        <Text style={styles.nowSub}>
          {current
            ? `${current.numeral}  ·  next ${next!.name}`
            : running
              ? 'Count-in…'
              : `${progression.name} in ${tonicName}`}
        </Text>
        <View style={styles.beats}>
          {[0, 1, 2, 3].map((b) => (
            <View key={b} style={[styles.beatDot, running && beat === b && styles.beatOn]} />
          ))}
        </View>
      </View>

      <View style={styles.form}>
        {progression.bars.map((chordIndex, i) => {
          const chord = chords[chordIndex];
          const active = i === bar;
          const picked = !running && i === shownBar;
          return (
            <Pressable
              key={i}
              onPress={() => setPickedBar(i)}
              disabled={running}
              style={[
                styles.bar,
                active && { backgroundColor: chord.color },
                picked && { borderColor: chord.color },
              ]}
              accessibilityLabel={`Bar ${i + 1}: ${chord.name}`}
            >
              <Text style={[styles.barChord, active && styles.barChordActive]}>{chord.name}</Text>
              <Text style={[styles.barNumeral, active && styles.barChordActive]}>
                {chord.numeral}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isBass ? (
        <>
          <View style={styles.bassHeader}>
            <Text style={styles.sectionLabel}>
              Bass line · bar {shownBar + 1} · {shownChord.name}
            </Text>
            <Text style={styles.hint}>{lineNames}</Text>
          </View>
          <BassLineBoard
            strings={boardStrings}
            stringNames={boardStrings.map((m) => noteName(m, tuning.flats))}
            notes={boardNotes}
          />
          {!running && <Text style={styles.hint}>Tap a bar to see its bass line.</Text>}
        </>
      ) : (
        <>
          <View style={styles.strumHeader}>
            <Text style={styles.sectionLabel}>Strum</Text>
            <Dropdown
              label={pattern.name}
              options={patterns.map((p) => `${p.name} (${p.level})`)}
              selected={patterns.indexOf(pattern)}
              onSelect={(i) => setPatternChoice((c) => ({ ...c, [grooveId]: patterns[i].id }))}
            />
          </View>
          <StrumPatternView pattern={pattern} step={running && bar >= 0 ? step : -1} />
        </>
      )}

      <View style={styles.row}>
        <KeyPicker root={tonic} rootName={tonicName} onChange={setTonic} />
        <ChipRow
          options={['Major', 'Minor']}
          selected={modeIndex}
          onSelect={(i) => {
            setModeIndex(i);
            chooseProgression(0, MODES[i]);
          }}
        />
      </View>

      <Dropdown
        label={progression.name}
        options={progressions.map((p) => p.name)}
        selected={progressionIndex}
        onSelect={(i) => chooseProgression(i)}
      />

      <Text style={styles.sectionLabel}>Groove</Text>
      <ChipRow
        options={GROOVES.map((g) => g.name)}
        selected={GROOVES.indexOf(groove)}
        onSelect={(i) => setGrooveId(GROOVES[i].id)}
      />

      <Text style={styles.sectionLabel}>Tempo</Text>
      <Stepper
        value={bpm}
        min={40}
        max={220}
        step={5}
        caption="BPM"
        onChange={(v) => setBpm(clampBpm(v))}
      />

      <Text style={styles.sectionLabel}>Drums</Text>
      <ChipRow options={MIX_OPTIONS} selected={drumMix} onSelect={setDrumMix} />

      <View style={styles.row}>
        <View style={styles.switchText}>
          <Text style={styles.label}>Bass</Text>
          <Text style={styles.hint}>
            {isBass ? 'Turn off to play the bass line yourself' : 'Turn off for a lighter backing'}
          </Text>
        </View>
        <Switch
          value={bassOn}
          onValueChange={setBassOn}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor={colors.onBrand}
          accessibilityLabel="Bass"
        />
      </View>

      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.start, pressed && { opacity: 0.7 }]}
        accessibilityLabel={running ? 'Stop backing track' : 'Play backing track'}
      >
        <Ionicons name={running ? 'stop' : 'play'} size={22} color={colors.onBrand} />
        <Text style={styles.startText}>{running ? 'Stop' : 'Play'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const STANDARD_BASS = [28, 33, 38, 43];

/** Index of the last note that has started by this step (-1 before the first). */
function lastIndexAtOrBefore(line: BassNote[], step: number): number {
  let found = -1;
  line.forEach((n, i) => {
    if (n.step <= step) found = i;
  });
  return found;
}

/** One dot per place on the neck, numbered with every time it is played ("2 8"). */
function groupByPosition(
  line: BassNote[],
  positions: FretPosition[],
  sounding: number,
): BoardNote[] {
  const groups = new Map<string, BoardNote>();
  positions.forEach((position, i) => {
    const key = `${position.string}:${position.fret}`;
    const group = groups.get(key);
    if (group) {
      group.label += ` ${i + 1}`;
      group.active ||= i === sounding;
    } else {
      groups.set(key, { position, label: String(i + 1), active: i === sounding });
    }
  });
  return [...groups.values()];
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 16,
    },
    now: {
      alignItems: 'center',
      gap: 4,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.surface,
    },
    nowChord: {
      color: colors.text,
      fontSize: 52,
      fontWeight: '800',
    },
    nowSub: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    beats: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    beatDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.border,
    },
    beatOn: {
      backgroundColor: colors.brand,
    },
    form: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    strumHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: -4,
    },
    bassHeader: {
      gap: 10,
      marginBottom: -6,
    },
    bar: {
      borderWidth: 2,
      borderColor: 'transparent',
      width: '23.5%',
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    barChord: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    barNumeral: {
      color: colors.textMuted,
      fontSize: 12,
    },
    barChordActive: {
      color: '#fff',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    switchText: {
      flex: 1,
      gap: 2,
    },
    label: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    hint: {
      color: colors.textMuted,
      fontSize: 13,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: -8,
    },
    start: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: colors.brand,
    },
    startText: {
      color: colors.onBrand,
      fontSize: 18,
      fontWeight: '700',
    },
  });
}
