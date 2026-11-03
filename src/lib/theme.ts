/**
 * Design system for "Finance Digest".
 *
 * Clean and modern: near-white backgrounds, a single confident blue accent,
 * crisp flat cards, and a "money green" used sparingly for positive figures.
 * One accent used intentionally, not a rainbow. Light and dark both first-class.
 */

import { Platform, useColorScheme } from 'react-native';

export type Palette = {
  /** App shell background (warm neutral). */
  appBg: string;
  /** Card / sheet surface. */
  surface: string;
  /** Faux-paper background for the receipt hero. */
  paper: string;
  /** Hairline rules and borders. */
  line: string;
  /** Primary text (deep ink). */
  ink: string;
  /** Secondary / supporting text. */
  inkSecondary: string;
  /** Muted text (captions, sources). */
  inkMuted: string;
  /** Single brand accent. */
  accent: string;
  /** Accent text-on-accent. */
  onAccent: string;
  /** Soft accent wash for fills/bars. */
  accentSoft: string;
  /** Positive / money-returned semantic. */
  positive: string;
  /** Subtle elevated element (chips, inactive). */
  elevated: string;
};

const light: Palette = {
  appBg: '#F5F7FA',
  surface: '#FFFFFF',
  paper: '#FFFFFF',
  line: '#E6E9EF',
  ink: '#0B1220',
  inkSecondary: '#5B6472',
  inkMuted: '#9AA1AD',
  accent: '#2F6FED',
  onAccent: '#FFFFFF',
  accentSoft: '#E8F0FE',
  positive: '#1E9E6A',
  elevated: '#EEF1F6',
};

const dark: Palette = {
  appBg: '#0B1220',
  surface: '#141B2B',
  paper: '#141B2B',
  line: '#263043',
  ink: '#F2F5FA',
  inkSecondary: '#AEB6C4',
  inkMuted: '#6B7587',
  accent: '#5B8DEF',
  onAccent: '#0B1220',
  accentSoft: '#16233D',
  positive: '#3FBC86',
  elevated: '#1B2436',
};

export const Palettes = { light, dark } as const;

/** Typographic scale (size / lineHeight / weight). */
export const Type = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800' as const },
  headline: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
} as const;

/** Consistent spacing scale (4pt base). */
export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

/** Monospace family for receipt amounts (tabular feel). */
export const MonoFont =
  Platform.select({ ios: 'ui-monospace', android: 'monospace', default: 'monospace' }) ??
  'monospace';

export type ThemeName = 'light' | 'dark';

export type Theme = {
  name: ThemeName;
  colors: Palette;
  type: typeof Type;
  space: typeof Space;
  radius: typeof Radius;
  mono: string;
};

/** Resolve the active theme from the system color scheme. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const name: ThemeName = scheme === 'dark' ? 'dark' : 'light';
  return {
    name,
    colors: Palettes[name],
    type: Type,
    space: Space,
    radius: Radius,
    mono: MonoFont,
  };
}
