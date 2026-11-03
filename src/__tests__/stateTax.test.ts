import {
  computeStateLocal,
  localIncomeTax,
  salesTaxEstimate,
  stateIncomeTax,
} from '@/lib/stateTax';
import { stateForZip } from '@/lib/zipState';

describe('ZIP to state', () => {
  it('maps known ZIPs to the right state', () => {
    expect(stateForZip('10001')).toBe('NY'); // NYC
    expect(stateForZip('94103')).toBe('CA'); // SF
    expect(stateForZip('75001')).toBe('TX'); // Dallas
    expect(stateForZip('33101')).toBe('FL'); // Miami
    expect(stateForZip('98101')).toBe('WA'); // Seattle
    expect(stateForZip('20001')).toBe('DC');
    expect(stateForZip('733xx'.slice(0, 5))).toBe('TX'); // Austin edge case
  });
  it('returns null for unknown/territory prefixes', () => {
    expect(stateForZip('00601')).toBeNull(); // Puerto Rico
    expect(stateForZip('abc')).toBeNull();
  });
});

describe('state income tax', () => {
  it('is zero for no-income-tax states', () => {
    expect(stateIncomeTax(60000, 'single', 'TX')).toBe(0);
    expect(stateIncomeTax(200000, 'single', 'FL')).toBe(0);
    expect(stateIncomeTax(60000, 'married_joint', 'WA')).toBe(0);
  });

  it('computes flat-rate states on taxable income', () => {
    // Colorado 4.4% on (60000 - 15000 std) = 45000 -> 1980
    expect(stateIncomeTax(60000, 'single', 'CO')).toBeCloseTo(45000 * 0.044, 2);
    // Pennsylvania 3.07% flat, no standard deduction
    expect(stateIncomeTax(60000, 'single', 'PA')).toBeCloseTo(60000 * 0.0307, 2);
  });

  it('computes California graduated brackets ($60k single, taxable $54,460)', () => {
    expect(stateIncomeTax(60000, 'single', 'CA')).toBeCloseTo(1845.16, 1);
  });

  it('computes New York graduated brackets ($60k single, taxable $52,000)', () => {
    expect(stateIncomeTax(60000, 'single', 'NY')).toBeCloseTo(2695.0, 1);
  });

  it('is monotonic in income for a graduated state', () => {
    let prev = -1;
    for (let g = 0; g <= 300000; g += 10000) {
      const t = stateIncomeTax(g, 'single', 'CA');
      expect(t).toBeGreaterThanOrEqual(prev);
      prev = t;
    }
  });
});

describe('local income tax', () => {
  it('applies the NYC ZIP override rate', () => {
    expect(localIncomeTax(60000, '10001', 'NY')).toBeCloseTo(60000 * 0.03876, 2);
  });
  it('is zero where there is no local income tax', () => {
    expect(localIncomeTax(60000, '94103', 'CA')).toBe(0);
  });
});

describe('sales tax estimate', () => {
  it('applies the combined rate to the consumption share', () => {
    // CA combined 8.802% on 30% of 60000
    expect(salesTaxEstimate(60000, 'CA')).toBeCloseTo(60000 * 0.3 * 0.08802, 2);
  });
  it('is zero in no-sales-tax states', () => {
    expect(salesTaxEstimate(60000, 'OR')).toBe(0);
    expect(salesTaxEstimate(60000, 'MT')).toBe(0);
  });
});

describe('computeStateLocal', () => {
  it('totals state + local + sales for a NYC resident', () => {
    const r = computeStateLocal(60000, 'single', '10001');
    expect(r.state).toBe('NY');
    expect(r.total).toBeCloseTo(r.stateIncome + r.localIncome + r.salesTax, 6);
    expect(r.localIncome).toBeGreaterThan(0); // NYC has local income tax
  });
  it('handles no-income-tax state with sales tax (TX)', () => {
    const r = computeStateLocal(60000, 'single', '75001');
    expect(r.state).toBe('TX');
    expect(r.stateIncome).toBe(0);
    expect(r.salesTax).toBeGreaterThan(0);
  });
  it('returns zeros for an unknown ZIP', () => {
    const r = computeStateLocal(60000, 'single', '00601');
    expect(r.state).toBeNull();
    expect(r.total).toBe(0);
  });
});
