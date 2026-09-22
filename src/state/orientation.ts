import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

// The app is used upright, except the practice view, which turns sideways to fit the whole neck.
// Turning can fail (e.g. in a desktop browser); the app then simply stays as it is.

export function lockPortrait() {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}

export function lockLandscape() {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
}

/** Turns the screen sideways while the calling screen is open, and upright again after. */
export function useLandscape() {
  useEffect(() => {
    lockLandscape();
    return lockPortrait;
  }, []);
}
