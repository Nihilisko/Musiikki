import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { useDrone } from '../audio/useDrone';
import ChipRow from '../components/ChipRow';
import KeyPicker from '../components/KeyPicker';
import { pitchClass } from '../music/scales';
import { spellScale } from '../music/spelling';
import type { Colors } from '../theme/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';

const VOLUMES = [0.35, 0.65, 1];
const VOLUME_OPTIONS = ['Soft', 'Medium', 'Loud'];

// The drone: a steady note to play scales and melodies over and hear every note against.
export default function DroneScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [root, setRoot] = useState(9); // A: a common key, and easy to hear
  const [fifth, setFifth] = useState(true);
  const [volumeIndex, setVolumeIndex] = useState(1);
  const [playing, setPlaying] = useState(false);

  useDrone({ root, fifth, volume: VOLUMES[volumeIndex], playing });

  const names = spellScale(root).names;
  const rootName = names[root]!;
  const fifthName = names[pitchClass(root + 7)]!;

  // A slow breathing ring while it plays.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!playing) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.stage}>
        <Animated.View
          style={[styles.ring, { opacity: playing ? ringOpacity : 0.2, transform: [{ scale }] }]}
        />
        <View style={styles.disc}>
          <Text style={styles.note}>{rootName}</Text>
          <Text style={styles.sub}>{fifth ? `+ ${fifthName}` : 'root only'}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <KeyPicker root={root} rootName={rootName} onChange={setRoot} />
        <View style={styles.switchRow}>
          <Text style={styles.label}>Add the 5th</Text>
          <Switch
            value={fifth}
            onValueChange={setFifth}
            trackColor={{ true: colors.brand, false: colors.border }}
            thumbColor={colors.onBrand}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Volume</Text>
      <ChipRow options={VOLUME_OPTIONS} selected={volumeIndex} onSelect={setVolumeIndex} />

      <Pressable
        onPress={() => setPlaying((p) => !p)}
        style={({ pressed }) => [styles.start, pressed && { opacity: 0.7 }]}
        accessibilityLabel={playing ? 'Stop drone' : 'Play drone'}
      >
        <Ionicons name={playing ? 'stop' : 'play'} size={22} color={colors.onBrand} />
        <Text style={styles.startText}>{playing ? 'Stop' : 'Play'}</Text>
      </Pressable>

      <Text style={styles.hint}>
        Play a scale over the drone and listen to how each note sounds against {rootName}: the 5th
        sounds settled, the ♭3 sad, the 7th pulls up to the root. With a slide, tune each note until
        it stops wobbling against the drone.
      </Text>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      padding: 16,
      gap: 16,
    },
    stage: {
      height: 230,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 10,
      borderColor: colors.brand,
    },
    disc: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    note: {
      color: colors.text,
      fontSize: 56,
      fontWeight: '800',
    },
    sub: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    label: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
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
    hint: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
  });
}
