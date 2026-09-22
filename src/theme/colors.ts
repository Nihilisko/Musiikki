// App-wide colors, so every screen looks the same.
export const colors = {
  background: '#141518',
  surface: '#1f2126',
  border: '#2a2d31',
  text: '#ffffff',
  textMuted: '#9aa0a6',
  accent: '#f0b429',
};

// Note colours on the fretboard, by role. Settings will let the user change these later.
export const noteColors = {
  /** Notes when no scale is chosen. */
  plain: { background: '#1e1e1e', text: '#ffffff' },
  root: { background: '#f0b429', text: '#1a1a1a' },
  scale: { background: '#111111', text: '#ffffff' },
  blue: { background: '#1e7be0', text: '#ffffff' },
};
