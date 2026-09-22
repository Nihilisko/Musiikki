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
  /** Fill for selected buttons and highlights: cream in the dark theme, dark brown in the light one. */
  accent: string;
  /** Text or icons in the accent colour on a normal surface; darker in the light theme to stay readable. */
  accentText: string;
  /** Text on top of an accent fill. */
  onAccent: string;
  /** The logo's hot rod red, kept for the main action on a screen (e.g. Lock) so it stands out. */
  brand: string;
  /** Text on top of the brand red. */
  onBrand: string;
};

// Warm neutrals from the logo: dark roasted wood and cream, so the app and the icon match.
export const darkColors: Colors = {
  background: '#15110f',
  surface: '#231c18',
  border: '#382d27',
  text: '#f7efe3',
  textMuted: '#a99b8e',
  accent: '#f1e2c2',
  accentText: '#f1e2c2',
  onAccent: '#1d1512',
  brand: '#d42330',
  onBrand: '#fbf1dc',
};

export const lightColors: Colors = {
  background: '#f6eedf',
  surface: '#fffaf1',
  border: '#e5d7bf',
  text: '#241a15',
  textMuted: '#6f6358',
  accent: '#3a2a22',
  accentText: '#8b4a2b',
  onAccent: '#fbf1dc',
  brand: '#d42330',
  onBrand: '#fbf1dc',
};

// Note colours on the fretboard, by role. They are the same in both themes.
// Settings will let the user change these later.
export const noteColors = {
  /** Notes when no scale is chosen. */
  plain: { background: '#241c18', text: '#ffffff' },
  root: { background: '#d93a3a', text: '#ffffff' },
  scale: { background: '#2e9d57', text: '#ffffff' },
  blue: { background: '#1e7be0', text: '#ffffff' },
};
