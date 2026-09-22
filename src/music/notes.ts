// Notes are stored as MIDI numbers: C4 (middle C) = 60, each step = one semitone (one fret).

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Note name without octave, e.g. 64 -> "E". */
export function noteName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

/** Note name with octave, e.g. 64 -> "E4". */
export function noteNameWithOctave(midi: number): string {
  return noteName(midi) + (Math.floor(midi / 12) - 1);
}
