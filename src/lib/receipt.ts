/**
 * Receipt engine, pure, unit-tested, the SINGLE source of allocation math.
 *
 * The Receipt screen and the What-If simulator both call into here; there is no
 * second engine. Everything is transparent arithmetic on the bundled, sourced
 * federal outlays snapshot, no fabricated numbers, no macroeconomic modeling.
 *
 * Allocation: the user's federal income tax is split across budget functions in
 * proportion to each function's share of total federal outlays. Because the
 * shares sum to exactly 1, the allocated line items sum to the income tax total.
 */

import snapshot from '@/data/federal-outlays-snapshot.json';
import { federalIncomeTax, payrollTaxes, type FilingStatus, type PayrollTaxes } from '@/lib/tax';

export type OutlayCategory = {
  id: string;
  functionCode: string;
  name: string;
  shortName: string;
  /** FY2025 net outlay in dollars (can be negative for offset functions). */
  amount: number;
  icon: string;
  explainer: string;
};

export const OUTLAY_CATEGORIES: OutlayCategory[] = snapshot.categories as OutlayCategory[];

export const SNAPSHOT_META = {
  fiscalYear: snapshot.fiscalYear,
  totalOutlays: snapshot.totalOutlays,
  source: snapshot.source,
  sourceShort: snapshot.sourceShort,
  sourceUrl: snapshot.sourceUrl,
  retrieved: snapshot.retrieved,
} as const;

export type ReceiptLine = OutlayCategory & {
  /** Fraction of total outlays (and thus of the user's income tax). */
  share: number;
  /** Dollars of the user's income tax allocated to this category. */
  allocated: number;
};

export type Receipt = {
  grossIncome: number;
  status: FilingStatus;
  /** Total federal income tax, the sum the line items allocate. */
  incomeTax: number;
  /** Sum of all allocated line items (== incomeTax up to floating point). */
  totalAllocated: number;
  lines: ReceiptLine[];
  payroll: PayrollTaxes;
  meta: typeof SNAPSHOT_META;
};

/** Map of categoryId -> outlay amount, defaulting to the snapshot. */
export type AmountMap = Record<string, number>;

/** Snapshot amounts as a fresh, mutable map (base state for the What-If). */
export function baseAmounts(): AmountMap {
  const map: AmountMap = {};
  for (const c of OUTLAY_CATEGORIES) map[c.id] = c.amount;
  return map;
}

/** Sum of a set of amounts (the allocation denominator). */
export function sumAmounts(amounts: AmountMap): number {
  return OUTLAY_CATEGORIES.reduce((acc, c) => acc + (amounts[c.id] ?? c.amount), 0);
}

/**
 * Compute a receipt. With no `adjustedAmounts`, this is the real receipt. The
 * What-If screen passes adjusted amounts and/or a different income, the math is
 * identical, which is the whole point.
 */
export function computeReceipt(params: {
  grossIncome: number;
  status: FilingStatus;
  adjustedAmounts?: AmountMap;
}): Receipt {
  const { grossIncome, status, adjustedAmounts } = params;
  const incomeTax = federalIncomeTax(grossIncome, status);
  const amounts = adjustedAmounts ?? baseAmounts();
  const denom = sumAmounts(amounts);

  const lines: ReceiptLine[] = OUTLAY_CATEGORIES.map((c) => {
    const amount = amounts[c.id] ?? c.amount;
    const share = denom !== 0 ? amount / denom : 0;
    return { ...c, amount, share, allocated: incomeTax * share };
  }).sort((a, b) => b.allocated - a.allocated);

  const totalAllocated = lines.reduce((acc, l) => acc + l.allocated, 0);

  return {
    grossIncome,
    status,
    incomeTax,
    totalAllocated,
    lines,
    payroll: payrollTaxes(grossIncome),
    meta: SNAPSHOT_META,
  };
}

/**
 * What-If primitive: move exact dollars from one category to another. Returns a
 * NEW amount map; the sum is invariant (conservation of money, the simulator
 * can never invent or destroy dollars).
 */
export function transferDollars(
  amounts: AmountMap,
  fromId: string,
  toId: string,
  dollars: number,
): AmountMap {
  const next: AmountMap = { ...amounts };
  next[fromId] = (next[fromId] ?? 0) - dollars;
  next[toId] = (next[toId] ?? 0) + dollars;
  return next;
}

export type Reallocation = {
  fromId: string;
  toId: string;
  /** Fraction (0..1) of the source category's BASE outlay to redirect. */
  percent: number;
};

/**
 * Apply a set of reallocations to the base snapshot amounts. Each reallocation
 * cuts `percent` of the source's base outlay and redirects it to the target.
 * Only positive source outlays can be cut. Every transfer conserves the total.
 */
export function applyReallocations(reallocations: Reallocation[]): AmountMap {
  const base = baseAmounts();
  let amounts = base;
  for (const r of reallocations) {
    const sourceBase = base[r.fromId] ?? 0;
    if (sourceBase <= 0 || r.percent <= 0 || r.fromId === r.toId) continue;
    const dollars = sourceBase * Math.min(1, Math.max(0, r.percent));
    amounts = transferDollars(amounts, r.fromId, r.toId, dollars);
  }
  return amounts;
}

/**
 * Pick a striking, true comparison from the receipt (e.g. interest on the debt
 * vs. science & space). Returns null if either side is non-positive.
 */
export function buildHeadline(
  receipt: Receipt,
): { bigger: ReceiptLine; smaller: ReceiptLine; ratio: number } | null {
  const byId = (id: string) => receipt.lines.find((l) => l.id === id);
  const interest = byId('net_interest');
  const science = byId('science_space');
  if (!interest || !science || science.allocated <= 0 || interest.allocated <= 0) return null;
  return {
    bigger: interest,
    smaller: science,
    ratio: interest.allocated / science.allocated,
  };
}
