/**
 * A dollar amount that counts up smoothly on mount / when the value changes.
 * JS-driven rAF tween (cubic ease-out), reliable and Intl-formatted each frame.
 * Honors reduced-motion by snapping to the final value.
 */

import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { formatDollars } from '@/lib/format';
import { Text, type TextProps } from '@/components/ui/Text';

type Props = Omit<TextProps, 'children'> & {
  value: number;
  durationMs?: number;
};

export function AnimatedDollars({ value, durationMs = 900, ...textProps }: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const from = fromRef.current;
    const delta = value - from;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced || delta === 0) {
        fromRef.current = value;
        setDisplay(value);
        return;
      }
      const start = Date.now();
      const tick = () => {
        const t = Math.min(1, (Date.now() - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(from + delta * eased);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          fromRef.current = value;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return (
    <Text {...textProps} accessibilityLabel={formatDollars(value)}>
      {formatDollars(display)}
    </Text>
  );
}
