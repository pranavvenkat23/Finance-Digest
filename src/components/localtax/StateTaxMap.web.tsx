/**
 * Web fallback for StateTaxMap (react-native-maps is native-only). Shows a ranked
 * comparison strip instead of a map. The full interactive map is on iOS.
 */

import { ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { allStatesSummary } from '@/lib/stateTax';
import { Radius, Space, useTheme } from '@/lib/theme';

export function StateTaxMap({
  userState,
  onSelect,
  height = 300,
}: {
  userState: string | null;
  onSelect: (abbr: string) => void;
  height?: number;
}) {
  const theme = useTheme();
  const rows = allStatesSummary()
    .map((s) => ({ ...s, burden: s.topIncomeRate + s.salesCombined }))
    .sort((a, b) => a.burden - b.burden);

  return (
    <View style={{ height, borderRadius: 16, backgroundColor: theme.colors.elevated, borderWidth: 1, borderColor: theme.colors.line, padding: Space.md }}>
      <Text variant="caption" color="inkMuted" style={{ marginBottom: Space.sm }}>
        Interactive map on iOS. States ranked low to high tax burden:
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {rows.map((s) => (
          <View
            key={s.abbr}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 6,
              paddingHorizontal: Space.sm,
              borderRadius: Radius.sm,
              backgroundColor: s.abbr === userState ? theme.colors.accentSoft : 'transparent',
            }}>
            <Text variant="caption" color={s.abbr === userState ? 'accent' : 'inkSecondary'}>
              {s.name}
            </Text>
            <Text variant="caption" mono color="inkMuted">
              inc {(s.topIncomeRate * 100).toFixed(1)}% · sales {(s.salesCombined * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
