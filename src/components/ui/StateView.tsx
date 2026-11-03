/**
 * Designed loading / empty / error states, intentional, not a bare spinner.
 */

import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Space, useTheme } from '@/lib/theme';

type Props = {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  message?: string;
  emoji?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StateView({ kind, title, message, emoji, actionLabel, onAction }: Props) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: Space.xxxl, paddingHorizontal: Space.xl, gap: Space.md }}>
      {kind === 'loading' ? (
        <ActivityIndicator size="large" color={theme.colors.accent} />
      ) : (
        <Text style={{ fontSize: 40 }}>{emoji ?? (kind === 'error' ? '⚠️' : '🔍')}</Text>
      )}
      <Text variant="headline" center>
        {title}
      </Text>
      {message && (
        <Text variant="body" color="inkSecondary" center>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" style={{ marginTop: Space.sm }} />
      )}
    </View>
  );
}
