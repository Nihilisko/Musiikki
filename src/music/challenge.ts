// A timed challenge: as many tasks as you can in a minute. Kept apart from the screen so the
// rules (time left, score, record) can be tested without a phone.

export const CHALLENGE_MS = 60_000;

export type Challenge = {
  /** When the minute ends (ms since 1970), or null before starting. */
  endsAt: number | null;
  score: number;
  misses: number;
  finished: boolean;
};

export const NEW_CHALLENGE: Challenge = { endsAt: null, score: 0, misses: 0, finished: false };

export function startChallenge(now: number): Challenge {
  return { endsAt: now + CHALLENGE_MS, score: 0, misses: 0, finished: false };
}

export function isRunning(c: Challenge): boolean {
  return c.endsAt !== null && !c.finished;
}

/** Whole seconds left, never below zero. */
export function secondsLeft(c: Challenge, now: number): number {
  if (c.endsAt === null) return CHALLENGE_MS / 1000;
  return Math.max(0, Math.ceil((c.endsAt - now) / 1000));
}

/** "0:42" */
export function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** True when a finished challenge beats the old record (a first score of 1+ is a record too). */
export function isRecord(c: Challenge, best: number | undefined): boolean {
  return c.finished && c.score > 0 && c.score > (best ?? 0);
}
