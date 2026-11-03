/**
 * Faux-paper receipt surface with a perforated (zig-zag) top and bottom edge,
 * drawn with react-native-svg. The tactile "ticket" motif for the hero.
 */

import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Radius, Space, useTheme } from '@/lib/theme';

function Perforation({ color, flip }: { color: string; flip?: boolean }) {
  const width = 320;
  const tooth = 12;
  const h = 8;
  let d = `M0 ${flip ? 0 : h}`;
  for (let x = 0; x < width; x += tooth) {
    d += ` L${x + tooth / 2} ${flip ? h : 0} L${x + tooth} ${flip ? 0 : h}`;
  }
  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="none">
      <Path d={d + ` L${width} ${flip ? h : h} L0 ${flip ? h : h} Z`} fill={color} />
    </Svg>
  );
}

export function PaperCard({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        shadowColor: '#000',
        shadowOpacity: theme.name === 'dark' ? 0.4 : 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
      }}>
      <Perforation color={theme.colors.paper} />
      <View
        style={{
          backgroundColor: theme.colors.paper,
          paddingHorizontal: Space.xl,
          paddingVertical: Space.lg,
        }}>
        {children}
      </View>
      <View style={{ transform: [{ scaleY: -1 }] }}>
        <Perforation color={theme.colors.paper} />
      </View>
    </View>
  );
}

/** A dashed horizontal rule, like a receipt's tear line. */
export function DashedRule() {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        marginVertical: Space.md,
        borderBottomWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.line,
        borderRadius: Radius.sm,
      }}
    />
  );
}
