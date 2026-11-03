/**
 * The What-If (hero), a bounded, honest budget remix.
 *
 * The user changes their income and redirects a percentage of chosen budget
 * categories to a target category; their receipt recomputes live. It reuses
 * lib/receipt.ts ENTIRELY (computeReceipt + applyReallocations), there is no
 * second engine and no fabricated downstream effects. Every transfer conserves
 * the total. A "not an economic forecast" note is always visible.
 */

import Slider from '@react-native-community/slider';
import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { AnimatedDollars } from '@/components/receipt/AnimatedDollars';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { WHATIF_DISCLAIMER } from '@/lib/constants';
import { formatDollars, formatDollarsCents, formatPercent } from '@/lib/format';
import {
  applyReallocations,
  computeReceipt,
  OUTLAY_CATEGORIES,
  type Reallocation,
} from '@/lib/receipt';
import { Radius, Space, useTheme } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';

const INCOME_MAX = 400000;
// Largest positive functions make the most legible "cut" controls.
const CUTTABLE = OUTLAY_CATEGORIES.filter((c) => c.amount > 0)
  .sort((a, b) => b.amount - a.amount)
  .slice(0, 6);
const DEFAULT_TARGET = 'education';

export default function WhatIfScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const input = useUserStore((s) => s.input);
  const hydrated = useUserStore((s) => s.hydrated);

  const [income, setIncome] = useState(input?.income ?? 60000);
  const [targetId, setTargetId] = useState(DEFAULT_TARGET);
  const [cuts, setCuts] = useState<Record<string, number>>({});

  const status = input?.filingStatus ?? 'single';

  const reallocations = useMemo<Reallocation[]>(
    () =>
      Object.entries(cuts)
        .filter(([fromId, pct]) => pct > 0 && fromId !== targetId)
        .map(([fromId, pct]) => ({ fromId, toId: targetId, percent: pct })),
    [cuts, targetId],
  );

  const adjusted = useMemo(() => applyReallocations(reallocations), [reallocations]);
  const baseline = useMemo(
    () => (input ? computeReceipt({ grossIncome: input.income, status }) : null),
    [input, status],
  );
  const current = useMemo(
    () => computeReceipt({ grossIncome: income, status, adjustedAmounts: adjusted }),
    [income, status, adjusted],
  );

  if (!hydrated) return null;
  if (!input || !baseline) return <Redirect href="/" />;

  const baselineById = new Map(baseline.lines.map((l) => [l.id, l.allocated]));
  const dirty = reallocations.length > 0 || income !== input.income;

  const reset = () => {
    setIncome(input.income);
    setTargetId(DEFAULT_TARGET);
    setCuts({});
  };

  const targetName = OUTLAY_CATEGORIES.find((c) => c.id === targetId)?.shortName ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.appBg, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ padding: Space.xl, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}>
        <Text variant="title">The What-If</Text>
        <Text variant="body" color="inkSecondary" style={{ marginTop: Space.xs }}>
          Remix the federal budget and watch your breakdown recompute. Same real data, transparent
          arithmetic.
        </Text>

        {/* Live total */}
        <View
          style={{
            marginTop: Space.lg,
            padding: Space.lg,
            borderRadius: Radius.lg,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.line,
          }}>
          <Text variant="caption" color="inkMuted">
            Your federal income tax on {formatDollars(income)}
          </Text>
          <AnimatedDollars value={current.incomeTax} variant="display" mono durationMs={350} />
          <Text variant="caption" color="inkMuted">
            Effective rate {formatPercent(income > 0 ? current.incomeTax / income : 0)} · these same
            dollars are re-split below.
          </Text>
        </View>

        {/* Income control */}
        <Control label="Income" value={formatDollars(income)}>
          <Slider
            minimumValue={0}
            maximumValue={INCOME_MAX}
            step={1000}
            value={income}
            onValueChange={setIncome}
            minimumTrackTintColor={theme.colors.accent}
            maximumTrackTintColor={theme.colors.line}
            thumbTintColor={theme.colors.accent}
            accessibilityLabel={`Income slider, ${formatDollars(income)}`}
          />
        </Control>

        {/* Target picker */}
        <Text variant="label" color="inkSecondary" style={{ marginTop: Space.xl, marginBottom: Space.sm }}>
          REDIRECT SAVINGS TO
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {OUTLAY_CATEGORIES.filter((c) => c.amount > 0).map((c) => {
            const selected = c.id === targetId;
            return (
              <Pressable
                key={c.id}
                onPress={() => setTargetId(c.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Redirect savings to ${c.shortName}`}
                style={{
                  paddingHorizontal: Space.md,
                  paddingVertical: Space.sm,
                  borderRadius: Radius.pill,
                  borderWidth: 1.5,
                  borderColor: selected ? theme.colors.accent : theme.colors.line,
                  backgroundColor: selected ? theme.colors.accentSoft : theme.colors.surface,
                }}>
                <Text variant="caption" color={selected ? 'accent' : 'inkSecondary'}>
                  {c.icon} {c.shortName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Cut sliders */}
        <Text variant="label" color="inkSecondary" style={{ marginTop: Space.xl, marginBottom: Space.sm }}>
          CUT THESE CATEGORIES
        </Text>
        {CUTTABLE.filter((c) => c.id !== targetId).map((c) => {
          const pct = cuts[c.id] ?? 0;
          return (
            <Control key={c.id} label={`${c.icon} ${c.shortName}`} value={`−${Math.round(pct * 100)}%`}>
              <Slider
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={pct}
                onValueChange={(v) => setCuts((prev) => ({ ...prev, [c.id]: v }))}
                minimumTrackTintColor={theme.colors.accent}
                maximumTrackTintColor={theme.colors.line}
                thumbTintColor={theme.colors.accent}
                accessibilityLabel={`Cut ${c.shortName} by ${Math.round(pct * 100)} percent`}
              />
            </Control>
          );
        })}

        {/* Recomputed receipt */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Space.xl, marginBottom: Space.sm }}>
          <Text variant="label" color="inkSecondary">
            YOUR REMIXED BREAKDOWN
          </Text>
          {dirty && (
            <Pressable onPress={reset} accessibilityRole="button" accessibilityLabel="Reset to actual budget" hitSlop={8}>
              <Text variant="label" color="accent">
                Reset to actual
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ backgroundColor: theme.colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: Space.lg, paddingVertical: Space.sm }}>
          {current.lines.map((l) => {
            const before = baselineById.get(l.id) ?? 0;
            const delta = l.allocated - before;
            const changed = Math.abs(delta) >= 0.005;
            return (
              <Animated.View
                key={l.id}
                layout={LinearTransition.springify().damping(22)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Space.sm, gap: Space.sm }}>
                <Text variant="body" style={{ width: 22 }}>
                  {l.icon}
                </Text>
                <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {l.shortName}
                </Text>
                {changed && (
                  <Text variant="caption" style={{ color: delta > 0 ? theme.colors.positive : theme.colors.accent }}>
                    {delta > 0 ? '▲' : '▼'} {formatDollars(Math.abs(delta))}
                  </Text>
                )}
                <Text variant="bodyStrong" mono style={{ minWidth: 92, textAlign: 'right' }}>
                  {formatDollarsCents(l.allocated)}
                </Text>
              </Animated.View>
            );
          })}
          <View style={{ height: 1, backgroundColor: theme.colors.line, marginVertical: Space.xs }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Space.sm }}>
            <Text variant="bodyStrong">Total (conserved)</Text>
            <Text variant="bodyStrong" mono color="accent">
              {formatDollarsCents(current.totalAllocated)}
            </Text>
          </View>
        </View>

        <Text variant="caption" color="inkSecondary" style={{ marginTop: Space.md }}>
          Redirecting to <Text variant="caption" color="accent">{targetName}</Text>. Money moved out of one
          category is added to another, the total never changes.
        </Text>
      </ScrollView>

      {/* Always-visible honesty note */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: Space.xl,
          paddingTop: Space.sm,
          paddingBottom: insets.bottom + Space.sm,
          backgroundColor: theme.colors.elevated,
          borderTopWidth: 1,
          borderTopColor: theme.colors.line,
        }}>
        <Text variant="caption" color="inkSecondary" center>
          ⓘ {WHATIF_DISCLAIMER}
        </Text>
      </View>
    </View>
  );
}

function Control({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: Space.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, marginRight: Space.sm }}>
          {label}
        </Text>
        <Text variant="bodyStrong" mono color="accent">
          {value}
        </Text>
      </View>
      <View style={{ marginTop: Space.xs }}>{children}</View>
    </View>
  );
}
