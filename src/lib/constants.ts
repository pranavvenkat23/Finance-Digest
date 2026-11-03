/**
 * Central constants for "Finance Digest".
 *
 * Keep the app name, accent, data years, and API base URLs here so a rebrand or
 * data refresh is a one-file change (see plan: "Centralize constants").
 */

/** App name, change here to rebrand everywhere. */
export const APP_NAME = 'Finance Digest';

export const APP_TAGLINE = 'See where your federal taxes actually go.';

/** Tax year whose brackets/standard deductions are bundled in data/tax-brackets.json. */
export const TAX_YEAR = 2025;

/** Federal fiscal year of the outlays snapshot in data/federal-outlays-snapshot.json. */
export const FISCAL_YEAR = 2025;

/** USAspending live API (only used by "What Came Back"). */
export const USASPENDING_API_BASE = 'https://api.usaspending.gov';

/** Treasury Fiscal Data API, cross-check source for outlays (used by refresh script). */
export const TREASURY_FISCAL_API_BASE =
  'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';

/** Groq AI (OpenAI-compatible). User supplies a free API key; nothing is paid. */
export const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
/** Default model (smarter) and fast fallback model. */
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_MODEL_FAST = 'llama-3.1-8b-instant';
/** Where users create a free Groq API key. */
export const GROQ_KEYS_URL = 'https://console.groq.com/keys';

/**
 * Perigon news API (primary news source). The key is read from the environment
 * at build time; RSS feeds below remain as an automatic fallback.
 */
export const PERIGON_API_BASE = 'https://api.perigon.io/v1/all';
export const PERIGON_API_KEY = process.env.EXPO_PUBLIC_PERIGON_API_KEY ?? '';

/** Free, key-free finance news RSS feeds (fallback when Perigon is unavailable). */
export const NEWS_FEEDS = [
  { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
  { name: 'CNBC Finance', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html' },
  { name: 'CNBC Economy', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html' },
] as const;

/** Key-free Yahoo Finance endpoints for the Stocks tab. */
export const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
export const YAHOO_SEARCH_BASE = 'https://query1.finance.yahoo.com/v1/finance/search';

/** AsyncStorage keys. */
export const STORAGE_KEYS = {
  userInput: 'yr.userInput.v1',
  awardCache: (zip: string) => `yr.awards.${zip}.v1`,
  groqKey: 'yr.groqKey.v1',
  watchlist: 'yr.watchlist.v1',
  newsCache: 'yr.news.v1',
} as const;

/** Time-to-live for cached USAspending award responses. */
export const AWARD_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/** 2025 payroll tax rates (employee share). Earmarked, shown separately from income tax. */
export const PAYROLL = {
  socialSecurityRate: 0.062,
  /** Social Security wage base for 2025 (SSA). */
  socialSecurityWageBase: 176_100,
  medicareRate: 0.0145,
  socialSecuritySource: 'https://www.ssa.gov/oact/cola/cbb.html',
  medicareSource: 'https://www.irs.gov/taxtopics/tc751',
} as const;

/** Always-visible honesty note for the What-If simulator. */
export const WHATIF_DISCLAIMER =
  'This is a budgeting what-if, not an economic forecast.';

/** Educational disclaimer shown on the Receipt and Sources screens. */
export const EDU_DISCLAIMER =
  'Educational estimate using federal data, not tax advice and not an official filing.';
