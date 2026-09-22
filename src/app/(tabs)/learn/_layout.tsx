import { Stack } from 'expo-router';

import InstrumentButton from '../../../components/InstrumentButton';

// Learn tab: a menu that opens topic screens, with the instrument button in the header.
export default function LearnLayout() {
  return (
    <Stack screenOptions={{ headerRight: () => <InstrumentButton /> }}>
      <Stack.Screen name="index" options={{ title: 'Learn' }} />
      <Stack.Screen name="scales" options={{ title: 'Scales' }} />
    </Stack>
  );
}
