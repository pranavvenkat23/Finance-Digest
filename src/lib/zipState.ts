/**
 * ZIP code to U.S. state, fully offline.
 *
 * Maps the first three ZIP digits to a state using the standard USPS ZIP-prefix
 * assignments. Self-contained (no dataset download, no runtime geocoding).
 * Territories (PR, VI, GU) and unassigned prefixes return null.
 */

type Range = { min: number; max: number; state: string };

// Standard USPS 3-digit ZIP prefix to state assignments.
const RANGES: Range[] = [
  { min: 5, max: 5, state: 'NY' },
  { min: 10, max: 27, state: 'MA' },
  { min: 28, max: 29, state: 'RI' },
  { min: 30, max: 38, state: 'NH' },
  { min: 39, max: 49, state: 'ME' },
  { min: 50, max: 54, state: 'VT' },
  { min: 55, max: 55, state: 'MA' },
  { min: 56, max: 59, state: 'VT' },
  { min: 60, max: 69, state: 'CT' },
  { min: 70, max: 89, state: 'NJ' },
  { min: 100, max: 149, state: 'NY' },
  { min: 150, max: 196, state: 'PA' },
  { min: 197, max: 199, state: 'DE' },
  { min: 200, max: 205, state: 'DC' },
  { min: 206, max: 219, state: 'MD' },
  { min: 220, max: 246, state: 'VA' },
  { min: 247, max: 268, state: 'WV' },
  { min: 270, max: 289, state: 'NC' },
  { min: 290, max: 299, state: 'SC' },
  { min: 300, max: 319, state: 'GA' },
  { min: 320, max: 349, state: 'FL' },
  { min: 350, max: 369, state: 'AL' },
  { min: 370, max: 385, state: 'TN' },
  { min: 386, max: 397, state: 'MS' },
  { min: 398, max: 399, state: 'GA' },
  { min: 400, max: 427, state: 'KY' },
  { min: 430, max: 459, state: 'OH' },
  { min: 460, max: 479, state: 'IN' },
  { min: 480, max: 499, state: 'MI' },
  { min: 500, max: 528, state: 'IA' },
  { min: 530, max: 549, state: 'WI' },
  { min: 550, max: 567, state: 'MN' },
  { min: 569, max: 569, state: 'DC' },
  { min: 570, max: 577, state: 'SD' },
  { min: 580, max: 588, state: 'ND' },
  { min: 590, max: 599, state: 'MT' },
  { min: 600, max: 629, state: 'IL' },
  { min: 630, max: 658, state: 'MO' },
  { min: 660, max: 679, state: 'KS' },
  { min: 680, max: 693, state: 'NE' },
  { min: 700, max: 714, state: 'LA' },
  { min: 716, max: 729, state: 'AR' },
  { min: 733, max: 733, state: 'TX' },
  { min: 730, max: 749, state: 'OK' },
  { min: 750, max: 799, state: 'TX' },
  { min: 800, max: 816, state: 'CO' },
  { min: 820, max: 831, state: 'WY' },
  { min: 832, max: 838, state: 'ID' },
  { min: 840, max: 847, state: 'UT' },
  { min: 850, max: 865, state: 'AZ' },
  { min: 870, max: 884, state: 'NM' },
  { min: 885, max: 885, state: 'TX' },
  { min: 889, max: 898, state: 'NV' },
  { min: 900, max: 961, state: 'CA' },
  { min: 967, max: 968, state: 'HI' },
  { min: 970, max: 979, state: 'OR' },
  { min: 980, max: 994, state: 'WA' },
  { min: 995, max: 999, state: 'AK' },
];

/** Two-letter state (or DC) for a 5-digit ZIP, or null if unknown/territory. */
export function stateForZip(zip: string): string | null {
  if (!/^\d{3,5}/.test(zip)) return null;
  const prefix = parseInt(zip.slice(0, 3), 10);
  if (Number.isNaN(prefix)) return null;
  for (const r of RANGES) {
    if (prefix >= r.min && prefix <= r.max) return r.state;
  }
  return null;
}
