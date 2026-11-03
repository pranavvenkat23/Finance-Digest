import { federalIncomeTax } from '@/lib/tax';
import {
  applyReallocations,
  baseAmounts,
  buildHeadline,
  computeReceipt,
  OUTLAY_CATEGORIES,
  SNAPSHOT_META,
  sumAmounts,
  transferDollars,
} from '@/lib/receipt';

const INCOMES = [0, 25000, 50000, 100000, 250000, 700000];

describe('snapshot integrity', () => {
  it('category amounts sum exactly to the published total outlays', () => {
    const sum = OUTLAY_CATEGORIES.reduce((a, c) => a + c.amount, 0);
    expect(sum).toBeCloseTo(SNAPSHOT_META.totalOutlays, 0);
  });

  it('has unique category ids', () => {
    const ids = OUTLAY_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('computeReceipt, allocations conserve the income tax total', () => {
  it.each(INCOMES)('single, gross $%d: line items sum to the income tax', (gross) => {
    const r = computeReceipt({ grossIncome: gross, status: 'single' });
    expect(r.incomeTax).toBeCloseTo(federalIncomeTax(gross, 'single'), 2);
    expect(r.totalAllocated).toBeCloseTo(r.incomeTax, 2);
  });

  it('category shares sum to 1', () => {
    const r = computeReceipt({ grossIncome: 100000, status: 'single' });
    const shareSum = r.lines.reduce((a, l) => a + l.share, 0);
    expect(shareSum).toBeCloseTo(1, 6);
  });

  it('lines are sorted by allocated dollars, descending', () => {
    const r = computeReceipt({ grossIncome: 100000, status: 'single' });
    for (let i = 1; i < r.lines.length; i++) {
      expect(r.lines[i - 1].allocated).toBeGreaterThanOrEqual(r.lines[i].allocated);
    }
  });

  it('produces a line for every budget function', () => {
    const r = computeReceipt({ grossIncome: 60000, status: 'single' });
    expect(r.lines.length).toBe(OUTLAY_CATEGORIES.length);
  });
});

describe('What-If conserves money, the simulator can never invent dollars', () => {
  it('transferDollars keeps the total invariant', () => {
    const base = baseAmounts();
    const before = sumAmounts(base);
    const moved = transferDollars(base, 'national_defense', 'education', 100_000_000_000);
    expect(sumAmounts(moved)).toBeCloseTo(before, 0);
    // The money actually moved.
    expect(moved.national_defense).toBeCloseTo(base.national_defense - 1e11, 0);
    expect(moved.education).toBeCloseTo(base.education + 1e11, 0);
  });

  it('applyReallocations conserves the total across multiple transfers', () => {
    const before = sumAmounts(baseAmounts());
    const adjusted = applyReallocations([
      { fromId: 'national_defense', toId: 'education', percent: 0.3 },
      { fromId: 'net_interest', toId: 'health', percent: 0.1 },
    ]);
    expect(sumAmounts(adjusted)).toBeCloseTo(before, 0);
  });

  it('a reallocated receipt still sums to the same income tax', () => {
    const gross = 80000;
    const real = computeReceipt({ grossIncome: gross, status: 'single' });
    const adjusted = applyReallocations([
      { fromId: 'national_defense', toId: 'education', percent: 0.5 },
    ]);
    const remix = computeReceipt({ grossIncome: gross, status: 'single', adjustedAmounts: adjusted });

    // Same income => same income tax, regardless of allocation.
    expect(remix.incomeTax).toBeCloseTo(real.incomeTax, 2);
    expect(remix.totalAllocated).toBeCloseTo(remix.incomeTax, 2);

    // Education went up, defense went down, money moved, not created.
    const eduReal = real.lines.find((l) => l.id === 'education')!.allocated;
    const eduRemix = remix.lines.find((l) => l.id === 'education')!.allocated;
    const defReal = real.lines.find((l) => l.id === 'national_defense')!.allocated;
    const defRemix = remix.lines.find((l) => l.id === 'national_defense')!.allocated;
    expect(eduRemix).toBeGreaterThan(eduReal);
    expect(defRemix).toBeLessThan(defReal);
  });

  it('changing income alone rescales every line but still conserves', () => {
    const low = computeReceipt({ grossIncome: 40000, status: 'single' });
    const high = computeReceipt({ grossIncome: 120000, status: 'single' });
    expect(high.incomeTax).toBeGreaterThan(low.incomeTax);
    expect(high.totalAllocated).toBeCloseTo(high.incomeTax, 2);
  });
});

describe('headline comparison', () => {
  it('interest on the debt exceeds science & space, with a real ratio', () => {
    const r = computeReceipt({ grossIncome: 100000, status: 'single' });
    const h = buildHeadline(r);
    expect(h).not.toBeNull();
    expect(h!.bigger.id).toBe('net_interest');
    expect(h!.smaller.id).toBe('science_space');
    expect(h!.ratio).toBeGreaterThan(1);
    // Ratio equals the underlying outlay ratio (allocation is proportional).
    const interest = OUTLAY_CATEGORIES.find((c) => c.id === 'net_interest')!.amount;
    const science = OUTLAY_CATEGORIES.find((c) => c.id === 'science_space')!.amount;
    expect(h!.ratio).toBeCloseTo(interest / science, 4);
  });
});
