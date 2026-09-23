import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Scale } from '../music/scales';
import { loadJson, saveJson } from './storage';

/** A scale the user made: a name and its intervals (0 = root … 11), always starting with 0. */
export type CustomScale = Scale & { id: string };

type CustomScaleState = {
  scales: CustomScale[];
  /** Saves a new scale and returns its id. */
  addScale: (name: string, intervals: number[]) => string;
};

const STORAGE_KEY = 'custom-scales';

const CustomScaleContext = createContext<CustomScaleState | null>(null);

/** Intervals kept tidy: whole numbers 0-11, no repeats, in order, root always included. */
export function cleanIntervals(intervals: number[]): number[] {
  const set = new Set(intervals.filter((i) => Number.isInteger(i) && i >= 0 && i < 12));
  set.add(0);
  return [...set].sort((a, b) => a - b);
}

function isCustomScale(value: unknown): value is CustomScale {
  const s = value as CustomScale;
  return (
    typeof s?.id === 'string' &&
    typeof s.name === 'string' &&
    Array.isArray(s.intervals) &&
    s.intervals.every((i) => Number.isInteger(i))
  );
}

/** Holds the user's own scales and remembers them on the phone. */
export function CustomScaleProvider({ children }: { children: ReactNode }) {
  const [scales, setScales] = useState<CustomScale[]>([]);

  useEffect(() => {
    loadJson<unknown[]>(STORAGE_KEY).then((saved) => {
      if (Array.isArray(saved)) {
        setScales(
          saved
            .filter(isCustomScale)
            .map((s) => ({ ...s, intervals: cleanIntervals(s.intervals) })),
        );
      }
    });
  }, []);

  function save(next: CustomScale[]) {
    setScales(next);
    saveJson(STORAGE_KEY, next);
  }

  function addScale(name: string, intervals: number[]): string {
    // Time plus a random part: unique enough for scales made on one phone.
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    save([...scales, { id, name: name.trim(), intervals: cleanIntervals(intervals) }]);
    return id;
  }

  return (
    <CustomScaleContext.Provider value={{ scales, addScale }}>
      {children}
    </CustomScaleContext.Provider>
  );
}

export function useCustomScales(): CustomScaleState {
  const state = useContext(CustomScaleContext);
  if (!state) {
    throw new Error('useCustomScales must be used inside CustomScaleProvider');
  }
  return state;
}
