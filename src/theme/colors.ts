// App colours, by role. The dark and light themes have the same roles with different values,
// so a screen asks for "the text colour" and gets the right one for the current theme.

export type Colors = {
  /** Screen background. */
  background: string;
  /** Buttons, cards and other raised surfaces. */
  surface: string;
  border: string;
  text: string;
  /** Secondary text: labels, hints. */
  textMuted: string;
  /** Fill for selected buttons and highlights (yellow). */
  accent: string;
  /** Text or icons in the accent colour on a normal surface; darker in the light theme to stay readable. */
  accentText: string;
  /** Text on top of an accent fill. */
  onAccent: string;
};

export const darkColors: Colors = {
  background: '#141518',
  surface: '#1f2126',
  border: '#2a2d31',
  text: '#ffffff',
  textMuted: '#9aa0a6',
  accent: '#f0b429',
  accentText: '#f0b429',
  onAccent: '#1a1a1a',
};

export const lightColors: Colors = {
  background: '#f3f4f6',
  surface: '#ffffff',
  border: '#dde0e5',
  text: '#15171a',
  textMuted: '#5f6670',
  accent: '#f0b429',
  accentText: '#a86f00',
  onAccent: '#1a1a1a',
};

// Note colours on the fretboard, by role. They are the same in both themes.
// Settings will let the user change these later.
export const noteColors = {
  /** Notes when no scale is chosen. */
  plain: { background: '#1e1e1e', text: '#ffffff' },
  root: { background: '#d93a3a', text: '#ffffff' },
  scale: { background: '#2e9d57', text: '#ffffff' },
  blue: { background: '#1e7be0', text: '#ffffff' },
};
