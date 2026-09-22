import { router } from 'expo-router';
import { useRef } from 'react';
import { PanResponder, ScrollView, StyleSheet, Text, View } from 'react-native';

import ProgressionPractice from '../components/ProgressionPractice';
import { keyName } from '../music/circle';
import { useLockedKey } from '../state/KeyContext';
import { colors } from '../theme/colors';

/** How far down (in pixels) the handle must be pulled to close the screen. */
const CLOSE_DISTANCE = 80;

// Practice view for the locked key: progressions and the fretboard, nothing else.
// Pull the handle at the top down to go back to the circle.
export default function ProgressionScreen() {
  const { lockedKey } = useLockedKey();

  // Close as soon as the pull is long enough, instead of waiting for the finger to lift:
  // other gestures (like the modal's own) may take over before the release arrives.
  const closed = useRef(false);
  const swipe = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        closed.current = false;
      },
      onPanResponderMove: (_, gesture) => {
        if (!closed.current && gesture.dy > CLOSE_DISTANCE) {
          closed.current = true;
          router.back();
        }
      },
    }),
  ).current;

  if (!lockedKey) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Lock a key on the circle of fifths first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* The handle: pull down here to return to the circle. */}
      <View style={styles.handleArea} {...swipe.panHandlers}>
        <View style={styles.handle} />
        <Text style={styles.key}>{keyName(lockedKey.index, lockedKey.mode)}</Text>
        <Text style={styles.hint}>Pull down to go back to the circle</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ProgressionPractice index={lockedKey.index} mode={lockedKey.mode} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
    marginBottom: 10,
  },
  key: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    paddingBottom: 40,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
});
