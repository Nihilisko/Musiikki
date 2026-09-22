import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { KeyMode } from '../music/circle';
import { loadJson, saveJson } from './storage';

/** A key locked on the circle of fifths: position on the circle (0 = C) and major/minor. */
export type LockedKey = { index: number; mode: KeyMode };

type KeyState = {
  lockedKey: LockedKey | null;
  /** False until the saved key has been read from the phone. */
  loaded: boolean;
  lockKey: (key: LockedKey) => void;
};

const STORAGE_KEY = 'locked-key';

const KeyContext = createContext<KeyState | null>(null);

/** Holds the key locked on the circle of fifths, shared with the rest of the app. */
export function KeyProvider({ children }: { children: ReactNode }) {
  const [lockedKey, setLockedKey] = useState<LockedKey | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadJson<LockedKey>(STORAGE_KEY).then((saved) => {
      if (saved && Number.isInteger(saved.index) && (saved.mode === 'major' || saved.mode === 'minor')) {
        setLockedKey(saved);
      }
      setLoaded(true);
    });
  }, []);

  function lockKey(key: LockedKey) {
    setLockedKey(key);
    saveJson(STORAGE_KEY, key);
  }

  return (
    <KeyContext.Provider value={{ lockedKey, loaded, lockKey }}>{children}</KeyContext.Provider>
  );
}

export function useLockedKey(): KeyState {
  const state = useContext(KeyContext);
  if (!state) {
    throw new Error('useLockedKey must be used inside KeyProvider');
  }
  return state;
}
