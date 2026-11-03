/**
 * State, local, and sales tax estimates, pure and unit-tested.
 *
 * State income tax uses each state's 2025 rate schedule (none / flat / graduated)
 * and standard deduction. Local income tax applies a representative rate (with
 * notable city ZIP overrides). Sales tax applies the state's combined average
 * rate to an assumed share of income spent on taxable goods. Everything here is
 * a clearly-labeled educational estimate (see Sources screen).
 */

import stateData from '@/data/state-taxes.json';
import { stateForZip } from '@/lib/zipState';
import type { FilingStatus } from '@/lib/tax';

type Bracket = { upTo: number | null; rate: number };
type DeductionMap = { single: number; married_joint: number };

type IncomeStructure =
  | { type: 'none' }
  | { type: 'flat'; rate: number; stdDeduction: DeductionMap }
  | { type: 'graduated'; stdDeduction: DeductionMap; brackets: { single: Bracket[]; married_joint: Bracket[] } };

type StateEntry = {
  name: string;
  salesCombined: number;
  localIncome: number;
  income: IncomeStructure;
};

const STATES = stateData.states as Record<string, StateEntry>;
const LOCAL_BY_ZIP3 = stateData.localIncomeByZip3 as Record<string, number>;
const CONSUMPTION_SHARE = stateData.consumptionShare as number;

export const STATE_TAX_SOURCE = {
  taxYear: stateData.taxYear,
  incomeSource: stateData.incomeSource,
  incomeUrl: stateData.incomeUrl,
  salesSource: stateData.salesSource,
  salesUrl: stateData.salesUrl,
  note: stateData.note,
  consumptionShare: CONSUMPTION_SHARE,
} as const;

/** Graduated/flat bracket math on an already-deducted taxable income. */
function marginalTax(taxable: number, brackets: Bracket[]): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    const upper = b.upTo ?? Infinity;
    if (taxable > lower) tax += (Math.min(taxable, upper) - lower) * b.rate;
    lower = upper;
    if (taxable <= upper) break;
  }
  return tax;
}

/** Status key used for state lookups (head of household approximated as single). */
function key(status: FilingStatus): 'single' | 'married_joint' {
  return status === 'married_joint' ? 'married_joint' : 'single';
}

export function stateIncomeTax(grossIncome: number, status: FilingStatus, state: string): number {
  const entry = STATES[state];
  if (!entry || entry.income.type === 'none') return 0;
  const k = key(status);
  const income = entry.income;
  const deduction = income.stdDeduction[k] ?? 0;
  const taxable = Math.max(0, grossIncome - deduction);
  if (income.type === 'flat') return taxable * income.rate;
  return marginalTax(taxable, income.brackets[k]);
}

/** Local (city/county) income tax estimate: a notable-city ZIP override, else the state's representative rate, applied to gross income. */
export function localIncomeTax(grossIncome: number, zip: string, state: string): number {
  const wages = Math.max(0, grossIncome);
  const override = LOCAL_BY_ZIP3[zip.slice(0, 3)];
  const rate = override ?? STATES[state]?.localIncome ?? 0;
  return wages * rate;
}

/** Sales tax estimate: combined average rate on an assumed taxable-consumption share of income. */
export function salesTaxEstimate(grossIncome: number, state: string): number {
  const wages = Math.max(0, grossIncome);
  const rate = STATES[state]?.salesCombined ?? 0;
  return wages * CONSUMPTION_SHARE * rate;
}

export type StateLocalTaxes = {
  state: string | null;
  stateName: string | null;
  salesCombinedRate: number;
  localIncomeRate: number;
  stateIncome: number;
  localIncome: number;
  salesTax: number;
  /** stateIncome + localIncome + salesTax. */
  total: number;
};

/** Full state + local + sales estimate for a ZIP. */
export function computeStateLocal(
  grossIncome: number,
  status: FilingStatus,
  zip: string,
): StateLocalTaxes {
  const state = stateForZip(zip);
  if (!state || !STATES[state]) {
    return {
      state: null,
      stateName: null,
      salesCombinedRate: 0,
      localIncomeRate: 0,
      stateIncome: 0,
      localIncome: 0,
      salesTax: 0,
      total: 0,
    };
  }
  const stateIncome = stateIncomeTax(grossIncome, status, state);
  const localIncome = localIncomeTax(grossIncome, zip, state);
  const salesTax = salesTaxEstimate(grossIncome, state);
  const localRate = LOCAL_BY_ZIP3[zip.slice(0, 3)] ?? STATES[state].localIncome;
  return {
    state,
    stateName: STATES[state].name,
    salesCombinedRate: STATES[state].salesCombined,
    localIncomeRate: localRate,
    stateIncome,
    localIncome,
    salesTax,
    total: stateIncome + localIncome + salesTax,
  };
}

/** All states for comparison views (Tax Map), with a simple effective burden at a reference income. */
export function allStatesSummary(): { abbr: string; name: string; salesCombined: number; topIncomeRate: number }[] {
  return Object.entries(STATES).map(([abbr, e]) => {
    let top = 0;
    if (e.income.type === 'flat') top = e.income.rate;
    else if (e.income.type === 'graduated') {
      const b = e.income.brackets.single;
      top = b[b.length - 1].rate;
    }
    return { abbr, name: e.name, salesCombined: e.salesCombined, topIncomeRate: top };
  });
}
