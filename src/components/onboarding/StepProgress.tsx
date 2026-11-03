/**
 * Slim onboarding progress bar (filled fraction = completed steps).
 */

import { View } from 'react-native';

import { Radius, useTheme } from '@/lib/theme';

export function StepProgress({ step, total }: { step: number; total: number }) {
  const theme = useTheme();
  const fraction = Math.min(1, Math.max(0, (step + 1) / total));
  return (
    <View
      style={{
        height: 4,
        borderRadius: Radius.pill,
        backgroundColor: theme.colors.elevated,
        overflow: 'hidden',
      }}>
      <View
        style={{
          height: '100%',
          width: `${fraction * 100}%`,
          borderRadius: Radius.pill,
          backgroundColor: theme.colors.accent,
        }}
      />
    </View>
  );
}
