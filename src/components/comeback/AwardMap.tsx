/**
 * Map of federal awards near the user's ZIP.
 *
 * Uses react-native-maps with PROVIDER_DEFAULT → Apple Maps on iOS, which works
 * in Expo Go with NO API key. Pin positions are approximate (ZIP-level) by design.
 *
 * ANDROID NOTE: for a production Android build, Google Maps requires an API key
 * configured at `expo.android.config.googleMaps.apiKey` in app.json. It is
 * intentionally omitted here so the project runs key-free in Expo Go on iOS.
 */

import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import type { Award } from '@/lib/api/usaspending';
import { awardSourceUrl } from '@/lib/api/usaspending';
import { formatCompactDollars } from '@/lib/format';
import type { Region } from '@/lib/geo';
import { useTheme } from '@/lib/theme';
import { openBrowserAsync } from 'expo-web-browser';

export function AwardMap({
  region,
  awards,
  height = 280,
}: {
  region: Region;
  awards: Award[];
  height?: number;
}) {
  const theme = useTheme();
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ width: '100%', height }}
      initialRegion={region}
      userInterfaceStyle={theme.name}
      accessibilityLabel="Map of federal awards near your ZIP code">
      {awards.map((a) => (
        <Marker
          key={`${a.internalId}-${a.id}`}
          coordinate={{ latitude: a.lat, longitude: a.lng }}
          pinColor={a.type === 'grant' ? theme.colors.positive : theme.colors.accent}
          title={`${a.recipient} · ${formatCompactDollars(a.amount)}`}
          description={`${a.agency}, tap to view the source record`}
          onCalloutPress={() => openBrowserAsync(awardSourceUrl(a))}
        />
      ))}
    </MapView>
  );
}
