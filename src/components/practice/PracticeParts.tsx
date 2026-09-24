import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { readyForNext, type PracticeStats } from '../../music/practiceStats';
import type { Colors } from '../../theme/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import ChipRow from '../ChipRow';

// Parts shared by the ear training exercises (intervals, chord types...): the score, the level
// picker with its custom selection, the play buttons and the answer buttons.

export const RIGHT = '#2e9d57';
export const WRONG = '#d93a3a';

/** Something that can be asked and answered: an interval, a chord type... */
export type PracticeItem = { id: number; short: string; name: string };

export function ScoreHeader({
  right,
  total,
  streak,
}: {
  right: number;
  total: number;
  streak: number;
}) {
  const styles = useThemedStyles(makeStyles);
  const percent = total ? Math.round((right / total) * 100) : 0;
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.score}>
        {right} / {total}
        {total > 0 && <Text style={styles.scoreSub}> {percent}%</Text>}
      </Text>
      <Text style={styles.scoreSub}>Streak {streak}</Text>
    </View>
  );
}

type LevelPickerProps = {
  levelNames: string[];
  levelIndex: number;
  onSelect: (index: number) => void;
  /** Everything that can be picked in Custom mode. */
  allItems: PracticeItem[];
  /** What the chosen level (or custom selection) asks about. */
  items: PracticeItem[];
  isCustom: boolean;
  custom: number[];
  onToggleCustom: (id: number) => void;
  stats: PracticeStats;
};

/** Level chips (and "Custom"), what the level contains, all-time results and a nudge upwards. */
export function LevelPicker({
  levelNames,
  levelIndex,
  onSelect,
  allItems,
  items,
  isCustom,
  custom,
  onToggleCustom,
  stats,
}: LevelPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const levelName = isCustom ? 'Custom' : levelNames[levelIndex];
  const allTime = stats.total ? Math.round((stats.right / stats.total) * 100) : 0;
  const nextLevel = !isCustom && levelIndex < levelNames.length - 1 && readyForNext(stats);
  return (
    <>
      <Text style={styles.sectionLabel}>Level</Text>
      <ChipRow options={[...levelNames, 'Custom']} selected={levelIndex} onSelect={onSelect} />
      {isCustom ? (
        <View style={styles.customGrid}>
          {allItems.map((item) => {
            const on = custom.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => onToggleCustom(item.id)}
                style={[styles.customChip, on && styles.customOn]}
                accessibilityLabel={`${item.name} ${on ? 'on' : 'off'}`}
              >
                <Text style={[styles.customText, on && styles.customTextOn]}>{item.short}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.hint}>{items.map((i) => i.short).join('  ')}</Text>
      )}
      {stats.total > 0 && (
        <Text style={styles.hint}>
          All time on {levelName}: {allTime}% right of {stats.total}
        </Text>
      )}
      {nextLevel && (
        <Pressable
          onPress={() => onSelect(levelIndex + 1)}
          style={({ pressed }) => [styles.nextLevel, pressed && styles.pressed]}
        >
          <Ionicons name="trophy-outline" size={20} color={colors.onBrand} />
          <Text style={styles.nextLevelText}>
            17+ of your last 20 right. Try {levelNames[levelIndex + 1]}!
          </Text>
        </Pressable>
      )}
    </>
  );
}

type PlayButtonsProps = {
  started: boolean;
  answered: boolean;
  onAgain: () => void;
  onNext: () => void;
};

/** "Again" to hear the question once more, "Start" / "Next" for a new one. */
export function PlayButtons({ started, answered, onAgain, onNext }: PlayButtonsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.buttons}>
      {started && (
        <Pressable
          onPress={onAgain}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          accessibilityLabel="Play again"
        >
          <Ionicons name="repeat" size={20} color={colors.text} />
          <Text style={styles.secondaryText}>Again</Text>
        </Pressable>
      )}
      {(!started || answered) && (
        <Pressable
          onPress={onNext}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          accessibilityLabel={started ? 'Next question' : 'Start'}
        >
          <Ionicons name={started ? 'play-forward' : 'play'} size={20} color={colors.onBrand} />
          <Text style={styles.primaryText}>{started ? 'Next' : 'Start'}</Text>
        </Pressable>
      )}
    </View>
  );
}

type AnswerGridProps = {
  items: PracticeItem[];
  /** No question yet: the buttons are shown faded. */
  idle: boolean;
  answered: boolean;
  /** After answering: the right answer (green) and the chosen one if wrong (red). */
  rightId?: number;
  chosenId?: number;
  onChoose: (id: number) => void;
};

export function AnswerGrid({
  items,
  idle,
  answered,
  rightId,
  chosenId,
  onChoose,
}: AnswerGridProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const isRight = answered && item.id === rightId;
        const isWrongPick = answered && item.id === chosenId && chosenId !== rightId;
        const colored = isRight || isWrongPick;
        return (
          <Pressable
            key={item.id}
            disabled={idle || answered}
            onPress={() => onChoose(item.id)}
            style={({ pressed }) => [
              styles.choice,
              isRight && { backgroundColor: RIGHT },
              isWrongPick && { backgroundColor: WRONG },
              pressed && styles.pressed,
              idle && styles.idle,
            ]}
            accessibilityLabel={item.name}
          >
            <Text style={[styles.choiceShort, colored && styles.onColor]}>{item.short}</Text>
            <Text style={[styles.choiceName, colored && styles.onColor]}>{item.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    scoreRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    score: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
    },
    scoreSub: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '600',
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
    },
    customGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    customChip: {
      minWidth: '15%',
      paddingVertical: 8,
      paddingHorizontal: 6,
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    customOn: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    customText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    customTextOn: {
      color: colors.onAccent,
    },
    nextLevel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.brand,
    },
    nextLevelText: {
      flex: 1,
      color: colors.onBrand,
      fontSize: 14,
      fontWeight: '700',
    },
    buttons: {
      flexDirection: 'row',
      gap: 10,
    },
    primary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 12,
      backgroundColor: colors.brand,
    },
    primaryText: {
      color: colors.onBrand,
      fontSize: 16,
      fontWeight: '700',
    },
    secondary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.7,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    choice: {
      width: '31.8%',
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    idle: {
      opacity: 0.5,
    },
    choiceShort: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    choiceName: {
      color: colors.textMuted,
      fontSize: 11,
      textAlign: 'center',
    },
    onColor: {
      color: '#fff',
    },
  });
}
