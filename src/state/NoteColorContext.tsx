import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_NOTE_CHOICE,
  NOTE_PALETTE,
  noteColorsFor,
  type NoteColorChoice,
  type NoteColors,
  type NoteRole,
} from '../theme/noteColors';
import { loadJson, saveJson } from './storage';

type NoteColorState = {
  /** Colour name for each role, e.g. { root: 'red', ... }. */
  choice: NoteColorChoice;
  /** The colours to draw with. */
  noteColors: NoteColors;
  setRoleColor: (role: NoteRole, colorId: string) => void;
  reset: () => void;
};

const STORAGE_KEY = 'note-colors';

const NoteColorContext = createContext<NoteColorState | null>(null);

/** A saved choice is only used if every role has a known colour and no two roles share one. */
function isValid(choice: NoteColorChoice | null): choice is NoteColorChoice {
  if (!choice) return false;
  const ids = [choice.root, choice.scale, choice.blue];
  return (
    ids.every((id) => NOTE_PALETTE.some((c) => c.id === id)) && new Set(ids).size === ids.length
  );
}

/** Holds the note colours picked in Settings, one choice for the whole app, and remembers them. */
export function NoteColorProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<NoteColorChoice>(DEFAULT_NOTE_CHOICE);

  useEffect(() => {
    loadJson<NoteColorChoice>(STORAGE_KEY).then((saved) => {
      if (isValid(saved)) setChoice(saved);
    });
  }, []);

  function save(next: NoteColorChoice) {
    setChoice(next);
    saveJson(STORAGE_KEY, next);
  }

  function setRoleColor(role: NoteRole, colorId: string) {
    // Two roles can't share a colour, or the notes couldn't be told apart.
    const takenBy = (Object.keys(choice) as NoteRole[]).find(
      (r) => r !== role && choice[r] === colorId,
    );
    if (takenBy) return;
    save({ ...choice, [role]: colorId });
  }

  const noteColors = useMemo(() => noteColorsFor(choice), [choice]);

  return (
    <NoteColorContext.Provider
      value={{ choice, noteColors, setRoleColor, reset: () => save(DEFAULT_NOTE_CHOICE) }}
    >
      {children}
    </NoteColorContext.Provider>
  );
}

export function useNoteColors(): NoteColorState {
  const state = useContext(NoteColorContext);
  if (!state) {
    throw new Error('useNoteColors must be used inside NoteColorProvider');
  }
  return state;
}
