// Chord shapes (voicings) worked out for any tuning, instead of a hand-written chord book.
//
// For each small area of the neck the search tries every way to play the chord: each string
// is muted, open, or pressed on a fret within a 4-fret stretch. A shape is kept if it is
// playable (enough fingers, no gaps) and contains the chord's notes. Shapes are then scored so
// that familiar ones come first: low on the neck, open strings, few muted strings, root in the
// bass. That's how the open chords everyone knows (x32010 for C) turn up by themselves.

import type { ChordType } from './chords';
import { pitchClass } from './scales';

/** One shape: the fret for each string, lowest string first. −1 = muted, 0 = open. */
export type Voicing = { frets: number[]; score: number };

/** Frets reachable with one hand, the lowest pressed fret included. */
const STRETCH = 4;
/** How far up the neck to look. */
const HIGHEST_START = 12;
const MUTED = -1;

type Options = {
  /** The most shapes to return. */
  limit?: number;
};

/**
 * Playable shapes for a chord on the given open strings (MIDI, lowest first), best first.
 * @param root pitch class of the root (0 = C)
 */
export function chordVoicings(
  strings: number[],
  root: number,
  chord: ChordType,
  { limit = 8 }: Options = {},
): Voicing[] {
  const chordPcs = chord.tones.map((t) => pitchClass(root + t.interval));
  // In 4-note chords the plain 5th may be left out (guitarists often do, and on 3-4 strings
  // there may be no room for it). Other notes give the chord its sound, so they must be there.
  const fifth = chord.tones.find((t) => t.degree === '5');
  const optionalPcs = fifth && chord.tones.length > 3 ? [pitchClass(root + fifth.interval)] : [];
  const required = chordPcs.filter((pc) => !optionalPcs.includes(pc));
  const minSounding = Math.min(strings.length, Math.max(3, required.length));
  const rootInBass = strings.length >= 5; // re-entrant ukulele & co. can't keep this rule
  // Open tunings (Open G, Open D...): the open strings make a chord of at most three notes.
  const openPcs = new Set(strings.map((s) => pitchClass(s)));
  const openTuning = openPcs.size <= 3;

  const found = new Map<string, Voicing>();

  for (let start = 0; start <= HIGHEST_START; start++) {
    // The notes each string could play in this area.
    const choices = strings.map((open) => {
      const list: number[] = [MUTED];
      if (chordPcs.includes(pitchClass(open))) list.push(0);
      for (let fret = Math.max(1, start); fret < Math.max(1, start) + STRETCH; fret++) {
        if (chordPcs.includes(pitchClass(open + fret))) list.push(fret);
      }
      return list;
    });

    const frets = new Array<number>(strings.length);
    const walk = (index: number) => {
      if (index === strings.length) {
        const score = scoreShape(
          frets,
          strings,
          root,
          required,
          optionalPcs,
          minSounding,
          rootInBass,
          openTuning,
        );
        if (score !== null) {
          const key = frets.join(',');
          const old = found.get(key);
          if (!old || score < old.score) found.set(key, { frets: [...frets], score });
        }
        return;
      }
      for (const fret of choices[index]) {
        frets[index] = fret;
        walk(index + 1);
      }
    };
    walk(0);
  }

  // Best first, but not ten versions of the same shape: keep the best one for each lowest
  // pressed fret, so the list moves up the neck.
  const byScore = [...found.values()].sort((a, b) => a.score - b.score);
  const seenPositions = new Set<number>();
  const result: Voicing[] = [];
  for (const v of byScore) {
    const position = lowestPressed(v.frets);
    if (seenPositions.has(position)) continue;
    seenPositions.add(position);
    result.push(v);
    if (result.length === limit) break;
  }
  return result;
}

function lowestPressed(frets: number[]): number {
  const pressed = frets.filter((f) => f > 0);
  return pressed.length ? Math.min(...pressed) : 0;
}

/** A score for a shape (lower is better), or null when it can't be played or isn't the chord. */
function scoreShape(
  frets: number[],
  strings: number[],
  root: number,
  required: number[],
  optional: number[],
  minSounding: number,
  rootInBass: boolean,
  openTuning: boolean,
): number | null {
  const sounding = frets.map((f, i) => (f === MUTED ? -1 : i)).filter((i) => i >= 0);
  if (sounding.length < minSounding) return null;

  // Muted strings only at the low side (like x32010); no silent strings in the middle.
  const first = sounding[0];
  if (sounding.length !== frets.length - first) return null;

  // Every required chord note must sound.
  const pcs = new Set(sounding.map((i) => pitchClass(strings[i] + frets[i])));
  if (!required.every((pc) => pcs.has(pc))) return null;

  // The lowest note should be the root. In open tunings the 5th in the bass is fine too: Open G
  // (D G D G B D) is strummed on all strings with the 5th at the bottom.
  // Other bass notes make inversions, a job for the triads and inversions part.
  let fifthInBass = false;
  if (rootInBass) {
    const lowest = pitchClass(Math.min(...sounding.map((i) => strings[i] + frets[i])));
    if (lowest !== root) {
      if (!openTuning || lowest !== pitchClass(root + 7)) return null;
      fifthInBass = true;
    }
  }

  // Fingers: a barre (one finger across the lowest pressed fret) counts as one finger.
  const pressed = sounding.filter((i) => frets[i] > 0);
  const low = pressed.length ? Math.min(...pressed.map((i) => frets[i])) : 0;
  const high = pressed.length ? Math.max(...pressed.map((i) => frets[i])) : 0;
  if (high - low >= STRETCH) return null;
  let fingers = pressed.length;
  let barre = false;
  if (fingers > 4) {
    // A barre works if no open string sounds above where it starts.
    const barreFrom = pressed.find((i) => frets[i] === low)!;
    const openAbove = sounding.some((i) => i > barreFrom && frets[i] === 0);
    if (openAbove) return null;
    fingers = 1 + pressed.filter((i) => frets[i] > low).length;
    barre = true;
    if (fingers > 4) return null;
  }

  const missingOptional = optional.filter((pc) => !pcs.has(pc)).length;
  const muted = frets.length - sounding.length;
  // Instruments with few strings are nearly always strummed on every string.
  const mutePenalty = frets.length <= 4 ? 3.5 : 1.1;
  // Open strings among notes from the 4th fret up (x20402) are possible but rarely what
  // anyone plays; in first-position chords (320003) they are completely normal.
  const strayOpen = high >= 4 ? sounding.filter((i) => i > first && frets[i] === 0).length : 0;
  const open = sounding.filter((i) => frets[i] === 0).length;
  return (
    low * 1.2 + // lower on the neck is easier and more familiar
    (high - low) * 0.6 + // smaller stretch
    muted * mutePenalty +
    strayOpen * 1.3 +
    (fifthInBass ? 0.3 : 0) +
    fingers * 0.35 +
    (barre ? 0.6 : 0) +
    missingOptional * 0.8 -
    open * 0.4
  );
}

/** Where a chord diagram starts: fret 1 (with the nut) if the shape fits, otherwise higher up. */
export function diagramStart(frets: number[], rows = 5): number {
  const pressed = frets.filter((f) => f > 0);
  if (pressed.length === 0) return 1;
  const high = Math.max(...pressed);
  if (high <= rows) return 1;
  return Math.min(...pressed);
}
