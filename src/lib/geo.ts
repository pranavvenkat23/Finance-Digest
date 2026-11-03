/**
 * Lightweight, fully-offline geography helpers for the "What Came Back" map.
 *
 * We only know awards at ZIP precision, so we center the map on a bundled ZIP3
 * (first-three-digit) centroid, accurate to the user's general area for any US
 * ZIP, with no runtime geocoding dependency. Individual award pins are placed at
 * their own ZIP's centroid with a small deterministic offset so co-located
 * awards are individually tappable. Positions are approximate by design.
 */

import zip3centroids from '@/data/zip3-centroids.json';

const CENTROIDS = zip3centroids as unknown as Record<string, [number, number]>;

export type LatLng = { latitude: number; longitude: number };
export type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };

/** Approximate centroid for a 5-digit ZIP via its 3-digit prefix. */
export function zipCentroid(zip: string): LatLng | null {
  const prefix = zip.slice(0, 3);
  const hit = CENTROIDS[prefix];
  if (!hit) return null;
  return { latitude: hit[0], longitude: hit[1] };
}

/** Deterministic small offset from a string seed (so pins don't stack exactly). */
export function jitter(base: LatLng, seed: string, radiusDeg = 0.035): LatLng {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Two independent pseudo-random components in [-1, 1].
  const a = ((h & 0xffff) / 0xffff) * 2 - 1;
  const b = (((h >>> 16) & 0xffff) / 0xffff) * 2 - 1;
  return {
    latitude: base.latitude + a * radiusDeg,
    longitude: base.longitude + b * radiusDeg,
  };
}

/** A map region that comfortably frames a set of points. */
export function regionForPoints(points: LatLng[], fallback: LatLng): Region {
  if (points.length === 0) {
    return { ...fallback, latitudeDelta: 0.4, longitudeDelta: 0.4 };
  }
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of points) {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  }
  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max(0.08, (maxLat - minLat) * 1.5);
  const longitudeDelta = Math.max(0.08, (maxLng - minLng) * 1.5);
  return { latitude, longitude, latitudeDelta, longitudeDelta };
}
