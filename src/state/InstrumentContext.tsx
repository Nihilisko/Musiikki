import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { INSTRUMENTS, type Instrument, type Tuning } from '../music/instruments';
import { loadJson, saveJson } from './storage';

type InstrumentState = {
  instrument: Instrument;
  tuning: Tuning;
  instrumentIndex: number;
  tuningIndex: number;
  /** False until the saved choice has been read from the phone. */
  loaded: boolean;
  /** True when the user has picked an instrument and tuning at least once. */
  hasSavedChoice: boolean;
  selectInstrument: (index: number) => void;
  selectTuning: (index: number) => void;
};

/** What is saved on the phone. Names instead of list positions, so the
 *  saved choice still works if instruments or tunings are reordered. */
type SavedChoice = {
  instrumentId: string;
  tuningName: string;
};

const STORAGE_KEY = 'instrument-choice';

const InstrumentContext = createContext<InstrumentState | null>(null);

/** Holds the chosen instrument and tuning so every screen can read them. */
export function InstrumentProvider({ children }: { children: ReactNode }) {
  const [instrumentIndex, setInstrumentIndex] = useState(0);
  const [tuningIndex, setTuningIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [hasSavedChoice, setHasSavedChoice] = useState(false);

  // Read the saved choice once, when the app starts.
  useEffect(() => {
    loadJson<SavedChoice>(STORAGE_KEY).then((saved) => {
      if (saved) {
        const i = INSTRUMENTS.findIndex((item) => item.id === saved.instrumentId);
        const t = i >= 0 ? INSTRUMENTS[i].tunings.findIndex((x) => x.name === saved.tuningName) : -1;
        if (i >= 0 && t >= 0) {
          setInstrumentIndex(i);
          setTuningIndex(t);
          setHasSavedChoice(true);
        }
      }
      setLoaded(true);
    });
  }, []);

  function selectInstrument(index: number) {
    setInstrumentIndex(index);
    setTuningIndex(0); // every instrument has different tunings
  }

  // Choosing a tuning completes the choice, so that is when it is saved.
  function selectTuning(index: number) {
    setTuningIndex(index);
    setHasSavedChoice(true);
    const instrument = INSTRUMENTS[instrumentIndex];
    saveJson(STORAGE_KEY, {
      instrumentId: instrument.id,
      tuningName: instrument.tunings[index].name,
    } satisfies SavedChoice);
  }

  const instrument = INSTRUMENTS[instrumentIndex];
  const value: InstrumentState = {
    instrument,
    tuning: instrument.tunings[tuningIndex],
    instrumentIndex,
    tuningIndex,
    loaded,
    hasSavedChoice,
    selectInstrument,
    selectTuning,
  };

  return <InstrumentContext.Provider value={value}>{children}</InstrumentContext.Provider>;
}

export function useInstrument(): InstrumentState {
  const state = useContext(InstrumentContext);
  if (!state) {
    throw new Error('useInstrument must be used inside InstrumentProvider');
  }
  return state;
}
