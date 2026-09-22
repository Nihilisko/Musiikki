import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_WOOD, woodById, type Wood } from '../theme/woods';
import { loadJson, saveJson } from './storage';

type WoodState = {
  wood: Wood;
  setWood: (id: string) => void;
};

const STORAGE_KEY = 'wood';

const WoodContext = createContext<WoodState | null>(null);

/** Holds the fretboard wood, one choice for the whole app, and remembers it. */
export function WoodProvider({ children }: { children: ReactNode }) {
  const [wood, setWoodState] = useState<Wood>(DEFAULT_WOOD);

  useEffect(() => {
    loadJson<string>(STORAGE_KEY).then((saved) => {
      if (saved) setWoodState(woodById(saved));
    });
  }, []);

  function setWood(id: string) {
    setWoodState(woodById(id));
    saveJson(STORAGE_KEY, id);
  }

  return <WoodContext.Provider value={{ wood, setWood }}>{children}</WoodContext.Provider>;
}

export function useWood(): WoodState {
  const state = useContext(WoodContext);
  if (!state) {
    throw new Error('useWood must be used inside WoodProvider');
  }
  return state;
}
