import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useBacking } from '../audio/useBacking';
import ChipRow from '../components/ChipRow';
import Dropdown from '../components/Dropdown';
import KeyPicker from '../components/KeyPicker';
import Stepper from '../components/Stepper';
import { GROOVES, grooveById, chordSoundName } from '../music/backing';
import { bassLine } from '../music/bassLines';
import type { KeyMode } from '../music/circle';
import { clampBpm } from '../music/metronome';
import { keyScale, progressionChords, PROGRESSIONS } from '../music/progressions';
import { spellScale } from '../music/spelling';
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

  const mode = MODES[modeIndex];
  const progressions = PROGRESSIONS[mode];
  const progression = progressions[Math.min(progressionIndex, progressions.length - 1)];
  const chords = progressionChords(tonic, mode, progression);
  const groove = grooveById(grooveId);
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

  const { running, bar, beat, toggle } = useBacking({
    groove,
    bpm,
    bars,
    pianoVolume: 0.55,
    drumVolume: MIX[drumMix],
    bassVolume: bassOn ? 0.9 : 0,
  });

  // Picking a progression also picks the groove that suits it (you can still change it).
  function chooseProgression(index: number, newMode = mode) {
    setProgressionIndex(index);
    const suited = grooveById(PROGRESSIONS[newMode][index].groove);
    setGrooveId(suited.id);
    setBpm(suited.defaultBpm);
  }

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
          return (
            <View
              key={i}
              style={[styles.bar, active && { backgroundColor: chord.color }]}
              accessibilityLabel={`Bar ${i + 1}: ${chord.name}`}
            >
              <Text style={[styles.barChord, active && styles.barChordActive]}>{chord.name}</Text>
              <Text style={[styles.barNumeral, active && styles.barChordActive]}>
                {chord.numeral}
              </Text>
            </View>
          );
        })}
      </View>

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
          <Text style={styles.hint}>Turn off to play the bass line yourself</Text>
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
    bar: {
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
