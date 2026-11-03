import {
  effectiveRate,
  federalIncomeTax,
  payrollTaxes,
  standardDeduction,
  taxableIncome,
} from '@/lib/tax';

describe('standard deduction (TY2025)', () => {
  it('matches IRS 2025 amounts', () => {
    expect(standardDeduction('single')).toBe(15000);
    expect(standardDeduction('married_joint')).toBe(30000);
    expect(standardDeduction('head_of_household')).toBe(22500);
  });
});

describe('taxable income', () => {
  it('subtracts the standard deduction and floors at zero', () => {
    expect(taxableIncome(50000, 'single')).toBe(35000);
    expect(taxableIncome(10000, 'single')).toBe(0); // below deduction
    expect(taxableIncome(100000, 'married_joint')).toBe(70000);
  });
});

describe('federal income tax, bracket math at known points', () => {
  it('is zero at or below the standard deduction', () => {
    expect(federalIncomeTax(0, 'single')).toBe(0);
    expect(federalIncomeTax(15000, 'single')).toBe(0);
  });

  it('single $50k gross (taxable $35k) = $3,961.50', () => {
    // 10% * 11,925 + 12% * (35,000 - 11,925)
    expect(federalIncomeTax(50000, 'single')).toBeCloseTo(3961.5, 2);
  });

  it('single $100k gross (taxable $85k) = $13,614.00', () => {
    expect(federalIncomeTax(100000, 'single')).toBeCloseTo(13614.0, 2);
  });

  it('married-joint $100k gross (taxable $70k) = $7,923.00', () => {
    expect(federalIncomeTax(100000, 'married_joint')).toBeCloseTo(7923.0, 2);
  });

  it('head-of-household $60k gross (taxable $37.5k) = $4,160.00', () => {
    expect(federalIncomeTax(60000, 'head_of_household')).toBeCloseTo(4160.0, 2);
  });

  it('single $700k gross reaches the 37% bracket = $210,470.25', () => {
    expect(federalIncomeTax(700000, 'single')).toBeCloseTo(210470.25, 2);
  });

  it('is monotonic, more income never lowers tax', () => {
    let prev = -1;
    for (let g = 0; g <= 400000; g += 5000) {
      const t = federalIncomeTax(g, 'single');
      expect(t).toBeGreaterThanOrEqual(prev);
      prev = t;
    }
  });
});

describe('payroll taxes (employee share)', () => {
  it('$50k: SS 6.2% + Medicare 1.45%', () => {
    const p = payrollTaxes(50000);
    expect(p.socialSecurity).toBeCloseTo(3100, 2);
    expect(p.medicare).toBeCloseTo(725, 2);
    expect(p.total).toBeCloseTo(3825, 2);
  });

  it('caps Social Security at the 2025 wage base ($176,100)', () => {
    const p = payrollTaxes(300000);
    expect(p.socialSecurity).toBeCloseTo(176100 * 0.062, 2); // 10,918.20
    expect(p.medicare).toBeCloseTo(300000 * 0.0145, 2); // 4,350 (Medicare uncapped)
  });
});

describe('effective rate', () => {
  it('is income tax / gross, and 0 at zero income', () => {
    expect(effectiveRate(0, 'single')).toBe(0);
    expect(effectiveRate(100000, 'single')).toBeCloseTo(13614.0 / 100000, 6);
  });
});
