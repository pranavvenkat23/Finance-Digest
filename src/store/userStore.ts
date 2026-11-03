/**
 * User input store: income, filing status, ZIP.
 *
 * Persisted to AsyncStorage so the last entry is remembered. No accounts, no
 * backend, all user data stays on device (makes the privacy label trivial).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { STORAGE_KEYS } from '@/lib/constants';
import { type FilingStatus } from '@/lib/tax';

// Re-export so screens can keep importing filing-status types/labels from the store.
export { FILING_STATUS_LABELS, type FilingStatus } from '@/lib/tax';

export type UserInput = {
  /** Gross annual income in dollars. */
  income: number;
  filingStatus: FilingStatus;
  /** 5-digit ZIP code. */
  zip: string;
};

type UserStore = {
  input: UserInput | null;
  /** True once we've attempted to load persisted input (gate waits on this). */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setInput: (input: UserInput) => Promise<void>;
  clear: () => Promise<void>;
};

export const useUserStore = create<UserStore>((set) => ({
  input: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.userInput);
      if (raw) {
        const parsed = JSON.parse(raw) as UserInput;
        if (isValidInput(parsed)) {
          set({ input: parsed });
        }
      }
    } catch {
      // Corrupt/unavailable storage should never block the app, start fresh.
    } finally {
      set({ hydrated: true });
    }
  },

  setInput: async (input) => {
    set({ input });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.userInput, JSON.stringify(input));
    } catch {
      // Persisting is best-effort; in-memory state still works for this session.
    }
  },

  clear: async () => {
    set({ input: null });
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.userInput);
    } catch {
      // ignore
    }
  },
}));

function isValidInput(value: unknown): value is UserInput {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.income === 'number' &&
    Number.isFinite(v.income) &&
    typeof v.zip === 'string' &&
    /^\d{5}$/.test(v.zip) &&
    (v.filingStatus === 'single' ||
      v.filingStatus === 'married_joint' ||
      v.filingStatus === 'head_of_household')
  );
}
