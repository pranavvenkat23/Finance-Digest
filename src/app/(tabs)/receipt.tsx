/**
 * Receipt (hero), the animated itemized federal receipt.
 *
 * Reads the user's income/status from the store and renders computeReceipt():
 * a paper-ticket total, a surprising headline comparison, itemized lines that
 * tally in sequentially, a donut of the top categories, and the separately
 * earmarked payroll taxes. Every figure links to its source.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AnimatedDollars } from '@/components/receipt/AnimatedDollars';
import { CategorySheet } from '@/components/receipt/CategorySheet';
import { DonutChart, type DonutSegment } from '@/components/receipt/DonutChart';
import { DashedRule, PaperCard } from '@/components/receipt/PaperCard';
import { ReceiptLineRow } from '@/components/receipt/ReceiptLineRow';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { SourceLink } from '@/components/ui/SourceLink';
import { Text } from '@/components/ui/Text';
import { EDU_DISCLAIMER } from '@/lib/constants';
import { formatDollars, formatDollarsCents, formatPercent } from '@/lib/format';
import {
  buildHeadline,
  computeReceipt,
  SNAPSHOT_META,
  type ReceiptLine,
} from '@/lib/receipt';
import { effectiveRate } from '@/lib/tax';
import { computeStateLocal } from '@/lib/stateTax';
import { Radius, Space, useTheme } from '@/lib/theme';
import { FILING_STATUS_LABELS, useUserStore } from '@/store/userStore';

export default function ReceiptScreen() {
  const theme = useTheme();
  const router = useRouter();
  const input = useUserStore((s) => s.input);
  const hydrated = useUserStore((s) => s.hydrated);
  const [activeLine, setActiveLine] = useState<ReceiptLine | null>(null);

  const receipt = useMemo(
    () => (input ? computeReceipt({ grossIncome: input.income, status: input.filingStatus }) : null),
    [input],
  );

  if (!hydrated) return null;

  if (!input || !receipt) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', gap: Space.lg }}>
          <Text variant="title" center>
            Let’s build your tax breakdown
          </Text>
          <Text variant="body" color="inkSecondary" center>
            Enter your income and ZIP to see where your federal taxes go.
          </Text>
          <Button label="Get started" onPress={() => router.push('/')} />
        </View>
      </Screen>
    );
  }

  const positives = receipt.lines.filter((l) => l.allocated > 0);
  const maxAllocated = positives[0]?.allocated ?? 0;
  const headline = buildHeadline(receipt);
  const rate = effectiveRate(input.income, input.filingStatus);

  const top = positives.slice(0, 5).map<DonutSegment>((l) => ({ id: l.id, label: l.shortName, value: l.allocated }));
  const otherValue = positives.slice(5).reduce((a, l) => a + l.allocated, 0);
  const donutSegments = otherValue > 0 ? [...top, { id: 'other', label: 'Everything else', value: otherValue }] : top;

  return (
    <Screen scroll>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Space.lg }}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="inkMuted" style={{ letterSpacing: 1 }}>
            FY{SNAPSHOT_META.fiscalYear} · {FILING_STATUS_LABELS[input.filingStatus]}
          </Text>
          <Text variant="title">Your Taxes</Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/', params: { edit: '1' } })}
          accessibilityRole="button"
          accessibilityLabel="Edit income, filing status, and ZIP"
          hitSlop={8}
          style={{
            paddingHorizontal: Space.lg,
            paddingVertical: Space.sm,
            borderRadius: Radius.pill,
            borderWidth: 1,
            borderColor: theme.colors.line,
          }}>
          <Text variant="label" color="inkSecondary">
            Edit
          </Text>
        </Pressable>
      </View>

      {/* Hero paper */}
      <Animated.View entering={FadeInDown.springify().damping(18)}>
        <PaperCard>
          <Text variant="caption" color="inkMuted" center style={{ letterSpacing: 2 }}>
            FEDERAL INCOME TAX BREAKDOWN
          </Text>
          <Text variant="caption" color="inkMuted" center>
            on {formatDollars(input.income)} income · effective rate {formatPercent(rate)}
          </Text>
          <DashedRule />
          <Text variant="caption" color="inkSecondary" center>
            You paid approximately
          </Text>
          <AnimatedDollars
            value={receipt.incomeTax}
            variant="display"
            color="ink"
            mono
            center
            style={{ marginVertical: Space.xs }}
          />
          <Text variant="caption" color="inkMuted" center>
            in federal income tax, itemized below.
          </Text>

          {headline && (
            <Animated.View entering={FadeIn.delay(700)}>
              <DashedRule />
              <View style={{ flexDirection: 'row', gap: Space.sm }}>
                <Text variant="headline">💡</Text>
                <Text variant="body" color="ink" style={{ flex: 1 }}>
                  You put{' '}
                  <Text variant="bodyStrong" color="accent">
                    {formatDollarsCents(headline.bigger.allocated)}
                  </Text>{' '}
                  toward interest on the national debt, about{' '}
                  <Text variant="bodyStrong">{Math.round(headline.ratio)}×</Text> what you put toward
                  NASA, the NSF, and all federal science & space.
                </Text>
              </View>
            </Animated.View>
          )}
        </PaperCard>
      </Animated.View>

      {/* Itemized lines */}
      <View style={{ marginTop: Space.xxl }}>
        <Text variant="label" color="inkSecondary" style={{ marginBottom: Space.xs }}>
          WHERE IT WENT
        </Text>
        {receipt.lines.map((line, i) => (
          <Animated.View key={line.id} entering={FadeInDown.delay(150 + i * 55).springify().damping(20)}>
            <ReceiptLineRow line={line} maxAllocated={maxAllocated} onPress={setActiveLine} />
            {i < receipt.lines.length - 1 && (
              <View style={{ height: 1, backgroundColor: theme.colors.line }} />
            )}
          </Animated.View>
        ))}
        <DashedRule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="bodyStrong">Total income tax</Text>
          <Text variant="bodyStrong" mono color="accent">
            {formatDollarsCents(receipt.totalAllocated)}
          </Text>
        </View>
      </View>

      {/* What-If entry point */}
      <Pressable
        onPress={() => router.push('/(tabs)/what-if')}
        accessibilityRole="button"
        accessibilityLabel="Remix your tax breakdown in the What-If simulator"
        style={({ pressed }) => ({
          marginTop: Space.xl,
          padding: Space.lg,
          borderRadius: Radius.lg,
          backgroundColor: theme.colors.accentSoft,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.md,
          opacity: pressed ? 0.85 : 1,
        })}>
        <Text style={{ fontSize: 22 }}>🎛️</Text>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" color="accent">
            Remix the budget in the What-If
          </Text>
          <Text variant="caption" color="inkSecondary">
            Cut and redirect categories, change income, watch your breakdown update live.
          </Text>
        </View>
        <Text variant="headline" color="accent">
          ›
        </Text>
      </Pressable>

      {/* Donut */}
      <View style={{ marginTop: Space.xxxl, alignItems: 'center' }}>
        <Text variant="label" color="inkSecondary" style={{ alignSelf: 'flex-start', marginBottom: Space.lg }}>
          TOP CATEGORIES
        </Text>
        <DonutChart segments={donutSegments} />
      </View>

      {/* Payroll, separate & earmarked */}
      <View
        style={{
          marginTop: Space.xxxl,
          padding: Space.lg,
          borderRadius: Radius.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.line,
        }}>
        <Text variant="headline">Plus payroll taxes</Text>
        <Text variant="caption" color="inkSecondary" style={{ marginTop: 4, marginBottom: Space.md }}>
          Separate from income tax and earmarked for these programs.
        </Text>
        <Row label="Social Security (6.2%)" value={receipt.payroll.socialSecurity} />
        <Row label="Medicare (1.45%)" value={receipt.payroll.medicare} />
        <View style={{ height: 1, backgroundColor: theme.colors.line, marginVertical: Space.sm }} />
        <Row label="Payroll total" value={receipt.payroll.total} strong />
      </View>

      {/* State & local taxes (full picture) */}
      {(() => {
        const sl = computeStateLocal(input.income, input.filingStatus, input.zip);
        if (!sl.state) return null;
        return (
          <Pressable
            onPress={() => router.push('/(tabs)/local')}
            accessibilityRole="button"
            accessibilityLabel={`Your estimated ${sl.stateName} state and local taxes. Tap for details.`}
            style={{
              marginTop: Space.md,
              padding: Space.lg,
              borderRadius: Radius.lg,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.line,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text variant="headline">Plus {sl.stateName} state & local</Text>
                <Text variant="caption" color="inkSecondary" style={{ marginTop: 4 }}>
                  State income, local income, and sales tax, estimated. Tap to explore your area.
                </Text>
              </View>
              <Text variant="headline" mono color="accent">
                {formatDollars(sl.total)}
              </Text>
            </View>
          </Pressable>
        );
      })()}

      {/* Methodology / disclaimer */}
      <View style={{ marginTop: Space.xxl, gap: Space.sm }}>
        <Pressable onPress={() => router.push('/(tabs)/sources')} accessibilityRole="button">
          <Text variant="label" color="accent">
            How this was calculated →
          </Text>
        </Pressable>
        <Text variant="caption" color="inkMuted">
          {EDU_DISCLAIMER}
        </Text>
        <SourceLink url={SNAPSHOT_META.sourceUrl} label={`Source: ${SNAPSHOT_META.sourceShort}`} />
      </View>

      <CategorySheet line={activeLine} onClose={() => setActiveLine(null)} />
    </Screen>
  );
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text variant={strong ? 'bodyStrong' : 'body'} color={strong ? 'ink' : 'inkSecondary'}>
        {label}
      </Text>
      <Text variant={strong ? 'bodyStrong' : 'body'} mono color={strong ? 'ink' : 'inkSecondary'}>
        {formatDollarsCents(value)}
      </Text>
    </View>
  );
}
