/**
 * Tappable external source link, opens in an in-app browser. Used everywhere a
 * dollar figure needs to cite its source ("every number is traceable").
 */

import { openBrowserAsync } from 'expo-web-browser';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Space } from '@/lib/theme';

export function SourceLink({
  url,
  label,
  variant = 'caption',
}: {
  url: string;
  label: string;
  variant?: 'caption' | 'label' | 'body';
}) {
  return (
    <Pressable
      onPress={() => openBrowserAsync(url)}
      accessibilityRole="link"
      accessibilityLabel={`${label}. Opens in browser.`}
      hitSlop={Space.sm}>
      <Text variant={variant} color="accent">
        {label} ↗
      </Text>
    </Pressable>
  );
}
