/**
 * "What is this?" explainer sheet for a budget category. Shows the plain-language
 * explainer, the dollar amount allocated, this category's share, and the source.
 */

import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { formatDollarsCents, formatPercent } from '@/lib/format';
import type { ReceiptLine } from '@/lib/receipt';
import { SNAPSHOT_META } from '@/lib/receipt';
import { Radius, Space, useTheme } from '@/lib/theme';
import { SourceLink } from '@/components/ui/SourceLink';

export function CategorySheet({
  line,
  onClose,
}: {
  line: ReceiptLine | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const visible = line !== null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close"
        style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' }}>
        {/* Stop propagation so taps inside the sheet don't dismiss it. */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: Radius.lg,
            borderTopRightRadius: Radius.lg,
            padding: Space.xl,
            paddingBottom: insets.bottom + Space.xl,
            gap: Space.md,
          }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.line }} />
          {line && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
                <Text variant="title">{line.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="headline">{line.name}</Text>
                  <Text variant="caption" color="inkMuted">
                    Budget function {line.functionCode}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: Space.xl, marginTop: Space.sm }}>
                <View>
                  <Text variant="caption" color="inkMuted">
                    Your share
                  </Text>
                  <Text variant="headline" color="accent" mono>
                    {formatDollarsCents(line.allocated)}
                  </Text>
                </View>
                <View>
                  <Text variant="caption" color="inkMuted">
                    of federal outlays
                  </Text>
                  <Text variant="headline" mono>
                    {formatPercent(line.share)}
                  </Text>
                </View>
              </View>

              <Text variant="body" color="inkSecondary" style={{ marginTop: Space.sm }}>
                {line.explainer}
              </Text>

              <View
                style={{
                  marginTop: Space.sm,
                  padding: Space.md,
                  borderRadius: Radius.md,
                  backgroundColor: theme.colors.appBg,
                  gap: 4,
                }}>
                <Text variant="caption" color="inkMuted">
                  Source
                </Text>
                <Text variant="caption" color="inkSecondary">
                  {SNAPSHOT_META.sourceShort}
                </Text>
                <SourceLink url={SNAPSHOT_META.sourceUrl} label="View the data" />
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
