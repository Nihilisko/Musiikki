import * as ScreenOrientation from 'expo-screen-orientation';

// The app is used upright, except the practice view, which turns sideways to fit the whole neck.
// Turning can fail (e.g. in a desktop browser); the app then simply stays as it is.

export function lockPortrait() {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}

export function lockLandscape() {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
}
