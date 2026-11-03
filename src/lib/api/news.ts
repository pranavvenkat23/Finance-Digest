/**
 * Finance news via free, key-free RSS feeds. Parsed with a small regex reader
 * (no native XML dependency), cached on device, with graceful fallback so the
 * feed is never empty when offline after a first successful load.
 */

import { NEWS_FEEDS, STORAGE_KEYS } from '@/lib/constants';
import { getCached, setCached } from '@/lib/cache';

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: number | null;
  summary: string;
};

const TTL_MS = 1000 * 60 * 30; // 30 minutes
const PER_FEED = 12;
const MAX_ITEMS = 30;
const FETCH_TIMEOUT_MS = 12000;

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

function stripHtml(s: string): string {
  const text = decodeEntities(stripCdata(s).replace(/<[^>]+>/g, ' '));
  // Normalize em dashes out of external text to honor the app's no-em-dash rule.
  return text.replace(/\s*[\u2014\u2013]\s*/g, ', ').replace(/\s+/g, ' ').trim();
}

function tagContent(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decodeEntities(stripCdata(m[1])).trim() : null;
}

function parseFeed(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks.slice(0, PER_FEED)) {
    const title = tagContent(block, 'title');
    let link = tagContent(block, 'link');
    // Some feeds use <link/> with the URL in an attribute or as trailing text.
    if (!link) {
      const m = block.match(/<link[^>]*>([^<]+)/i);
      link = m ? m[1].trim() : null;
    }
    if (!title || !link) continue;
    const pub = tagContent(block, 'pubDate');
    const desc = tagContent(block, 'description') ?? '';
    items.push({
      id: link,
      title: stripHtml(title),
      link: link.trim(),
      source,
      publishedAt: pub ? Date.parse(pub) || null : null,
      summary: stripHtml(desc).slice(0, 280),
    });
  }
  return items;
}

async function fetchFeed(url: string, name: string): Promise<NewsItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (YourReceipt finance app)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, name);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export type NewsResult = { items: NewsItem[]; source: 'live' | 'cache'; empty: boolean };

/** Fetch and merge finance news. Cache fresh results; fall back to cache on failure. */
export async function fetchNews(opts?: { force?: boolean }): Promise<NewsResult> {
  if (!opts?.force) {
    const cached = await getCached<NewsItem[]>(STORAGE_KEYS.newsCache);
    if (cached && cached.length > 0) return { items: cached, source: 'cache', empty: false };
  }

  const results = await Promise.all(NEWS_FEEDS.map((f) => fetchFeed(f.url, f.name)));
  const merged = results.flat();

  // De-duplicate by link and sort newest first.
  const seen = new Set<string>();
  const unique = merged.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
  unique.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  const items = unique.slice(0, MAX_ITEMS);

  if (items.length > 0) {
    await setCached(STORAGE_KEYS.newsCache, items, TTL_MS);
    return { items, source: 'live', empty: false };
  }

  // Live failed; fall back to any cache even if stale.
  const stale = await getCached<NewsItem[]>(STORAGE_KEYS.newsCache);
  if (stale && stale.length > 0) return { items: stale, source: 'cache', empty: false };
  return { items: [], source: 'live', empty: true };
}
