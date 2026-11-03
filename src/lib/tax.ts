/**
 * Federal tax math, pure, dependency-free, unit-tested.
 *
 * Methodology (see Sources screen): apply the standard deduction, compute
 * ordinary federal income tax from the bundled 2025 bracket table, and compute
 * employee-share payroll taxes separately (they are earmarked, not part of the
 * discretionary allocation). This is an educational estimate, no itemized
 * deductions or credits are modeled.
 */

import brackets from '@/data/tax-brackets.json';
import { PAYROLL } from '@/lib/constants';

export type FilingStatus = 'single' | 'married_joint' | 'head_of_household';

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  married_joint: 'Married filing jointly',
  head_of_household: 'Head of household',
};

type Bracket = { rate: number; upTo: number | null };

const BRACKETS = brackets.brackets as Record<FilingStatus, Bracket[]>;
const STD_DEDUCTION = brackets.standardDeduction as Record<FilingStatus, number>;

export const TAX_DATA_SOURCE = {
  taxYear: brackets.taxYear,
  source: brackets.source,
  sourceShort: brackets.sourceShort,
  sourceUrl: brackets.sourceUrl,
  bracketsUrl: brackets.bracketsUrl,
} as const;

/** Standard deduction for a filing status. */
export function standardDeduction(status: FilingStatus): number {
  return STD_DEDUCTION[status];
}

/** Taxable income after the standard deduction (never below zero). */
export function taxableIncome(grossIncome: number, status: FilingStatus): number {
  return Math.max(0, grossIncome - standardDeduction(status));
}

/**
 * Ordinary federal income tax via marginal brackets on taxable income.
 * Pure function of (gross, status).
 */
export function federalIncomeTax(grossIncome: number, status: FilingStatus): number {
  const taxable = taxableIncome(grossIncome, status);
  if (taxable <= 0) return 0;

  let tax = 0;
  let lower = 0;
  for (const bracket of BRACKETS[status]) {
    const upper = bracket.upTo ?? Infinity;
    if (taxable > lower) {
      const slice = Math.min(taxable, upper) - lower;
      tax += slice * bracket.rate;
    }
    lower = upper;
    if (taxable <= upper) break;
  }
  return tax;
}

export type PayrollTaxes = {
  socialSecurity: number;
  medicare: number;
  total: number;
};

/**
 * Employee-share payroll taxes. Social Security is capped at the annual wage
 * base; Medicare applies to all wages. Shown separately on the receipt because
 * these dollars are earmarked for those programs.
 */
export function payrollTaxes(grossIncome: number): PayrollTaxes {
  const wages = Math.max(0, grossIncome);
  const socialSecurity = Math.min(wages, PAYROLL.socialSecurityWageBase) * PAYROLL.socialSecurityRate;
  const medicare = wages * PAYROLL.medicareRate;
  return { socialSecurity, medicare, total: socialSecurity + medicare };
}

/** Effective federal income tax rate (income tax / gross), 0 when income is 0. */
export function effectiveRate(grossIncome: number, status: FilingStatus): number {
  if (grossIncome <= 0) return 0;
  return federalIncomeTax(grossIncome, status) / grossIncome;
}
