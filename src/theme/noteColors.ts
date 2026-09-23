// Note colours on the fretboard, by role. They are the same in both themes.
// The user picks a colour for each role from one shared palette (Settings).

export type NoteColor = { background: string; text: string };

export type PaletteColor = NoteColor & { id: string; name: string };

/** Clear, easy-to-tell-apart colours. Light ones get dark text so the note names stay readable. */
export const NOTE_PALETTE: PaletteColor[] = [
  { id: 'red', name: 'Red', background: '#d93a3a', text: '#ffffff' },
  { id: 'orange', name: 'Orange', background: '#e8822a', text: '#1d1512' },
  { id: 'yellow', name: 'Yellow', background: '#f2c230', text: '#1d1512' },
  { id: 'green', name: 'Green', background: '#2e9d57', text: '#ffffff' },
  { id: 'teal', name: 'Teal', background: '#1a9a96', text: '#ffffff' },
  { id: 'blue', name: 'Blue', background: '#1e7be0', text: '#ffffff' },
  { id: 'purple', name: 'Purple', background: '#8a55d0', text: '#ffffff' },
  { id: 'black', name: 'Black', background: '#0f0b09', text: '#ffffff' },
];

export type NoteRole = 'root' | 'scale' | 'blue';

/** Which palette colour each role uses. */
export type NoteColorChoice = Record<NoteRole, string>;

export const DEFAULT_NOTE_CHOICE: NoteColorChoice = { root: 'red', scale: 'green', blue: 'blue' };

export type NoteColors = Record<NoteRole, NoteColor> & {
  /** Notes when no scale is chosen; not something the user picks. */
  plain: NoteColor;
};

const PLAIN: NoteColor = { background: '#241c18', text: '#ffffff' };

function paletteColor(id: string, fallback: string): PaletteColor {
  return NOTE_PALETTE.find((c) => c.id === id) ?? NOTE_PALETTE.find((c) => c.id === fallback)!;
}

/** Turns the saved choice (colour names) into the colours the fretboard draws with. */
export function noteColorsFor(choice: NoteColorChoice): NoteColors {
  return {
    plain: PLAIN,
    root: paletteColor(choice.root, DEFAULT_NOTE_CHOICE.root),
    scale: paletteColor(choice.scale, DEFAULT_NOTE_CHOICE.scale),
    blue: paletteColor(choice.blue, DEFAULT_NOTE_CHOICE.blue),
  };
}

export const DEFAULT_NOTE_COLORS = noteColorsFor(DEFAULT_NOTE_CHOICE);
