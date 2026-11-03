/**
 * News (tab) - finance headlines with an AI "what this means for you" on each
 * story, grounded in the user's own tax picture. Free RSS feeds for the news,
 * Groq for the explanations. Designed loading / empty / error states.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectAI } from '@/components/ai/ConnectAI';
import { NewsCard } from '@/components/news/NewsCard';
import { StateView } from '@/components/ui/StateView';
import { Text } from '@/components/ui/Text';
import { userTaxContext } from '@/lib/ai/prompts';
import { fetchNews, type NewsItem, type NewsResult } from '@/lib/api/news';
import { computeStateLocal } from '@/lib/stateTax';
import { federalIncomeTax } from '@/lib/tax';
import { Space, useTheme } from '@/lib/theme';
import { useAiStore } from '@/store/aiStore';
import { useUserStore } from '@/store/userStore';

export default function NewsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const input = useUserStore((s) => s.input);
  const apiKey = useAiStore((s) => s.apiKey);

  const [result, setResult] = useState<NewsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nowMs, setNowMs] = useState(0);

  const load = useCallback(async (force: boolean) => {
    if (!force) setLoading(true);
    const r = await fetchNews({ force });
    setResult(r);
    setNowMs(Date.now());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const userContext = useMemo(() => {
    if (!input) return '';
    const fed = federalIncomeTax(input.income, input.filingStatus);
    const sl = computeStateLocal(input.income, input.filingStatus, input.zip);
    return userTaxContext({
      income: input.income,
      state: sl.state,
      federalIncomeTax: fed,
      stateLocalTotal: sl.total,
    });
  }, [input]);

  const items = result?.items ?? [];

  const header = (
    <View style={{ paddingHorizontal: Space.xl, paddingTop: Space.lg, gap: Space.sm }}>
      <Text variant="title">News</Text>
      <Text variant="body" color="inkSecondary">
        Finance headlines, with a plain-language read on how each could hit your wallet. Tap a story
        for the AI take.
      </Text>
      {!apiKey && (
        <View style={{ marginTop: Space.sm }}>
          <ConnectAI />
        </View>
      )}
      <View style={{ height: Space.sm }} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.appBg, paddingTop: insets.top }}>
      {loading ? (
        <StateView kind="loading" title="Loading finance news..." />
      ) : result?.empty ? (
        <>
          {header}
          <StateView
            kind="empty"
            emoji="📰"
            title="No news right now"
            message="We could not reach the news feeds. Check your connection and try again."
            actionLabel="Retry"
            onAction={() => load(true)}
          />
        </>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i: NewsItem) => i.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: Space.xl }}>
              <NewsCard item={item} nowMs={nowMs} userContext={userContext} />
            </View>
          )}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: insets.bottom + Space.xxxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(true);
              }}
              tintColor={theme.colors.accent}
            />
          }
        />
      )}
    </View>
  );
}
