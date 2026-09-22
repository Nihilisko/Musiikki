// Notes are stored as MIDI numbers: C4 (middle C) = 60, each step = one semitone (one fret).

export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

/** Both names for each key, for pickers: "C♯/D♭". */
export const KEY_NAMES = NOTE_NAMES.map((sharp, i) =>
  sharp === FLAT_NAMES[i] ? sharp : `${sharp}/${FLAT_NAMES[i]}`,
);

/** Note name without octave, e.g. 64 -> "E". Uses ♯ unless `flats` is true. */
export function noteName(midi: number, flats = false): string {
  return (flats ? FLAT_NAMES : NOTE_NAMES)[((midi % 12) + 12) % 12];
}

/** Note name with octave, e.g. 64 -> "E4". */
export function noteNameWithOctave(midi: number, flats = false): string {
  return noteName(midi, flats) + (Math.floor(midi / 12) - 1);
}
