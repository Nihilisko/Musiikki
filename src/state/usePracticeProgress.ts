import { useEffect, useState } from 'react';

import { cleanStats, EMPTY_STATS, recordAnswer, type PracticeStats } from '../music/practiceStats';
import { loadJson, saveJson } from './storage';

/** What is saved on the phone: the last settings and the statistics of each level. */
type Saved = {
  levelIndex: number;
  /** Direction for intervals, playing style for chords... */
  modeIndex: number;
  custom: number[];
  stats: Record<string, PracticeStats>;
};

type Options = {
  storageKey: string;
  /** Number of ready-made levels; the "Custom" choice comes right after them. */
  levelCount: number;
  modeCount: number;
  defaultCustom: number[];
  /** True for an item that may be in the custom selection (checks old saved data). */
  isValidItem: (id: number) => boolean;
};

/**
 * Settings and results of an ear training exercise, remembered on the phone: the level (or
 * Custom), the mode, the custom selection and each level's statistics.
 */
export function usePracticeProgress({
  storageKey,
  levelCount,
  modeCount,
  defaultCustom,
  isValidItem,
}: Options) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [modeIndex, setModeIndex] = useState(0);
  const [custom, setCustom] = useState(defaultCustom);
  const [stats, setStats] = useState<Record<string, PracticeStats>>({});
  const [loaded, setLoaded] = useState(false);

  // Read the saved data once and check it: it may be old or broken.
  useEffect(() => {
    loadJson<Partial<Saved> & { directionIndex?: number }>(storageKey).then((saved) => {
      if (saved) {
        const index = (n: unknown, max: number) =>
          typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max ? n : 0;
        setLevelIndex(index(saved.levelIndex, levelCount));
        // "directionIndex" is the older name used by the first interval version.
        setModeIndex(index(saved.modeIndex ?? saved.directionIndex, modeCount - 1));
        const picked = Array.isArray(saved.custom) ? saved.custom.filter(isValidItem) : [];
        if (picked.length >= 2) setCustom(picked);
        const cleaned: Record<string, PracticeStats> = {};
        Object.entries(saved.stats ?? {}).forEach(([key, value]) => {
          cleaned[key] = cleanStats(value);
        });
        setStats(cleaned);
      }
      setLoaded(true);
    });
    // Read once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save whenever something changes (but not before the saved data has been read).
  useEffect(() => {
    if (loaded) {
      saveJson(storageKey, { levelIndex, modeIndex, custom, stats } satisfies Saved);
    }
  }, [loaded, storageKey, levelIndex, modeIndex, custom, stats]);

  const isCustom = levelIndex === levelCount;
  const statsKey = isCustom ? 'custom' : `level${levelIndex + 1}`;

  /** Turns an item of the custom selection on or off; at least two stay on. */
  function toggleCustom(id: number) {
    if (custom.includes(id)) {
      if (custom.length > 2) setCustom(custom.filter((c) => c !== id));
    } else {
      setCustom([...custom, id]);
    }
  }

  function record(right: boolean) {
    setStats((all) => ({ ...all, [statsKey]: recordAnswer(all[statsKey] ?? EMPTY_STATS, right) }));
  }

  return {
    levelIndex,
    setLevelIndex,
    modeIndex,
    setModeIndex,
    custom,
    toggleCustom,
    isCustom,
    levelStats: stats[statsKey] ?? EMPTY_STATS,
    record,
  };
}
