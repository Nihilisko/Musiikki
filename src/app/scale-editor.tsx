import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import BackButton from '../components/BackButton';
import FretboardStage from '../components/FretboardStage';
import KeyPicker from '../components/KeyPicker';
import { CHROMATIC_DEGREES, degreeLabels, degreeName } from '../music/degrees';
import { pitchClass, scalePitchClasses, type Scale } from '../music/scales';
import { spellScale } from '../music/spelling';
import { cleanIntervals, useCustomScales } from '../state/CustomScaleContext';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

/** A scale needs at least this many notes to be saved (the root and two more). */
const MIN_NOTES = 3;

// Build your own scale by switching degrees on and off; the fretboard shows it straight away.
// Opened from the scale screen, which keeps the phone sideways while this is on top of it.
export default function ScaleEditorScreen() {
  const styles = useThemedStyles(makeStyles);
  const { addScale } = useCustomScales();
  const [root, setRoot] = useState(0); // only for the preview; the scale works in every key
  const [name, setName] = useState('');
  const [intervals, setIntervals] = useState<number[]>([0]);

  const scale: Scale = { name: name.trim() || 'New scale', intervals };
  const spelled = spellScale(root, scale);
  const canSave = name.trim().length > 0 && intervals.length >= MIN_NOTES;

  function toggle(interval: number) {
    if (interval === 0) return; // the root is always part of the scale
    setIntervals((current) =>
      current.includes(interval)
        ? current.filter((i) => i !== interval)
        : cleanIntervals([...current, interval]),
    );
  }

  function save() {
    if (!canSave) return;
    addScale(name, intervals);
    router.back();
  }

  return (
    <FretboardStage
      back={<BackButton label="Scales" />}
      controls={
        <>
          <KeyPicker root={root} rootName={spelled.rootName} onChange={setRoot} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Scale name"
            maxLength={30}
            style={styles.name}
            placeholderTextColor={styles.placeholder.color}
            returnKeyType="done"
          />
          <Pressable
            onPress={save}
            disabled={!canSave}
            style={[styles.save, !canSave && styles.saveDisabled]}
            accessibilityLabel="Save scale"
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </>
      }
      fretboard={{
        highlight: { root, pitchClasses: scalePitchClasses(root, scale) },
        labelMode: 'degrees',
        degreeLabels: degreeLabels(root, scale),
        noteNames: spelled.names,
      }}
      status={
        <>
          <Text style={styles.title}>
            {spelled.rootName} {scale.name}
          </Text>
          <Text style={styles.notes}>
            {'   ' + intervals.map((i) => spelled.names[pitchClass(root + i)]).join(' ')}
          </Text>
          {intervals.length < MIN_NOTES && (
            <Text style={styles.hint}>
              {'   '}Pick at least {MIN_NOTES} notes
            </Text>
          )}
          {intervals.length >= MIN_NOTES && name.trim() === '' && (
            <Text style={styles.hint}>{'   '}Give the scale a name to save it</Text>
          )}
        </>
      }
      footer={
        // One button per semitone above the root. The root (1) is always on.
        <View style={styles.degrees}>
          {CHROMATIC_DEGREES.map((label, interval) => {
            const on = intervals.includes(interval);
            // Notes in the scale are named as the fretboard names them (♯4 rather than ♭5 in
            // a 7-note scale that already has a 5).
            const shown = on ? degreeName(interval, scale) : label;
            return (
              <Pressable
                key={interval}
                onPress={() => toggle(interval)}
                style={[styles.degree, on && styles.degreeOn, interval === 0 && styles.degreeRoot]}
                accessibilityLabel={`Degree ${label} ${on ? 'on' : 'off'}`}
              >
                <Text style={[styles.degreeText, on && styles.degreeTextOn]}>{shown}</Text>
              </Pressable>
            );
          })}
        </View>
      }
    />
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    name: {
      minWidth: 160,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    placeholder: {
      color: colors.textMuted,
    },
    save: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 16,
      backgroundColor: colors.brand,
    },
    saveDisabled: {
      opacity: 0.35,
    },
    saveText: {
      color: colors.onBrand,
      fontSize: 14,
      fontWeight: '700',
    },
    title: {
      color: colors.text,
      fontWeight: '700',
    },
    notes: {
      color: colors.accentText,
      fontWeight: '600',
    },
    hint: {
      color: colors.textMuted,
    },
    degrees: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 6,
      marginTop: 8,
    },
    degree: {
      minWidth: 40,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    degreeOn: {
      backgroundColor: colors.accent,
    },
    degreeRoot: {
      opacity: 0.8,
    },
    degreeText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    degreeTextOn: {
      color: colors.onAccent,
    },
  });
}
