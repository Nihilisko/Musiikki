// Where to play a bass line on the neck: one string and fret for every note, kept in one hand
// position so the line is easy to play.

export type FretPosition = { string: number; fret: number };

/** Frets the hand reaches without moving: one finger per fret, plus a stretch. */
const HAND_SPAN = 4;
const MAX_FRET = 12;

/**
 * Finds a string and fret for each note (MIDI numbers, in playing order).
 * @param strings  open strings from lowest to highest, as MIDI numbers
 *
 * Tries every hand position (the lowest fret the hand covers) and picks the one where all the
 * notes fit with the least moving, preferring low positions and open strings near the nut.
 */
export function fingerBassLine(notes: number[], strings: number[]): FretPosition[] {
  let best: { cost: number; positions: FretPosition[] } | undefined;
  for (let hand = 0; hand <= MAX_FRET; hand++) {
    let cost = hand * 0.3; // lower on the neck is a little easier to read and play
    const positions: FretPosition[] = [];
    for (const midi of notes) {
      // Places this note can be played on, and how far each is outside the hand.
      let pick: { pos: FretPosition; miss: number } | undefined;
      strings.forEach((open, string) => {
        const fret = midi - open;
        if (fret < 0 || fret > MAX_FRET + HAND_SPAN) return;
        const low = hand === 0 ? 0 : hand;
        const miss =
          fret === 0 ? (hand <= 1 ? 0 : 3) : Math.max(0, low - fret, fret - (low + HAND_SPAN - 1));
        if (!pick || miss < pick.miss || (miss === pick.miss && string < pick.pos.string)) {
          pick = { pos: { string, fret }, miss };
        }
      });
      if (!pick) return []; // the note is out of the instrument's range
      cost += pick.miss * 2;
      positions.push(pick.pos);
    }
    if (!best || cost < best.cost) best = { cost, positions };
  }
  return best?.positions ?? [];
}
