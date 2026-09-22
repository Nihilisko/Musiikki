import { createContext, useContext, useState, type ReactNode } from 'react';

import { INSTRUMENTS, type Instrument, type Tuning } from '../music/instruments';

type InstrumentState = {
  instrument: Instrument;
  tuning: Tuning;
  instrumentIndex: number;
  tuningIndex: number;
  selectInstrument: (index: number) => void;
  selectTuning: (index: number) => void;
};

const InstrumentContext = createContext<InstrumentState | null>(null);

/** Holds the chosen instrument and tuning so every screen can read them. */
export function InstrumentProvider({ children }: { children: ReactNode }) {
  const [instrumentIndex, setInstrumentIndex] = useState(0);
  const [tuningIndex, setTuningIndex] = useState(0);

  function selectInstrument(index: number) {
    setInstrumentIndex(index);
    setTuningIndex(0); // every instrument has different tunings
  }

  const instrument = INSTRUMENTS[instrumentIndex];
  const value: InstrumentState = {
    instrument,
    tuning: instrument.tunings[tuningIndex],
    instrumentIndex,
    tuningIndex,
    selectInstrument,
    selectTuning: setTuningIndex,
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
