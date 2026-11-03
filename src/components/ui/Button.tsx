/**
 * Accessible pressable button, primary (filled accent) and secondary (outline).
 */

import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';

import { Radius, Space, useTheme } from '@/lib/theme';
import { Text } from './Text';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          minHeight: 52,
          paddingHorizontal: Space.xl,
          borderRadius: Radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: Space.sm,
          backgroundColor: isPrimary ? theme.colors.accent : 'transparent',
          borderWidth: isPrimary ? 0 : 1.5,
          borderColor: theme.colors.accent,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading && (
        <ActivityIndicator
          size="small"
          color={isPrimary ? theme.colors.onAccent : theme.colors.accent}
        />
      )}
      <View>
        <Text
          variant="bodyStrong"
          color={isPrimary ? 'onAccent' : 'accent'}
          style={{ fontWeight: '700' }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
