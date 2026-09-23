import {
  DarkTheme,
  DefaultTheme,
  router,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import BackButton from '../components/BackButton';
import InstrumentButton from '../components/InstrumentButton';
import { InstrumentProvider } from '../state/InstrumentContext';
import { KeyProvider } from '../state/KeyContext';
import { CustomScaleProvider } from '../state/CustomScaleContext';
import { NoteColorProvider } from '../state/NoteColorContext';
import { WoodProvider } from '../state/WoodContext';
import { lockPortrait } from '../state/orientation';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';

export default function RootLayout() {
  // The app is used upright; only the practice view turns sideways.
  useEffect(lockPortrait, []);

  return (
    <ThemeProvider>
      <InstrumentProvider>
        <KeyProvider>
          <WoodProvider>
            <NoteColorProvider>
              <CustomScaleProvider>
                <AppStack />
              </CustomScaleProvider>
            </NoteColorProvider>
          </WoodProvider>
        </KeyProvider>
      </InstrumentProvider>
    </ThemeProvider>
  );
}

// The whole app is one stack: choose instrument -> choose tuning -> menu -> topic screens.
// It sits inside ThemeProvider so the headers and status bar follow the theme.
function AppStack() {
  const { colors, scheme } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      border: colors.border,
      primary: colors.accent,
      text: colors.text,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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
        <Stack.Screen name="home" options={{ title: '', headerLeft: () => <InstrumentButton /> }} />
        <Stack.Screen
          name="scales"
          options={{
            headerShown: false, // the screen turns sideways and has its own Menu button
            animation: 'slide_from_bottom',
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
        <Stack.Screen
          name="settings"
          options={{ title: 'Settings', headerLeft: () => <BackButton label="Menu" /> }}
        />
        <Stack.Screen
          name="scale-editor"
          options={{
            headerShown: false, // sideways like the scale screen, with its own buttons
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="tuner"
          options={{ title: 'Tuner', headerLeft: () => <BackButton label="Menu" /> }}
        />
        <Stack.Screen
          name="metronome"
          options={{ title: 'Metronome', headerLeft: () => <BackButton label="Menu" /> }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
