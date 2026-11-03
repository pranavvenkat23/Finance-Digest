/**
 * Minimal line icons drawn with react-native-svg (Expo Go safe, no icon font).
 */

import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type IconName =
  | 'receipt'
  | 'map'
  | 'sliders'
  | 'info'
  | 'news'
  | 'chart'
  | 'robot'
  | 'home'
  | 'bank'
  | 'pin'
  | 'dollar'
  | 'check';

const PATHS: Record<IconName, string> = {
  // Receipt with zig-zag bottom
  receipt:
    'M6 3h12v17l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3zm3 5h6M9 12h6M9 16h3',
  // Folded map
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14',
  // Sliders
  sliders: 'M4 8h10M18 8h2M4 16h2M10 16h10M14 6v4M8 14v4',
  // Info circle
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 7.5v.5',
  // Newspaper
  news: 'M4 6h13v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6zm13 1h3v11a2 2 0 01-2 2M7 9h7M7 12h7M7 15h4',
  // Bar/line chart
  chart: 'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7',
  // Robot / assistant
  robot: 'M8 8h8a2 2 0 012 2v5a2 2 0 01-2 2H8a2 2 0 01-2-2v-5a2 2 0 012-2zm4 0V5M9 12h.01M15 12h.01M4 11v3M20 11v3',
  // House
  home: 'M3 11l9-7 9 7M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9',
  // Bank / capitol
  bank: 'M3 9l9-5 9 5M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M3 21h18',
  // Location pin
  pin: 'M12 21s-6-5.7-6-10a6 6 0 1112 0c0 4.3-6 10-6 10zM12 13a2 2 0 100-4 2 2 0 000 4z',
  // Dollar sign
  dollar: 'M12 2v20M16 6.5C16 4.6 14.2 3.5 12 3.5S8 4.6 8 6.5 9.8 9 12 9.5s4 1.5 4 3.5-1.8 3-4 3-4-1.1-4-3',
  // Checkmark
  check: 'M20 6L9 17l-5-5',
};

export function TabBarIcon({
  name,
  color,
  size = 24,
}: {
  name: IconName;
  color: ColorValue;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={PATHS[name]}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
