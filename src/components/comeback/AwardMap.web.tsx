/**
 * Web fallback for AwardMap. react-native-maps is native-only (it relies on
 * codegenNativeComponent, which doesn't exist on react-native-web), so on web we
 * render a designed placeholder instead. The full Apple Maps experience is on
 * iOS via Expo Go / the App Store build. The award list below is unaffected.
 */

import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Award } from '@/lib/api/usaspending';
import type { Region } from '@/lib/geo';
import { Space, useTheme } from '@/lib/theme';

export function AwardMap({ awards, height = 280 }: { region: Region; awards: Award[]; height?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height,
        marginHorizontal: Space.xl,
        borderRadius: 16,
        backgroundColor: theme.colors.elevated,
        borderWidth: 1,
        borderColor: theme.colors.line,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Space.sm,
        padding: Space.xl,
      }}>
      <Text style={{ fontSize: 36 }}>🗺️</Text>
      <Text variant="bodyStrong" center>
        Interactive map on iOS
      </Text>
      <Text variant="caption" color="inkSecondary" center>
        {awards.length} awards plotted on Apple Maps in the mobile app. Tap any item below to open its
        federal source record.
      </Text>
    </View>
  );
}
