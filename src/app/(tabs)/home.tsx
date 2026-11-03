/**
 * Home (tab) - a clean dashboard summarizing the whole app: where your taxes go,
 * federal money near you, news that moves your money, and your stocks. Tax data
 * is instant and offline; the rest loads async with graceful states. Each card
 * links into its detailed tab and cites its source.
 */

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, DashboardCard } from '@/components/home/DashboardCard';
import { SourceLink } from '@/components/ui/SourceLink';
import { TabBarIcon } from '@/components/ui/TabBarIcon';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/lib/constants';
import { fetchAwards } from '@/lib/api/usaspending';
import { fetchNews, type NewsItem } from '@/lib/api/news';
import { fetchQuotes, type Quote } from '@/lib/api/stocks';
import { formatCompactDollars, formatDollars, formatSignedPercent } from '@/lib/format';
import { computeReceipt, SNAPSHOT_META } from '@/lib/receipt';
import { computeStateLocal } from '@/lib/stateTax';
import { Radius, Space, useTheme } from '@/lib/theme';
import { useUserStore } from '@/store/userStore';
import { useWatchlistStore } from '@/store/watchlistStore';

const DOT_COLORS = ['#1E9E6A', '#2F6FED', '#F2994A', '#9B51E0'];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const input = useUserStore((s) => s.input);
  const hydrated = useUserStore((s) => s.hydrated);
  const watchItems = useWatchlistStore((s) => s.items);

  const receipt = useMemo(
    () => (input ? computeReceipt({ grossIncome: input.income, status: input.filingStatus }) : null),
    [input],
  );
  const sl = useMemo(
    () => (input ? computeStateLocal(input.income, input.filingStatus, input.zip) : null),
    [input],
  );

  const [news, setNews] = useState<NewsItem | null>(null);
  const [awardsTotal, setAwardsTotal] = useState<{ sum: number; count: number; sample: boolean } | null>(null);
  const [quotes, setQuotes] = useState<Quote[] | null>(null);

  const loadAsync = useCallback(async () => {
    if (!input) return;
    void fetchNews().then((r) => setNews(r.items[0] ?? null));
    void fetchAwards(input.zip).then((r) =>
      setAwardsTotal({ sum: r.awards.reduce((a, w) => a + w.amount, 0), count: r.awards.length, sample: r.source === 'sample' }),
    );
    void fetchQuotes(watchItems.slice(0, 3).map((w) => ({ symbol: w.symbol, name: w.name }))).then(setQuotes);
  }, [input, watchItems]);

  useEffect(() => {
    void loadAsync();
  }, [loadAsync]);

  if (!hydrated) return null;
  if (!input || !receipt || !sl) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.appBg, paddingTop: insets.top, padding: Space.xl, justifyContent: 'center', gap: Space.lg }}>
        <Text variant="title" center>
          Welcome to {APP_NAME}
        </Text>
        <Pressable onPress={() => router.push('/')} accessibilityRole="button">
          <Text variant="bodyStrong" color="accent" center>
            Get started
          </Text>
        </Pressable>
      </View>
    );
  }

  const topLines = receipt.lines.filter((l) => l.allocated > 0).slice(0, 4);
  const locationLine = sl.stateName ? `${sl.stateName} · ZIP ${input.zip}` : `ZIP ${input.zip}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.appBg }}
      contentContainerStyle={{ paddingHorizontal: Space.xl, paddingTop: insets.top + Space.sm, paddingBottom: insets.bottom + Space.xxxl, gap: Space.md }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text variant="display">{APP_NAME}</Text>
          <Text variant="headline" style={{ marginTop: Space.xs }}>
            Your money and your government
          </Text>
          <Text variant="body" color="inkSecondary">
            {locationLine}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/', params: { edit: '1' } })}
          accessibilityRole="button"
          accessibilityLabel="Edit your details"
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line }}>
          <TabBarIcon name="info" color={theme.colors.accent} size={20} />
        </Pressable>
      </View>

      {/* Where my taxes go */}
      <DashboardCard
        icon="dollar"
        title="Where my taxes go"
        rightLabel="per $100"
        onPress={() => router.push('/(tabs)/receipt')}
        footer={
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip label="Estimated" tone="warn" />
            <SourceLink url="https://www.cbo.gov/topics/budget" label="Congressional Budget Office" variant="caption" />
          </View>
        }>
        <View style={{ gap: Space.sm }}>
          {topLines.map((l, i) => (
            <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm, flex: 1 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: DOT_COLORS[i] }} />
                <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                  {l.shortName}
                </Text>
              </View>
              <Text variant="bodyStrong" mono>
                {formatDollars(l.share * 100)}
              </Text>
            </View>
          ))}
        </View>
      </DashboardCard>

      {/* Spent near me */}
      <DashboardCard
        icon="map"
        title="Spent near me"
        rightLabel={sl.stateName ?? 'Your area'}
        onPress={() => router.push('/(tabs)/local')}
        footer={
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip label={awardsTotal?.sample ? 'Sample data' : 'Exact data'} tone={awardsTotal?.sample ? 'neutral' : 'positive'} />
            <SourceLink url="https://www.usaspending.gov/" label="USAspending.gov" variant="caption" />
          </View>
        }>
        {awardsTotal === null ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : awardsTotal.count === 0 ? (
          <Text variant="body" color="inkSecondary">
            No federal awards found for ZIP {input.zip} right now.
          </Text>
        ) : (
          <View>
            <Text variant="display" mono>
              {formatCompactDollars(awardsTotal.sum)}
            </Text>
            <Text variant="caption" color="inkMuted">
              across the top {awardsTotal.count} federal grants and contracts in ZIP {input.zip}
            </Text>
          </View>
        )}
      </DashboardCard>

      {/* News to your money */}
      <DashboardCard
        icon="news"
        title="News to your money"
        rightLabel="Today"
        onPress={() => router.push('/(tabs)/news')}>
        {news === null ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : (
          <View style={{ gap: 4 }}>
            <Text variant="bodyStrong">{news.title}</Text>
            {!!news.summary && (
              <Text variant="caption" color="inkSecondary" numberOfLines={2}>
                {news.summary}
              </Text>
            )}
            <Text variant="caption" color="accent" style={{ marginTop: 4 }}>
              Tap for the AI take on how it affects you
            </Text>
          </View>
        )}
      </DashboardCard>

      {/* Your stocks */}
      <DashboardCard
        icon="chart"
        title="Your stocks"
        rightLabel="Markets"
        onPress={() => router.push('/(tabs)/stocks')}>
        {quotes === null ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : quotes.length === 0 ? (
          <Text variant="body" color="inkSecondary">
            Add tickers in the Stocks tab to track them here.
          </Text>
        ) : (
          <View style={{ gap: Space.sm }}>
            {quotes.map((q) => {
              const up = q.change >= 0;
              return (
                <View key={q.symbol} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                    {q.symbol}
                  </Text>
                  <Text variant="body" mono style={{ marginRight: Space.md }}>
                    {q.price.toFixed(2)}
                  </Text>
                  <Text variant="bodyStrong" mono style={{ color: up ? theme.colors.positive : theme.colors.accent, minWidth: 72, textAlign: 'right' }}>
                    {up ? '▲' : '▼'} {formatSignedPercent(q.changePct)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </DashboardCard>

      <Text variant="caption" color="inkMuted" center style={{ marginTop: Space.sm }}>
        {SNAPSHOT_META.sourceShort}. Educational estimates, not advice.
      </Text>
    </ScrollView>
  );
}
