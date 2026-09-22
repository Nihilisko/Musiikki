import { DarkTheme, router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import BackButton from '../components/BackButton';
import InstrumentButton from '../components/InstrumentButton';
import { InstrumentProvider } from '../state/InstrumentContext';
import { KeyProvider } from '../state/KeyContext';
import { lockPortrait } from '../state/orientation';
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
  // The app is used upright; only the practice view turns sideways.
  useEffect(lockPortrait, []);

  return (
    <ThemeProvider value={theme}>
      <InstrumentProvider>
        <KeyProvider>
          <StatusBar style="light" />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="choose-instrument"
              options={{
                title: 'Choose instrument',
                // On the very first start there is nowhere to go back to.
                headerLeft: () => (router.canGoBack() ? <BackButton label="Back" /> : null),
              }}
            />
            <Stack.Screen
              name="choose-tuning"
              options={{ title: 'Choose tuning', headerLeft: () => <BackButton label="Back" /> }}
            />
            <Stack.Screen
              name="home"
              options={{ title: '', headerLeft: () => <InstrumentButton /> }}
            />
            <Stack.Screen
              name="scales"
              options={{
                title: 'Scales & arpeggios',
                headerLeft: () => <BackButton label="Menu" />,
              }}
            />
            <Stack.Screen
              name="circle"
              options={{ title: 'Circle of fifths', headerLeft: () => <BackButton label="Menu" /> }}
            />
            <Stack.Screen
              name="progression"
              options={{
                headerShown: false,
                // Slides up over the circle; its Circle button slides it away again.
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
        </KeyProvider>
      </InstrumentProvider>
    </ThemeProvider>
  );
}
