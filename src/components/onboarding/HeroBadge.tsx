/**
 * Large circular icon badge for the top of each onboarding step.
 */

import { View } from 'react-native';

import { TabBarIcon, type IconName } from '@/components/ui/TabBarIcon';
import { useTheme } from '@/lib/theme';

export function HeroBadge({ name, size = 96 }: { name: IconName; size?: number }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <TabBarIcon name={name} color={theme.colors.accent} size={size * 0.5} />
      </View>
    </View>
  );
}
