/**
 * One federal award in the list: recipient, amount, agency, type tag, and a link
 * to the live source record on USAspending.gov.
 */

import { openBrowserAsync } from 'expo-web-browser';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { awardSourceUrl, type Award } from '@/lib/api/usaspending';
import { formatDollars } from '@/lib/format';
import { Radius, Space, useTheme } from '@/lib/theme';

export function AwardCard({ award }: { award: Award }) {
  const theme = useTheme();
  const isGrant = award.type === 'grant';
  const tagColor = isGrant ? theme.colors.positive : theme.colors.accent;

  return (
    <Pressable
      onPress={() => openBrowserAsync(awardSourceUrl(award))}
      accessibilityRole="button"
      accessibilityLabel={`${award.recipient}, ${formatDollars(award.amount)} from ${award.agency}. Tap to view the source record.`}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.line,
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Space.lg,
        marginBottom: Space.md,
        opacity: pressed ? 0.7 : 1,
      })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Space.md }}>
        <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>
          {award.recipient}
        </Text>
        <Text variant="bodyStrong" mono color="ink">
          {formatDollars(award.amount)}
        </Text>
      </View>
      <Text variant="caption" color="inkSecondary" style={{ marginTop: 4 }} numberOfLines={1}>
        {award.agency}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm, marginTop: Space.md }}>
        <View
          style={{
            paddingHorizontal: Space.sm,
            paddingVertical: 2,
            borderRadius: Radius.pill,
            backgroundColor: theme.name === 'dark' ? theme.colors.elevated : theme.colors.appBg,
          }}>
          <Text variant="caption" style={{ color: tagColor }}>
            {isGrant ? 'Grant / assistance' : 'Contract'}
          </Text>
        </View>
        <Text variant="caption" color="inkMuted">
          ZIP {award.zip5} · view source ↗
        </Text>
      </View>
    </Pressable>
  );
}
