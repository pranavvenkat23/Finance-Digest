/**
 * One itemized receipt line: icon, category, a mini proportional bar, the
 * allocated dollars (monospaced), and an info affordance. Negative allocations
 * (accounting credits) are styled distinctly and honestly.
 */

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { formatDollarsCents } from '@/lib/format';
import type { ReceiptLine } from '@/lib/receipt';
import { Radius, Space, useTheme } from '@/lib/theme';

export function ReceiptLineRow({
  line,
  maxAllocated,
  onPress,
}: {
  line: ReceiptLine;
  /** Largest positive allocation, for scaling the mini bar. */
  maxAllocated: number;
  onPress: (line: ReceiptLine) => void;
}) {
  const theme = useTheme();
  const isCredit = line.allocated < 0;
  const barFrac = maxAllocated > 0 ? Math.min(1, Math.abs(line.allocated) / maxAllocated) : 0;

  return (
    <Pressable
      onPress={() => onPress(line)}
      accessibilityRole="button"
      accessibilityLabel={`${line.name}. ${formatDollarsCents(line.allocated)}. Tap to learn more.`}
      style={({ pressed }) => ({
        paddingVertical: Space.md,
        opacity: pressed ? 0.6 : 1,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
        <Text variant="body" style={{ width: 24, textAlign: 'center' }}>
          {line.icon}
        </Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, marginRight: Space.sm }}>
              {line.shortName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text variant="bodyStrong" mono color={isCredit ? 'positive' : 'ink'}>
                {isCredit ? '(' : ''}
                {formatDollarsCents(Math.abs(line.allocated))}
                {isCredit ? ')' : ''}
              </Text>
              <Text variant="caption" color="inkMuted">
                ⓘ
              </Text>
            </View>
          </View>
          {/* mini bar */}
          <View
            style={{
              height: 5,
              marginTop: 6,
              borderRadius: Radius.sm,
              backgroundColor: theme.colors.elevated,
              overflow: 'hidden',
            }}>
            <View
              style={{
                height: '100%',
                width: `${Math.max(2, barFrac * 100)}%`,
                borderRadius: Radius.sm,
                backgroundColor: isCredit ? theme.colors.positive : theme.colors.accent,
                opacity: isCredit ? 0.6 : 1,
              }}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
