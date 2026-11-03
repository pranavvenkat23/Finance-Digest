/**
 * Local (tab) - your state, county, and local tax picture, plus a tax-burden map
 * to see how your area compares. Repurposed from the old awards map into
 * something with a clear personal payoff. Real federal awards near your ZIP are
 * kept as a secondary section.
 */

import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AwardCard } from '@/components/comeback/AwardCard';
import { StateTaxMap } from '@/components/localtax/StateTaxMap';
import { SourceLink } from '@/components/ui/SourceLink';
import { Text } from '@/components/ui/Text';
import { fetchAwards, type AwardResult } from '@/lib/api/usaspending';
import { formatDollars, formatPercent } from '@/lib/format';
import { allStatesSummary, computeStateLocal, STATE_TAX_SOURCE } from '@/lib/stateTax';
import { federalIncomeTax, payrollTaxes } from '@/lib/tax';
import { Radius, Space, useTheme } from '@/lib/theme';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';

const NATIONAL_SALES_AVG = 0.0752; // Tax Foundation 2025 population-weighted average

export default function LocalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const input = useUserStore((s) => s.input);
  const hydrated = useUserStore((s) => s.hydrated);

  const sl = useMemo(
    () => (input ? computeStateLocal(input.income, input.filingStatus, input.zip) : null),
    [input],
  );
  const federal = useMemo(
    () => (input ? federalIncomeTax(input.income, input.filingStatus) : 0),
    [input],
  );
  const payroll = useMemo(() => (input ? payrollTaxes(input.income).total : 0), [input]);

  const [selected, setSelected] = useState<string | null>(sl?.state ?? null);

  // Federal awards (lazy, secondary section).
  const [awards, setAwards] = useState<AwardResult | null>(null);
  const [awardsOpen, setAwardsOpen] = useState(false);
  const [awardsLoading, setAwardsLoading] = useState(false);
  const loadAwards = useCallback(async () => {
    if (!input || awards) return;
    setAwardsLoading(true);
    const r = await fetchAwards(input.zip);
    setAwards(r);
    setAwardsLoading(false);
  }, [input, awards]);

  if (!hydrated) return null;
  if (!input || !sl) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: theme.colors.appBg, padding: Space.xl, justifyContent: 'center', gap: Space.lg }}>
        <Text variant="title" center>
          See your local taxes
        </Text>
        <Text variant="body" color="inkSecondary" center>
          Add your income and ZIP to estimate your state, local, and sales taxes.
        </Text>
        <Pressable onPress={() => router.push('/')} accessibilityRole="button">
          <Text variant="bodyStrong" color="accent" center>
            Get started
          </Text>
        </Pressable>
      </View>
    );
  }

  const totalAllTax = federal + payroll + sl.total;
  const selectedRow = allStatesSummary().find((s) => s.abbr === selected);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.appBg }}
      contentContainerStyle={{ paddingHorizontal: Space.xl, paddingTop: insets.top + Space.lg, paddingBottom: insets.bottom + Space.xxxl }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="inkMuted" style={{ letterSpacing: 1 }}>
            {sl.stateName ?? 'Your area'} · ZIP {input.zip}
          </Text>
          <Text variant="title">Local Taxes</Text>
        </View>
        <Pressable onPress={() => router.push({ pathname: '/', params: { edit: '1' } })} accessibilityRole="button" accessibilityLabel="Edit ZIP" hitSlop={8} style={{ paddingHorizontal: Space.lg, paddingVertical: Space.sm, borderRadius: Radius.pill, borderWidth: 1, borderColor: theme.colors.line }}>
          <Text variant="label" color="inkSecondary">
            Edit
          </Text>
        </Pressable>
      </View>

      {/* Your state + local summary */}
      <View style={{ marginTop: Space.lg, padding: Space.lg, borderRadius: Radius.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, gap: Space.sm }}>
        <Text variant="label" color="inkSecondary">
          YOUR STATE & LOCAL TAXES (ESTIMATE)
        </Text>
        <Row label="State income tax" value={sl.stateIncome} />
        <Row label={`Local income tax${sl.localIncomeRate > 0 ? ` (${formatPercent(sl.localIncomeRate)})` : ''}`} value={sl.localIncome} />
        <Row label={`Sales tax (est. on ~${Math.round(STATE_TAX_SOURCE.consumptionShare * 100)}% of income)`} value={sl.salesTax} />
        <View style={{ height: 1, backgroundColor: theme.colors.line, marginVertical: 4 }} />
        <Row label="State + local total" value={sl.total} strong />
      </View>

      {/* Total tax picture */}
      <View style={{ marginTop: Space.md, padding: Space.lg, borderRadius: Radius.lg, backgroundColor: theme.colors.elevated, gap: 4 }}>
        <Text variant="caption" color="inkMuted">
          Your estimated total tax (federal income + payroll + state + local + sales)
        </Text>
        <Text variant="display" mono>
          {formatDollars(totalAllTax)}
        </Text>
        <Text variant="caption" color="inkMuted">
          About {formatPercent(input.income > 0 ? totalAllTax / input.income : 0)} of your ${input.income.toLocaleString()} income.
        </Text>
      </View>

      {/* Tax map */}
      <Text variant="label" color="inkSecondary" style={{ marginTop: Space.xl, marginBottom: Space.sm }}>
        HOW YOUR STATE COMPARES
      </Text>
      <StateTaxMap userState={sl.state} onSelect={setSelected} />

      {selectedRow && (
        <View style={{ marginTop: Space.md, padding: Space.lg, borderRadius: Radius.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.line, gap: 4 }}>
          <Text variant="bodyStrong">{selectedRow.name}</Text>
          <Text variant="caption" color="inkSecondary">
            Top income rate {formatPercent(selectedRow.topIncomeRate)} · combined sales {formatPercent(selectedRow.salesCombined)}
          </Text>
          <Text variant="caption" color="inkMuted">
            National average combined sales tax is {formatPercent(NATIONAL_SALES_AVG)}. {selectedRow.name}
            {selectedRow.salesCombined >= NATIONAL_SALES_AVG ? ' is above' : ' is below'} the national average.
          </Text>
        </View>
      )}

      {/* Federal money near you (secondary) */}
      <Pressable
        onPress={() => {
          setAwardsOpen((v) => !v);
          if (!awardsOpen) void loadAwards();
        }}
        accessibilityRole="button"
        style={{ marginTop: Space.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label" color="inkSecondary">
          FEDERAL MONEY NEAR YOU
        </Text>
        <Text variant="label" color="accent">
          {awardsOpen ? 'Hide' : 'Show'}
        </Text>
      </Pressable>
      {awardsOpen && (
        <View style={{ marginTop: Space.md }}>
          {awardsLoading && (
            <Text variant="caption" color="inkMuted">
              Loading federal awards for ZIP {input.zip}...
            </Text>
          )}
          {awards?.source === 'sample' && (
            <Text variant="caption" color="accent" style={{ marginBottom: Space.sm }}>
              Showing sample data (offline or no live results). Each links to a real record.
            </Text>
          )}
          {awards && awards.awards.length === 0 && !awardsLoading && (
            <Text variant="caption" color="inkMuted">
              No federal awards found for this ZIP right now.
            </Text>
          )}
          {awards?.awards.slice(0, 8).map((a) => (
            <AwardCard key={`${a.internalId}-${a.id}`} award={a} />
          ))}
        </View>
      )}

      {/* Sources */}
      <View style={{ marginTop: Space.xl, gap: 4 }}>
        <Text variant="caption" color="inkMuted">
          {STATE_TAX_SOURCE.note}
        </Text>
        <SourceLink url={STATE_TAX_SOURCE.incomeUrl} label="Source: Tax Foundation, state income tax 2025" variant="caption" />
        <SourceLink url={STATE_TAX_SOURCE.salesUrl} label="Source: Tax Foundation, sales tax 2025" variant="caption" />
      </View>
    </ScrollView>
  );
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant={strong ? 'bodyStrong' : 'body'} color={strong ? 'ink' : 'inkSecondary'} style={{ flex: 1, marginRight: Space.sm }}>
        {label}
      </Text>
      <Text variant={strong ? 'bodyStrong' : 'body'} mono color={strong ? 'ink' : 'inkSecondary'}>
        {formatDollars(value)}
      </Text>
    </View>
  );
}
