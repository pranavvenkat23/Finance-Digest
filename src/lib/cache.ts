/**
 * Tiny TTL cache over AsyncStorage. Used to cache USAspending award responses
 * per ZIP so repeated visits are instant and resilient to flaky networks.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

type Envelope<T> = { ts: number; ttl: number; data: T };

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope<T>;
    if (Date.now() - env.ts > env.ttl) return null; // expired
    return env.data;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    const env: Envelope<T> = { ts: Date.now(), ttl, data };
    await AsyncStorage.setItem(key, JSON.stringify(env));
  } catch {
    // Best-effort cache; ignore write failures.
  }
}
