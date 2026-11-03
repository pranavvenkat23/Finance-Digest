/**
 * The user's stock watchlist, persisted on-device. Seeded with a few well-known
 * tickers on first run so the Stocks tab is never empty.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { STORAGE_KEYS } from '@/lib/constants';

export type WatchItem = { symbol: string; name: string };

const DEFAULTS: WatchItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
];

type WatchlistStore = {
  items: WatchItem[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (item: WatchItem) => Promise<void>;
  remove: (symbol: string) => Promise<void>;
};

async function persist(items: WatchItem[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.watchlist, JSON.stringify(items));
  } catch {
    // best effort
  }
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  items: DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.watchlist);
      if (raw) set({ items: JSON.parse(raw) as WatchItem[] });
    } catch {
      // keep defaults
    } finally {
      set({ hydrated: true });
    }
  },

  add: async (item) => {
    const upper = item.symbol.toUpperCase();
    if (get().items.some((i) => i.symbol === upper)) return;
    const items = [...get().items, { ...item, symbol: upper }];
    set({ items });
    await persist(items);
  },

  remove: async (symbol) => {
    const items = get().items.filter((i) => i.symbol !== symbol);
    set({ items });
    await persist(items);
  },
}));
