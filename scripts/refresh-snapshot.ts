/**
 * refresh-snapshot.ts, regenerate src/data/federal-outlays-snapshot.json from
 * the authoritative source so the bundled data is reproducible, not magic numbers.
 *
 * Source: U.S. Treasury Fiscal Data, Monthly Treasury Statement (MTS), Table 9,
 * "Summary of Receipts and Outlays of the U.S. Government by Function." We read
 * the final fiscal-year-to-date net outlays (record_date = Sept 30 of the FY).
 *
 * Run:  npm run refresh-snapshot            # defaults to FY2025
 *       FISCAL_YEAR=2025 npm run refresh-snapshot
 *
 * Requires Node 18+ (global fetch). The friendly names, icons, and explainers
 * are curated here and merged with the live dollar amounts by MTS line code.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FISCAL_YEAR = Number(process.env.FISCAL_YEAR ?? 2025);
const RECORD_DATE = `${FISCAL_YEAR}-09-30`; // end of the federal fiscal year

const API =
  'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_9';
const DATASET_URL =
  'https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/summary-of-receipts-and-outlays-of-the-u-s-government';

/** MTS Table 9 outlay line code -> curated category metadata. */
const META: Record<
  string,
  { id: string; functionCode: string; name: string; shortName: string; icon: string; explainer: string }
> = {
  '270': { id: 'social_security', functionCode: '650', name: 'Social Security', shortName: 'Social Security', icon: '👵', explainer: 'Monthly retirement, survivor, and disability benefits for workers and their families. Funded mainly by the payroll taxes shown separately in your tax breakdown.' },
  '250': { id: 'medicare', functionCode: '570', name: 'Medicare', shortName: 'Medicare', icon: '🩺', explainer: 'Health coverage for Americans age 65+ and some younger people with disabilities. Partly funded by the Medicare payroll tax shown separately.' },
  '240': { id: 'health', functionCode: '550', name: 'Health', shortName: 'Health', icon: '🏥', explainer: "Health spending other than Medicare, Medicaid, the Children's Health Insurance Program, public health, NIH research, and ACA subsidies." },
  '320': { id: 'net_interest', functionCode: '900', name: 'Net Interest', shortName: 'Interest on the debt', icon: '💳', explainer: 'Interest the government pays on the national debt, minus interest it earns. This buys no services today, it is the cost of past borrowing.' },
  '140': { id: 'national_defense', functionCode: '050', name: 'National Defense', shortName: 'National defense', icon: '🛡️', explainer: 'Military personnel and operations, weapons procurement, and defense research, primarily the Department of Defense.' },
  '260': { id: 'income_security', functionCode: '600', name: 'Income Security', shortName: 'Income security', icon: '🍞', explainer: 'Support for basic needs: unemployment insurance, SNAP (food assistance), housing aid, refundable tax credits, and federal employee retirement.' },
  '280': { id: 'veterans', functionCode: '700', name: 'Veterans Benefits and Services', shortName: 'Veterans', icon: '🎖️', explainer: 'Health care, disability compensation, pensions, and education benefits for military veterans and their families.' },
  '210': { id: 'transportation', functionCode: '400', name: 'Transportation', shortName: 'Transportation', icon: '🚧', explainer: 'Highways, mass transit, aviation and air traffic control, railroads, and maritime programs.' },
  '180': { id: 'natural_resources', functionCode: '300', name: 'Natural Resources and Environment', shortName: 'Natural resources & environment', icon: '🌲', explainer: 'National parks and public lands, the EPA, conservation, water resources, and pollution control.' },
  '290': { id: 'administration_of_justice', functionCode: '750', name: 'Administration of Justice', shortName: 'Justice & law enforcement', icon: '⚖️', explainer: 'Federal law enforcement (FBI, DEA), the federal courts, prisons, and immigration enforcement.' },
  '220': { id: 'community_development', functionCode: '450', name: 'Community and Regional Development', shortName: 'Community development', icon: '🏗️', explainer: 'Disaster relief and recovery, community and rural development, and regional economic programs.' },
  '230': { id: 'education', functionCode: '500', name: 'Education, Training, Employment, and Social Services', shortName: 'Education & training', icon: '🎓', explainer: 'Student financial aid, K-12 grants, job training, and social services. (FY2025 reflects large student-loan accounting adjustments.)' },
  '190': { id: 'agriculture', functionCode: '350', name: 'Agriculture', shortName: 'Agriculture', icon: '🌾', explainer: 'Farm income support, crop insurance, and agricultural research and conservation.' },
  '150': { id: 'international_affairs', functionCode: '150', name: 'International Affairs', shortName: 'International affairs', icon: '🌍', explainer: 'Diplomacy and embassies, foreign economic and humanitarian aid, and international security assistance.' },
  '160': { id: 'science_space', functionCode: '250', name: 'General Science, Space, and Technology', shortName: 'Science & space (NASA)', icon: '🚀', explainer: 'NASA, the National Science Foundation, and basic scientific research across federal agencies.' },
  '300': { id: 'general_government', functionCode: '800', name: 'General Government', shortName: 'General government', icon: '🏛️', explainer: 'The cost of running the federal government itself, the IRS, central management, legislative and executive operations.' },
  '170': { id: 'energy', functionCode: '270', name: 'Energy', shortName: 'Energy', icon: '⚡', explainer: 'The electric grid, energy research, strategic reserves, and nuclear-site cleanup.' },
  '200': { id: 'commerce_housing_credit', functionCode: '370', name: 'Commerce and Housing Credit', shortName: 'Commerce & housing credit', icon: '🏘️', explainer: 'Housing finance, the Postal Service, and commerce programs. Can be net-negative when loan repayments and fees exceed outlays, it reduces total spending.' },
  '330': { id: 'undistributed_offsetting_receipts', functionCode: '950', name: 'Undistributed Offsetting Receipts', shortName: 'Offsetting receipts', icon: '➖', explainer: "Accounting offsets subtracted from totals, chiefly agencies' payments into federal retirement funds and royalties from resources on public land." },
};

const TOTAL_LINE = '340';

async function main() {
  const url = `${API}?filter=record_date:eq:${RECORD_DATE}&page%5Bsize%5D=200`;
  console.log(`Fetching MTS Table 9 for FY${FISCAL_YEAR} (${RECORD_DATE})...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Treasury API ${res.status} ${res.statusText}`);
  const json = (await res.json()) as { data: Array<Record<string, string>> };

  const byLine = new Map(json.data.map((r) => [r.line_code_nbr, r]));

  const categories = Object.entries(META).map(([line, meta]) => {
    const row = byLine.get(line);
    if (!row) throw new Error(`Missing MTS line ${line} (${meta.name})`);
    return { ...meta, amount: Number(row.current_fytd_rcpt_outly_amt) };
  });

  const totalRow = byLine.get(TOTAL_LINE);
  if (!totalRow) throw new Error('Missing MTS total outlays line');
  const totalOutlays = Number(totalRow.current_fytd_rcpt_outly_amt);

  // Integrity check: functions must sum to the published total.
  const sum = categories.reduce((a, c) => a + c.amount, 0);
  if (Math.abs(sum - totalOutlays) > 1) {
    throw new Error(`Category sum ${sum} != total ${totalOutlays}`);
  }

  // Sort largest-first for a stable, readable file.
  categories.sort((a, b) => b.amount - a.amount);

  const snapshot = {
    fiscalYear: FISCAL_YEAR,
    totalOutlays,
    currency: 'USD',
    source: `U.S. Department of the Treasury, Monthly Treasury Statement (MTS), Final Fiscal Year ${FISCAL_YEAR}, Table 9, Summary of Receipts and Outlays by Function (net outlays, fiscal-year-to-date through ${RECORD_DATE}).`,
    sourceShort: `Treasury Monthly Treasury Statement, Final FY${FISCAL_YEAR} (Table 9)`,
    sourceUrl: DATASET_URL,
    apiEndpoint: `${API}?filter=record_date:eq:${RECORD_DATE}`,
    retrieved: new Date().toISOString().slice(0, 10),
    note: 'Net outlays. Some functions can be net-negative (accounting offsets that reduce total spending), shown as credits on the receipt. The functions sum exactly to totalOutlays.',
    categories,
  };

  const out = join(import.meta.dirname, '..', 'src', 'data', 'federal-outlays-snapshot.json');
  writeFileSync(out, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Wrote ${categories.length} categories, total $${totalOutlays.toLocaleString()} -> ${out}`);
}

main().catch((err) => {
  console.error('refresh-snapshot failed:', err);
  process.exit(1);
});
