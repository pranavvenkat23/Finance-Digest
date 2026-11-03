/**
 * Safe-area screen wrapper with the app-shell background and consistent padding.
 */

import type { ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Space, useTheme } from '@/lib/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  /** Background color key; defaults to the warm app background. */
  background?: 'appBg' | 'surface' | 'paper';
  padded?: boolean;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  scroll = false,
  background = 'appBg',
  padded = true,
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bg = theme.colors[background];

  const padding: ViewStyle = padded
    ? { paddingHorizontal: Space.xl, paddingTop: Space.lg }
    : {};

  if (scroll) {
    return (
      <ScrollView
        style={{ backgroundColor: bg }}
        contentContainerStyle={[
          padding,
          { paddingTop: insets.top + Space.sm, paddingBottom: insets.bottom + Space.xxxl },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        { flex: 1, backgroundColor: bg, paddingTop: insets.top },
        padding,
        contentStyle,
      ]}>
      {children}
    </View>
  );
}
