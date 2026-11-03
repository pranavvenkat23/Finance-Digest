/**
 * A tappable dashboard card: icon + title, an optional right-side meta label with
 * chevron, body content, and an optional footer (badges / source chip).
 */

import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { TabBarIcon, type IconName } from '@/components/ui/TabBarIcon';
import { Text } from '@/components/ui/Text';
import { Radius, Space, useTheme } from '@/lib/theme';

export function DashboardCard({
  icon,
  title,
  rightLabel,
  onPress,
  children,
  footer,
}: {
  icon: IconName;
  title: string;
  rightLabel?: string;
  onPress?: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.surface,
        borderRadius: Radius.lg,
        padding: Space.lg,
        borderWidth: 1,
        borderColor: theme.colors.line,
        gap: Space.md,
        opacity: pressed && onPress ? 0.85 : 1,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm, flex: 1 }}>
          <TabBarIcon name={icon} color={theme.colors.ink} size={20} />
          <Text variant="headline" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </Text>
        </View>
        {rightLabel != null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text variant="caption" color="inkMuted">
              {rightLabel}
            </Text>
            <Text variant="caption" color="inkMuted">
              ›
            </Text>
          </View>
        )}
      </View>
      {children}
      {footer}
    </Pressable>
  );
}

/** Small source / status chip, e.g. "Estimated" or a sourced link badge. */
export function Chip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'positive' | 'warn';
}) {
  const theme = useTheme();
  const bg =
    tone === 'accent'
      ? theme.colors.accentSoft
      : tone === 'warn'
        ? '#FBEFD6'
        : theme.colors.elevated;
  const fg =
    tone === 'accent'
      ? theme.colors.accent
      : tone === 'positive'
        ? theme.colors.positive
        : tone === 'warn'
          ? '#9A6A12'
          : theme.colors.inkSecondary;
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: Space.md, paddingVertical: 4, borderRadius: Radius.pill, backgroundColor: bg }}>
      <Text variant="caption" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}
