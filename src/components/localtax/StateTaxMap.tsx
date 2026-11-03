/**
 * A map of state tax burden. Each state is a dot colored from low (green) to
 * high (red) by its combined top income rate plus average sales tax. The user's
 * state is ringed. Tapping a dot selects it. Apple Maps via PROVIDER_DEFAULT,
 * no API key in Expo Go on iOS.
 *
 * ANDROID NOTE: a production Android build needs a Google Maps key at
 * expo.android.config.googleMaps.apiKey (placeholder set in app.json).
 */

import { useMemo, useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { Text } from '@/components/ui/Text';
import { allStatesSummary } from '@/lib/stateTax';
import { Space, useTheme } from '@/lib/theme';
import centroidsData from '@/data/state-centroids.json';

const CENTROIDS = centroidsData as unknown as Record<string, [number, number]>;

function lerpColor(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function StateTaxMap({
  userState,
  onSelect,
  height = 300,
}: {
  userState: string | null;
  onSelect: (abbr: string) => void;
  height?: number;
}) {
  const theme = useTheme();
  const [selected, setSelected] = useState<string | null>(userState);

  const { rows, minB, maxB } = useMemo(() => {
    const summary = allStatesSummary();
    const burdens = summary.map((s) => s.topIncomeRate + s.salesCombined);
    return { rows: summary, minB: Math.min(...burdens), maxB: Math.max(...burdens) };
  }, []);

  const region = useMemo(() => {
    const c = (userState && CENTROIDS[userState]) || [39.5, -98.35];
    const zoom = userState ? { latitudeDelta: 12, longitudeDelta: 12 } : { latitudeDelta: 60, longitudeDelta: 60 };
    return { latitude: c[0], longitude: c[1], ...zoom };
  }, [userState]);

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden' }}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ width: '100%', height }}
        initialRegion={region}
        userInterfaceStyle={theme.name}
        accessibilityLabel="Map of state tax burden">
        {rows.map((s) => {
          const c = CENTROIDS[s.abbr];
          if (!c) return null;
          const t = maxB > minB ? (s.topIncomeRate + s.salesCombined - minB) / (maxB - minB) : 0.5;
          const color = lerpColor('#2E7D5B', '#BE4A2F', t);
          const isUser = s.abbr === userState;
          const isSel = s.abbr === selected;
          return (
            <Marker
              key={s.abbr}
              coordinate={{ latitude: c[0], longitude: c[1] }}
              onPress={() => {
                setSelected(s.abbr);
                onSelect(s.abbr);
              }}
              title={`${s.name}`}
              description={`Top income ${(s.topIncomeRate * 100).toFixed(2)}%, sales ${(s.salesCombined * 100).toFixed(2)}%`}>
              <View
                style={{
                  width: isUser ? 20 : 14,
                  height: isUser ? 20 : 14,
                  borderRadius: 12,
                  backgroundColor: color,
                  borderWidth: isUser || isSel ? 3 : 1.5,
                  borderColor: isUser ? theme.colors.ink : '#ffffff',
                }}
              />
            </Marker>
          );
        })}
      </MapView>
      {/* Legend */}
      <View
        style={{
          position: 'absolute',
          bottom: Space.sm,
          left: Space.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.xs,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: Space.sm,
          paddingVertical: 4,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.line,
        }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D5B' }} />
        <Text variant="caption" color="inkMuted">
          lower tax
        </Text>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#BE4A2F', marginLeft: Space.xs }} />
        <Text variant="caption" color="inkMuted">
          higher
        </Text>
      </View>
    </View>
  );
}
