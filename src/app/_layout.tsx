import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { InstrumentProvider } from '../state/InstrumentContext';
import { colors } from '../theme/colors';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    border: colors.border,
    primary: colors.accent,
    text: colors.text,
  },
};

// Root of the app: the tab bar, plus the instrument picker that slides up over it.
export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <InstrumentProvider>
        <StatusBar style="light" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="instrument"
            options={{ title: 'Instrument', presentation: 'modal' }}
          />
        </Stack>
      </InstrumentProvider>
    </ThemeProvider>
  );
}
