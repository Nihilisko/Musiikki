import { Redirect } from 'expo-router';

// The app opens on the Learn tab.
export default function Index() {
  return <Redirect href="/learn" />;
}
