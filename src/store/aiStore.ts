/**
 * Stores the user's free Groq API key on-device (AsyncStorage). The key powers
 * the News summaries, the Stocks explainers, and the FinAI assistant. Nothing is
 * paid; the user creates a free key once. An EXPO_PUBLIC_GROQ_API_KEY env value
 * is used as a default if present (e.g. set by the developer).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { STORAGE_KEYS } from '@/lib/constants';

// Embedded key from the build (.env). Empty string is treated as "no key".
const ENV_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || null;

type AiStore = {
  apiKey: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setKey: (key: string) => Promise<void>;
  clearKey: () => Promise<void>;
};

export const useAiStore = create<AiStore>((set) => ({
  apiKey: ENV_KEY,
  hydrated: false,

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.groqKey);
      if (stored) set({ apiKey: stored });
    } catch {
      // ignore; env key (if any) still applies
    } finally {
      set({ hydrated: true });
    }
  },

  setKey: async (key) => {
    const trimmed = key.trim();
    set({ apiKey: trimmed || null });
    try {
      if (trimmed) await AsyncStorage.setItem(STORAGE_KEYS.groqKey, trimmed);
      else await AsyncStorage.removeItem(STORAGE_KEYS.groqKey);
    } catch {
      // best effort
    }
  },

  clearKey: async () => {
    set({ apiKey: ENV_KEY });
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.groqKey);
    } catch {
      // ignore
    }
  },
}));

/** Read the current key without subscribing (for non-React API code). */
export function currentGroqKey(): string | null {
  return useAiStore.getState().apiKey;
}
