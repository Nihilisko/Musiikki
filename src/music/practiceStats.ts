// Practice statistics: how many answers were right in total, and the most recent ones, which
// tell whether you are ready for the next level.

export type PracticeStats = {
  right: number;
  total: number;
  /** The latest answers, newest last (true = right). */
  recent: boolean[];
};

/** How many of the latest answers are looked at, and how many of them must be right. */
export const RECENT_COUNT = 20;
export const READY_RIGHT = 17; // 85 %

export const EMPTY_STATS: PracticeStats = { right: 0, total: 0, recent: [] };

export function recordAnswer(stats: PracticeStats, right: boolean): PracticeStats {
  return {
    right: stats.right + (right ? 1 : 0),
    total: stats.total + 1,
    recent: [...stats.recent, right].slice(-RECENT_COUNT),
  };
}

/** True when at least 17 of the latest 20 answers were right. */
export function readyForNext(stats: PracticeStats): boolean {
  return stats.recent.length >= RECENT_COUNT && stats.recent.filter(Boolean).length >= READY_RIGHT;
}

/** Checks stats read from the phone, which may be old or broken. */
export function cleanStats(value: unknown): PracticeStats {
  const v = value as Partial<PracticeStats> | null;
  if (!v || typeof v.right !== 'number' || typeof v.total !== 'number') return EMPTY_STATS;
  const recent = Array.isArray(v.recent) ? v.recent.filter((x) => typeof x === 'boolean') : [];
  return { right: v.right, total: v.total, recent: recent.slice(-RECENT_COUNT) };
}
