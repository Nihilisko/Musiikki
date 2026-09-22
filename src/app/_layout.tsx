import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import InstrumentButton from '../components/InstrumentButton';
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

// The whole app is one stack: choose instrument -> choose tuning -> menu -> topic screens.
export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <InstrumentProvider>
        <StatusBar style="light" />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="choose-instrument" options={{ title: 'Choose instrument' }} />
          <Stack.Screen name="choose-tuning" options={{ title: 'Choose tuning' }} />
          <Stack.Screen
            name="home"
            options={{ title: '', headerLeft: () => <InstrumentButton /> }}
          />
          <Stack.Screen name="scales" options={{ title: 'Scales & arpeggios' }} />
        </Stack>
      </InstrumentProvider>
    </ThemeProvider>
  );
}
