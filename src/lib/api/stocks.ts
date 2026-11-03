/**
 * Stock and index quotes via key-free Yahoo Finance endpoints. No signup, no
 * payment. Used by the Stocks tab for major indices and the user's watchlist.
 */

import { YAHOO_CHART_BASE, YAHOO_SEARCH_BASE } from '@/lib/constants';

export type Quote = {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  currency: string;
};

export type SearchHit = { symbol: string; name: string; exchange: string; type: string };

export const MARKET_INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'Nasdaq Composite' },
  { symbol: '^DJI', name: 'Dow Jones' },
] as const;

const TIMEOUT_MS = 10000;
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (YourReceipt finance app)' };

type ChartMeta = {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  currency?: string;
};

/** Fetch a single quote. Returns null on failure (caller filters). */
export async function fetchQuote(symbol: string, fallbackName?: string): Promise<Quote | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { signal: controller.signal, headers: HEADERS });
    if (!res.ok) return null;
    const json = (await res.json()) as { chart?: { result?: { meta?: ChartMeta }[] } };
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta || meta.regularMarketPrice == null) return null;
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prev;
    return {
      symbol: meta.symbol ?? symbol,
      name: fallbackName ?? meta.longName ?? meta.shortName ?? symbol,
      price,
      previousClose: prev,
      change,
      changePct: prev ? change / prev : 0,
      currency: meta.currency ?? 'USD',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch many quotes concurrently, preserving order, dropping failures. */
export async function fetchQuotes(
  entries: { symbol: string; name?: string }[],
): Promise<Quote[]> {
  const results = await Promise.all(entries.map((e) => fetchQuote(e.symbol, e.name)));
  return results.filter((q): q is Quote => q !== null);
}

/** Search for a ticker by name or symbol. */
export async function searchSymbols(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${YAHOO_SEARCH_BASE}?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    const res = await fetch(url, { signal: controller.signal, headers: HEADERS });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      quotes?: { symbol?: string; shortname?: string; longname?: string; exchDisp?: string; quoteType?: string }[];
    };
    return (json.quotes ?? [])
      .filter((h) => h.symbol && (h.quoteType === 'EQUITY' || h.quoteType === 'ETF' || h.quoteType === 'INDEX'))
      .map((h) => ({
        symbol: h.symbol as string,
        name: h.longname ?? h.shortname ?? (h.symbol as string),
        exchange: h.exchDisp ?? '',
        type: h.quoteType ?? '',
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
