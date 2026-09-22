import { Redirect } from 'expo-router';

// Start of the app. For now it always starts by choosing an instrument;
// later it will skip straight to the menu when a choice has been saved.
export default function Index() {
  return <Redirect href="/choose-instrument" />;
}
