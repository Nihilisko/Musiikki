import { Redirect } from 'expo-router';

import { useInstrument } from '../state/InstrumentContext';

// Start of the app: go to the menu if an instrument was chosen before,
// otherwise start by choosing one.
export default function Index() {
  const { loaded, hasSavedChoice } = useInstrument();

  if (!loaded) {
    return null; // reading the saved choice takes a moment; show nothing meanwhile
  }
  return <Redirect href={hasSavedChoice ? '/home' : '/choose-instrument'} />;
}
