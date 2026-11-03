/**
 * Onboarding, a clean multi-step flow.
 *
 * Step 0 welcome, 1 income + filing status, 2 ZIP (with location autofill),
 * 3 optional stock tickers. A top progress bar tracks position. Finishing saves
 * the user's input and any tickers, then routes into the Home dashboard. Also
 * doubles as the edit screen (open with ?edit=1) which jumps straight to the
 * income and ZIP steps.
 */

import * as Location from 'expo-location';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroBadge } from '@/components/onboarding/HeroBadge';
import { StepProgress } from '@/components/onboarding/StepProgress';
import { Button } from '@/components/ui/Button';
import { TabBarIcon, type IconName } from '@/components/ui/TabBarIcon';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/lib/constants';
import { Radius, Space, useTheme } from '@/lib/theme';
import { FILING_STATUS_LABELS, type FilingStatus, useUserStore } from '@/store/userStore';
import { useWatchlistStore } from '@/store/watchlistStore';

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: 'dollar', label: 'Your tax dollars, itemized' },
  { icon: 'map', label: 'Federal funding near you' },
  { icon: 'chart', label: 'Markets and news, explained' },
  { icon: 'check', label: 'Every number cites a public source' },
];

const SUGGESTED_TICKERS = ['AAPL', 'NVDA', 'SPY', 'VOO', 'BTC-USD'];

export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ edit?: string }>();
  const editing = !!params.edit;

  const { input, hydrated, setInput } = useUserStore();
  const watchItems = useWatchlistStore((s) => s.items);
  const addWatch = useWatchlistStore((s) => s.add);
  const removeWatch = useWatchlistStore((s) => s.remove);

  const firstStep = editing ? 1 : 0;
  const lastStep = editing ? 2 : 3;

  const [step, setStep] = useState(firstStep);
  const [income, setIncome] = useState(input ? String(input.income) : '');
  const [zip, setZip] = useState(input?.zip ?? '');
  const [status, setStatus] = useState<FilingStatus>(input?.filingStatus ?? 'single');
  const [locating, setLocating] = useState(false);
  const [ticker, setTicker] = useState('');

  if (!hydrated) return null;
  // Returning users skip onboarding (unless they came here to edit).
  if (input && !editing && step === 0) return <Redirect href="/(tabs)/home" />;

  const incomeNum = Number(income.replace(/[^0-9.]/g, ''));
  const incomeValid = Number.isFinite(incomeNum) && incomeNum >= 0 && income.trim() !== '';
  const zipValid = /^\d{5}$/.test(zip);

  const canAdvance =
    (step === 1 && incomeValid) || (step === 2 && zipValid) || step === 0 || step === 3;

  const useMyLocation = async () => {
    try {
      setLocating(true);
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (place?.postalCode) setZip(place.postalCode.replace(/[^0-9]/g, '').slice(0, 5));
    } catch {
      // Best-effort; typing a ZIP is always available.
    } finally {
      setLocating(false);
    }
  };

  const finish = async () => {
    await setInput({ income: Math.round(incomeNum), filingStatus: status, zip });
    router.replace('/(tabs)/home');
  };

  const next = () => {
    if (!canAdvance) return;
    if (step >= lastStep) {
      void finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const back = () => setStep((s) => Math.max(firstStep, s - 1));

  const fieldStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    color: theme.colors.ink,
    fontSize: 17,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface, paddingTop: insets.top + Space.sm }}>
      {/* Progress */}
      <View style={{ paddingHorizontal: Space.xl, marginBottom: Space.md }}>
        <StepProgress step={step} total={lastStep + 1} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: Space.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View key={step} entering={FadeIn.duration(220)}>
            {step === 0 && (
              <View style={{ gap: Space.xl }}>
                <HeroBadge name="bank" />
                <View style={{ alignItems: 'center', gap: Space.sm }}>
                  <Text variant="display" center>
                    {APP_NAME}
                  </Text>
                  <Text variant="body" color="inkSecondary" center>
                    See where your tax dollars go, how the government spends, and how it moves your
                    money.
                  </Text>
                </View>
                <View style={{ gap: Space.lg, marginTop: Space.sm }}>
                  {FEATURES.map((f) => (
                    <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: theme.colors.accentSoft,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <TabBarIcon name={f.icon} color={theme.colors.accent} size={20} />
                      </View>
                      <Text variant="bodyStrong" style={{ flex: 1 }}>
                        {f.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {step === 1 && (
              <View style={{ gap: Space.lg }}>
                <HeroBadge name="dollar" />
                <View style={{ alignItems: 'center', gap: Space.xs }}>
                  <Text variant="title" center>
                    What do you earn?
                  </Text>
                  <Text variant="body" color="inkSecondary" center>
                    We use this to estimate your federal tax breakdown. It stays on your device.
                  </Text>
                </View>
                <View>
                  <Text variant="label" color="inkSecondary" style={{ marginBottom: Space.sm }}>
                    Annual income (gross)
                  </Text>
                  <TextInput
                    value={income}
                    onChangeText={setIncome}
                    keyboardType="number-pad"
                    placeholder="e.g. 60000"
                    placeholderTextColor={theme.colors.inkMuted}
                    style={fieldStyle}
                    accessibilityLabel="Annual gross income in dollars"
                    returnKeyType="done"
                  />
                </View>
                <View>
                  <Text variant="label" color="inkSecondary" style={{ marginBottom: Space.sm }}>
                    Filing status
                  </Text>
                  <View style={{ gap: Space.sm }}>
                    {(Object.keys(FILING_STATUS_LABELS) as FilingStatus[]).map((key) => {
                      const selected = status === key;
                      return (
                        <Pressable
                          key={key}
                          onPress={() => setStatus(key)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          accessibilityLabel={FILING_STATUS_LABELS[key]}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: Space.md,
                            padding: Space.lg,
                            borderRadius: Radius.md,
                            borderWidth: 1.5,
                            borderColor: selected ? theme.colors.accent : theme.colors.line,
                            backgroundColor: selected ? theme.colors.accentSoft : theme.colors.surface,
                          }}>
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              borderWidth: 2,
                              borderColor: selected ? theme.colors.accent : theme.colors.inkMuted,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            {selected && (
                              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.accent }} />
                            )}
                          </View>
                          <Text variant="bodyStrong">{FILING_STATUS_LABELS[key]}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={{ gap: Space.lg }}>
                <HeroBadge name="pin" />
                <View style={{ alignItems: 'center', gap: Space.xs }}>
                  <Text variant="title" center>
                    Where do you live?
                  </Text>
                  <Text variant="body" color="inkSecondary" center>
                    We personalize spending and funding to your area. Enter your ZIP and we do the rest.
                  </Text>
                </View>
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Space.sm }}>
                    <Text variant="label" color="inkSecondary">
                      ZIP code
                    </Text>
                    <Pressable onPress={useMyLocation} accessibilityRole="button" accessibilityLabel="Use my location to fill ZIP" hitSlop={8}>
                      <Text variant="label" color="accent">
                        {locating ? 'Locating...' : 'Use my location'}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={zip}
                    onChangeText={(t) => setZip(t.replace(/[^0-9]/g, '').slice(0, 5))}
                    keyboardType="number-pad"
                    placeholder="5 digits, e.g. 94103"
                    placeholderTextColor={theme.colors.inkMuted}
                    style={fieldStyle}
                    accessibilityLabel="Five digit ZIP code"
                    returnKeyType="done"
                  />
                  {zip.length > 0 && !zipValid && (
                    <Text variant="caption" color="accent" style={{ marginTop: Space.sm }}>
                      ZIP must be exactly 5 digits.
                    </Text>
                  )}
                  <Text variant="caption" color="inkMuted" style={{ marginTop: Space.sm }}>
                    Stored only on your device. No account required.
                  </Text>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={{ gap: Space.lg }}>
                <HeroBadge name="chart" />
                <View style={{ alignItems: 'center', gap: Space.xs }}>
                  <Text variant="title" center>
                    Track investments?
                  </Text>
                  <Text variant="body" color="inkSecondary" center>
                    Optional. Add tickers to see how government and market events relate to your money.
                    We never ask for brokerage logins.
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: Space.sm }}>
                  <TextInput
                    value={ticker}
                    onChangeText={(t) => setTicker(t.toUpperCase())}
                    placeholder="e.g. NVDA, VOO, BTC-USD"
                    placeholderTextColor={theme.colors.inkMuted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={[fieldStyle, { flex: 1 }]}
                    onSubmitEditing={() => {
                      if (ticker.trim()) {
                        void addWatch({ symbol: ticker.trim(), name: ticker.trim() });
                        setTicker('');
                      }
                    }}
                    accessibilityLabel="Add a stock ticker"
                  />
                  <Pressable
                    onPress={() => {
                      if (ticker.trim()) {
                        void addWatch({ symbol: ticker.trim(), name: ticker.trim() });
                        setTicker('');
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add ticker"
                    style={{ paddingHorizontal: Space.lg, justifyContent: 'center', borderRadius: Radius.md, backgroundColor: theme.colors.accent }}>
                    <Text variant="bodyStrong" color="onAccent">
                      Add
                    </Text>
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
                  {SUGGESTED_TICKERS.map((sym) => {
                    const added = watchItems.some((w) => w.symbol === sym);
                    return (
                      <Pressable
                        key={sym}
                        onPress={() => (added ? removeWatch(sym) : addWatch({ symbol: sym, name: sym }))}
                        accessibilityRole="button"
                        accessibilityLabel={`${added ? 'Remove' : 'Add'} ${sym}`}
                        style={{
                          paddingHorizontal: Space.lg,
                          paddingVertical: Space.sm,
                          borderRadius: Radius.pill,
                          borderWidth: 1.5,
                          borderColor: added ? theme.colors.accent : theme.colors.line,
                          backgroundColor: added ? theme.colors.accentSoft : theme.colors.surface,
                        }}>
                        <Text variant="label" color={added ? 'accent' : 'inkSecondary'}>
                          {added ? '✓ ' : ''}
                          {sym}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {watchItems.length > 0 && (
                  <Text variant="caption" color="inkMuted">
                    Tracking {watchItems.length} {watchItems.length === 1 ? 'ticker' : 'tickers'}. You can change this anytime in Stocks.
                  </Text>
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Footer nav */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Space.xl,
            paddingTop: Space.md,
            paddingBottom: insets.bottom + Space.md,
            gap: Space.md,
          }}>
          {step > firstStep ? (
            <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} style={{ paddingVertical: Space.md, paddingHorizontal: Space.lg }}>
              <Text variant="bodyStrong" color="inkSecondary">
                Back
              </Text>
            </Pressable>
          ) : (
            <View style={{ width: 1 }} />
          )}
          <Button
            label={step >= lastStep ? (editing ? 'Save' : 'Start exploring') : 'Next'}
            onPress={next}
            disabled={!canAdvance}
            style={{ flex: 1, maxWidth: 220 }}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
