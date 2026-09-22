import { StyleSheet, Text, View } from 'react-native';

import BackButton from '../components/BackButton';
import ProgressionPractice from '../components/ProgressionPractice';
import { keyName } from '../music/circle';
import { useLockedKey } from '../state/KeyContext';
import { useLandscape } from '../state/orientation';
import type { Colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeContext';

// Practice view for the locked key: progressions and the whole neck, turned sideways.
export default function ProgressionScreen() {
  const styles = useThemedStyles(makeStyles);
  const { lockedKey } = useLockedKey();

  useLandscape(); // sideways while this screen is open

  if (!lockedKey) {
    return (
      <View style={styles.empty}>
        <BackButton label="Circle" />
        <Text style={styles.emptyText}>Lock a key on the circle of fifths first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ProgressionPractice
        index={lockedKey.index}
        mode={lockedKey.mode}
        back={<BackButton label="Circle" />}
        title={keyName(lockedKey.index, lockedKey.mode)}
      />
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      backgroundColor: colors.background,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 16,
      textAlign: 'center',
    },
  });
}
