/**
 * Donut summary of the top receipt categories, drawn with react-native-svg.
 * Monochrome accent ramp (one color, varied opacity) keeps it on-brand.
 */

import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { formatPercent } from '@/lib/format';
import { Space, useTheme } from '@/lib/theme';

export type DonutSegment = { id: string; label: string; value: number };

const RAMP = [1, 0.78, 0.6, 0.45, 0.33, 0.24];

export function DonutChart({
  segments,
  size = 200,
  strokeWidth = 26,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
}) {
  const theme = useTheme();
  const positive = segments.filter((s) => s.value > 0);
  const total = positive.reduce((a, s) => a + s.value, 0);
  if (total <= 0) return null;

  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const center = size / 2;

  let acc = 0;
  const arcs = positive.map((s, i) => {
    const frac = s.value / total;
    const dash = frac * circ;
    const offset = -acc;
    acc += dash;
    const opacity = i < RAMP.length ? RAMP[i] : 0.18;
    return (
      <Circle
        key={s.id}
        cx={center}
        cy={center}
        r={r}
        stroke={theme.colors.accent}
        strokeOpacity={opacity}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={offset}
        fill="none"
        strokeLinecap="butt"
      />
    );
  });

  const top = positive[0];

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        {/* Rotate via a View transform (clean on web + native) so arcs start at top. */}
        <View style={{ transform: [{ rotate: '-90deg' }] }}>
          <Svg width={size} height={size} accessibilityLabel="Donut chart of top spending categories">
            {/* track */}
            <Circle
              cx={center}
              cy={center}
              r={r}
              stroke={theme.colors.line}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {arcs}
          </Svg>
        </View>
        {/* center label */}
        <View style={{ position: 'absolute', alignItems: 'center', paddingHorizontal: Space.lg }}>
          <Text variant="caption" color="inkMuted">
            Biggest share
          </Text>
          <Text variant="bodyStrong" center numberOfLines={2} style={{ marginTop: 2 }}>
            {top.label}
          </Text>
          <Text variant="headline" color="accent" style={{ marginTop: 2 }}>
            {formatPercent(top.value / total)}
          </Text>
        </View>
      </View>
    </View>
  );
}
