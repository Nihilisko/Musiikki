import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { loadJson, saveJson } from '../state/storage';
import { darkColors, lightColors, type Colors } from './colors';

/** What the user picked: follow the phone, or always dark / light. */
export type ThemePreference = 'system' | 'dark' | 'light';

type ThemeState = {
  colors: Colors;
  /** The theme actually in use right now. */
  scheme: 'dark' | 'light';
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = 'theme';

const ThemeContext = createContext<ThemeState | null>(null);

/** Provides the current colours to every screen, and remembers the chosen theme. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const phoneScheme = useColorScheme(); // 'dark', 'light' or null when unknown
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    loadJson<ThemePreference>(STORAGE_KEY).then((saved) => {
      if (saved === 'system' || saved === 'dark' || saved === 'light') {
        setPreferenceState(saved);
      }
    });
  }, []);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    saveJson(STORAGE_KEY, next);
  }

  const scheme = preference === 'system' ? (phoneScheme === 'light' ? 'light' : 'dark') : preference;
  const value = useMemo(
    () => ({
      colors: scheme === 'light' ? lightColors : darkColors,
      scheme,
      preference,
      setPreference,
    }),
    [scheme, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const state = useContext(ThemeContext);
  if (!state) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return state;
}

/**
 * Styles that depend on the theme. Pass a function that builds the styles from colours;
 * they are rebuilt only when the theme changes.
 */
export function useThemedStyles<T>(makeStyles: (colors: Colors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors, makeStyles]);
}
