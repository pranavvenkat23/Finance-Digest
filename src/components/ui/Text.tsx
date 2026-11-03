/**
 * Themed text primitive with a fixed type scale and semantic colors.
 * VoiceOver/dynamic-type friendly (uses RN's allowFontScaling by default).
 */

import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type Type } from '@/lib/theme';

type Variant = keyof typeof Type;
type ColorKey = 'ink' | 'inkSecondary' | 'inkMuted' | 'accent' | 'positive' | 'onAccent';

export type TextProps = RNTextProps & {
  variant?: Variant;
  color?: ColorKey;
  mono?: boolean;
  center?: boolean;
};

export function Text({
  variant = 'body',
  color = 'ink',
  mono = false,
  center = false,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const t = theme.type[variant];
  return (
    <RNText
      style={[
        {
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          fontWeight: t.fontWeight,
          color: theme.colors[color],
          fontFamily: mono ? theme.mono : undefined,
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
}
