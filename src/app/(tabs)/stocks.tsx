/**
 * Stocks (tab) - major indices and the user's watchlist with live, key-free
 * Yahoo quotes, plus AI explainers tying moves to plain-language and tax impact.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectAI } from '@/components/ai/ConnectAI';
import { StockCard } from '@/components/stocks/StockCard';
import { Text } from '@/components/ui/Text';
import { userTaxContext } from '@/lib/ai/prompts';
import {
  fetchQuotes,
  MARKET_INDICES,
  searchSymbols,
  type Quote,
  type SearchHit,
} from '@/lib/api/stocks';
import { formatSignedPercent } from '@/lib/format';
import { computeStateLocal } from '@/lib/stateTax';
import { federalIncomeTax } from '@/lib/tax';
import { Radius, Space, useTheme } from '@/lib/theme';
import { useAiStore } from '@/store/aiStore';
import { useUserStore } from '@/store/userStore';
import { useWatchlistStore } from '@/store/watchlistStore';

export default function StocksScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const input = useUserStore((s) => s.input);
  const apiKey = useAiStore((s) => s.apiKey);
  const watchlist = useWatchlistStore((s) => s.items);
  const addWatch = useWatchlistStore((s) => s.add);
  const removeWatch = useWatchlistStore((s) => s.remove);

  const [indices, setIndices] = useState<Quote[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    const [idx, wl] = await Promise.all([
      fetchQuotes(MARKET_INDICES.map((i) => ({ symbol: i.symbol, name: i.name }))),
      fetchQuotes(watchlist.map((w) => ({ symbol: w.symbol, name: w.name }))),
    ]);
    setIndices(idx);
    setQuotes(wl);
    setLoading(false);
    setRefreshing(false);
  }, [watchlist]);

  useEffect(() => {
    void load();
  }, [load]);

  const userContext = useMemo(() => {
    if (!input) return '';
    const fed = federalIncomeTax(input.income, input.filingStatus);
    const sl = computeStateLocal(input.income, input.filingStatus, input.zip);
    return userTaxContext({ income: input.income, state: sl.state, federalIncomeTax: fed, stateLocalTotal: sl.total });
  }, [input]);

  const runSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    const hits = await searchSymbols(q);
    setResults(hits.slice(0, 6));
    setSearching(false);
  };

  const add = async (hit: SearchHit) => {
    await addWatch({ symbol: hit.symbol, name: hit.name });
    setQuery('');
    setResults([]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.appBg }}
      contentContainerStyle={{ paddingHorizontal: Space.xl, paddingTop: insets.top + Space.lg, paddingBottom: insets.bottom + Space.xxxl }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={theme.colors.accent}
        />
      }>
      <Text variant="title">Stocks</Text>
      <Text variant="body" color="inkSecondary" style={{ marginTop: Space.xs }}>
        Live market data, with AI that explains moves and the tax angle in plain language.
      </Text>

      {/* Indices */}
      <Text variant="label" color="inkSecondary" style={{ marginTop: Space.xl, marginBottom: Space.sm }}>
        MARKETS TODAY
      </Text>
      <View style={{ flexDirection: 'row', gap: Space.sm }}>
        {indices.map((q) => {
          const up = q.change >= 0;
          return (
            <View
              key={q.symbol}
              style={{ flex: 1, padding: Space.md, borderRadius: Radius.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line }}>
              <Text variant="caption" color="inkMuted" numberOfLines={1}>
                {q.name}
              </Text>
              <Text variant="bodyStrong" mono style={{ marginTop: 2 }}>
                {q.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
              <Text variant="caption" mono style={{ color: up ? theme.colors.positive : theme.colors.accent }}>
                {up ? '▲' : '▼'} {formatSignedPercent(q.changePct)}
              </Text>
            </View>
          );
        })}
        {indices.length === 0 && !loading && (
          <Text variant="caption" color="inkMuted">
            Market data unavailable right now.
          </Text>
        )}
      </View>

      {/* Add ticker */}
      <Text variant="label" color="inkSecondary" style={{ marginTop: Space.xl, marginBottom: Space.sm }}>
        ADD TO WATCHLIST
      </Text>
      <TextInput
        value={query}
        onChangeText={runSearch}
        placeholder="Search a ticker or company (e.g. TSLA)"
        placeholderTextColor={theme.colors.inkMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.line,
          borderWidth: 1,
          borderRadius: Radius.md,
          paddingHorizontal: Space.lg,
          paddingVertical: Space.md,
          color: theme.colors.ink,
          fontSize: 16,
        }}
        accessibilityLabel="Search for a stock to add"
      />
      {searching && (
        <Text variant="caption" color="inkMuted" style={{ marginTop: Space.sm }}>
          Searching...
        </Text>
      )}
      {results.map((hit) => (
        <Pressable
          key={hit.symbol}
          onPress={() => add(hit)}
          accessibilityRole="button"
          accessibilityLabel={`Add ${hit.symbol}, ${hit.name}`}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Space.md, borderBottomWidth: 1, borderBottomColor: theme.colors.line }}>
          <View style={{ flex: 1, marginRight: Space.sm }}>
            <Text variant="bodyStrong">{hit.symbol}</Text>
            <Text variant="caption" color="inkMuted" numberOfLines={1}>
              {hit.name} {hit.exchange ? `· ${hit.exchange}` : ''}
            </Text>
          </View>
          <Text variant="bodyStrong" color="accent">
            + Add
          </Text>
        </Pressable>
      ))}

      {/* Watchlist */}
      <Text variant="label" color="inkSecondary" style={{ marginTop: Space.xl, marginBottom: Space.sm }}>
        YOUR WATCHLIST
      </Text>
      {!apiKey && (
        <View style={{ marginBottom: Space.md }}>
          <ConnectAI compact />
        </View>
      )}
      {quotes.length === 0 && !loading ? (
        <Text variant="caption" color="inkMuted">
          Your watchlist is empty. Search above to add a ticker.
        </Text>
      ) : (
        quotes.map((q) => (
          <StockCard key={q.symbol} quote={q} userContext={userContext} onRemove={() => removeWatch(q.symbol)} />
        ))
      )}
    </ScrollView>
  );
}
