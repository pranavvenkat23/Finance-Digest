/**
 * USAspending.gov client for "What Came Back", real federal awards whose work
 * is performed in the user's ZIP. Confirmed against the live API:
 *
 *   POST /api/v2/search/spending_by_award/
 *   body: { filters: { award_type_codes:[...] (required),
 *                      place_of_performance_locations:[{country:"USA", zip}],
 *                      time_period:[{start_date,end_date}] },
 *           fields:[...] (required), page, limit, sort, order }
 *
 * Contracts and assistance (grant) award-type codes can't be mixed in one
 * request, so we issue two parallel calls and merge. Responses are cached per
 * ZIP (TTL); on failure or empty we fall back to committed sample data for demo
 * ZIPs so the map is never blank. Every award links to its live source record.
 */

import { AWARD_CACHE_TTL_MS, STORAGE_KEYS, USASPENDING_API_BASE } from '@/lib/constants';
import { getCached, setCached } from '@/lib/cache';
import { jitter, zipCentroid, type LatLng } from '@/lib/geo';
import sampleData from '@/data/sample-awards.json';

export type Award = {
  id: string;
  /** generated_internal_id, used to build the source-record URL. */
  internalId: string;
  recipient: string;
  amount: number;
  agency: string;
  zip5: string;
  state: string;
  type: 'contract' | 'grant';
  lat: number;
  lng: number;
};

export type AwardSource = 'live' | 'cache' | 'sample';

export type AwardResult = {
  awards: Award[];
  source: AwardSource;
  /** True when we couldn't get live data and there's no sample for this ZIP. */
  empty: boolean;
  centroid: LatLng | null;
};

const CONTRACT_CODES = ['A', 'B', 'C', 'D'];
const GRANT_CODES = ['02', '03', '04', '05'];
const FIELDS = [
  'Award ID',
  'Recipient Name',
  'Award Amount',
  'Awarding Agency',
  'Place of Performance Zip5',
  'Place of Performance State Code',
];
const REQUEST_TIMEOUT_MS = 12000;
const MAX_AWARDS = 30;

/** Public URL for an award's source record on USAspending.gov. */
export function awardSourceUrl(award: Award): string {
  return `https://www.usaspending.gov/award/${encodeURIComponent(award.internalId)}`;
}

type RawAward = {
  'Award ID': string;
  'Recipient Name': string;
  'Award Amount': number | null;
  'Awarding Agency': string;
  'Place of Performance Zip5': string | null;
  'Place of Performance State Code': string | null;
  generated_internal_id: string;
};

async function fetchByType(zip: string, codes: string[], type: Award['type'], base: LatLng): Promise<Award[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${USASPENDING_API_BASE}/api/v2/search/spending_by_award/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        filters: {
          award_type_codes: codes,
          place_of_performance_locations: [{ country: 'USA', zip }],
          time_period: [{ start_date: '2023-10-01', end_date: '2025-09-30' }],
        },
        fields: FIELDS,
        page: 1,
        limit: 25,
        sort: 'Award Amount',
        order: 'desc',
      }),
    });
    if (!res.ok) throw new Error(`USAspending ${res.status}`);
    const json = (await res.json()) as { results: RawAward[] };
    return (json.results ?? [])
      .filter((r) => (r['Award Amount'] ?? 0) > 0)
      .map((r) => {
        const pos = jitter(base, r.generated_internal_id);
        return {
          id: r['Award ID'],
          internalId: r.generated_internal_id,
          recipient: r['Recipient Name'],
          amount: r['Award Amount'] ?? 0,
          agency: r['Awarding Agency'],
          zip5: r['Place of Performance Zip5'] ?? zip,
          state: r['Place of Performance State Code'] ?? '',
          type,
          lat: pos.latitude,
          lng: pos.longitude,
        };
      });
  } finally {
    clearTimeout(timer);
  }
}

type SampleShape = {
  zips: Record<string, { centroid: [number, number]; awards: Omit<Award, never>[] }>;
};

/** Committed sample for demo ZIPs, or null if none exists for this ZIP. */
export function sampleForZip(zip: string): AwardResult | null {
  const entry = (sampleData as unknown as SampleShape).zips[zip];
  if (!entry) return null;
  return {
    awards: entry.awards as Award[],
    source: 'sample',
    empty: false,
    centroid: { latitude: entry.centroid[0], longitude: entry.centroid[1] },
  };
}

/**
 * Fetch awards for a ZIP. Strategy: fresh cache → live API (two calls merged) →
 * committed sample → empty. Never throws; the screen renders by `source`/`empty`.
 */
export async function fetchAwards(zip: string, opts?: { force?: boolean }): Promise<AwardResult> {
  const cacheKey = STORAGE_KEYS.awardCache(zip);
  const centroid = zipCentroid(zip);

  if (!opts?.force) {
    const cached = await getCached<Award[]>(cacheKey);
    if (cached && cached.length > 0) {
      return { awards: cached, source: 'cache', empty: false, centroid };
    }
  }

  if (centroid) {
    try {
      const [contracts, grants] = await Promise.allSettled([
        fetchByType(zip, CONTRACT_CODES, 'contract', centroid),
        fetchByType(zip, GRANT_CODES, 'grant', centroid),
      ]);
      const merged = [
        ...(contracts.status === 'fulfilled' ? contracts.value : []),
        ...(grants.status === 'fulfilled' ? grants.value : []),
      ]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, MAX_AWARDS);

      // Both calls failing is a network failure, not a true "no awards" result.
      const bothFailed = contracts.status === 'rejected' && grants.status === 'rejected';
      if (!bothFailed && merged.length > 0) {
        await setCached(cacheKey, merged, AWARD_CACHE_TTL_MS);
        return { awards: merged, source: 'live', empty: false, centroid };
      }
    } catch {
      // fall through to sample / empty
    }
  }

  // Demo-safety fallback so the map is never blank for example ZIPs.
  const sample = sampleForZip(zip);
  if (sample) return sample;

  return { awards: [], source: 'live', empty: true, centroid };
}
