import AsyncStorage from '@react-native-async-storage/async-storage';

// Small helpers for saving settings on the phone.
// Values are stored as JSON text. Storage can fail (e.g. phone storage full),
// so failures are logged and the app carries on with defaults.

export async function loadJson<T>(key: string): Promise<T | null> {
  try {
    const text = await AsyncStorage.getItem(key);
    return text === null ? null : (JSON.parse(text) as T);
  } catch (error) {
    console.warn(`Could not load "${key}"`, error);
    return null;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save "${key}"`, error);
  }
}
