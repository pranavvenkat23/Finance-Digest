/**
 * Sources & About (screen 5), methodology, every data source with a live link,
 * and the educational disclaimer. This is what lets users and judges trust the
 * math: every number in the app traces back to something cited here.
 */

import { View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { SourceLink } from '@/components/ui/SourceLink';
import { Text } from '@/components/ui/Text';
import {
  APP_NAME,
  EDU_DISCLAIMER,
  PAYROLL,
  TAX_YEAR,
  USASPENDING_API_BASE,
  WHATIF_DISCLAIMER,
} from '@/lib/constants';
import { formatCompactDollars } from '@/lib/format';
import { SNAPSHOT_META } from '@/lib/receipt';
import { STATE_TAX_SOURCE } from '@/lib/stateTax';
import { standardDeduction, TAX_DATA_SOURCE } from '@/lib/tax';
import { Radius, Space, useTheme } from '@/lib/theme';

export default function SourcesScreen() {
  const theme = useTheme();

  return (
    <Screen scroll>
      <Text variant="title" style={{ marginTop: Space.lg }}>
        Sources & Method
      </Text>
      <Text variant="body" color="inkSecondary" style={{ marginTop: Space.sm }}>
        {APP_NAME} turns your income into an itemized estimate of where your federal income tax went,
        using official federal data. Every figure below is sourced, nothing is invented.
      </Text>

      <Section title="How we calculate your taxes">
        <Step n={1} text={`We start from your gross income and filing status, then subtract the ${TAX_YEAR} standard deduction (e.g. ${formatUSD(standardDeduction('single'))} for single filers).`} />
        <Step n={2} text={`We compute your federal income tax with the ${TAX_YEAR} marginal tax brackets. This is an educational estimate, we don't model itemized deductions or credits.`} />
        <Step n={3} text={`We split that tax across federal budget functions in proportion to each function's share of total federal outlays (${formatCompactDollars(SNAPSHOT_META.totalOutlays)} in FY${SNAPSHOT_META.fiscalYear}). Because the shares sum to 100%, the line items sum exactly to your tax.`} />
        <Step n={4} text={`Payroll taxes (Social Security ${pct(PAYROLL.socialSecurityRate)} + Medicare ${pct(PAYROLL.medicareRate)}) are shown separately, since they're earmarked for those programs.`} />
        <Step n={5} text={`The What-If only moves your existing dollars between categories, transparent arithmetic on the same data. ${WHATIF_DISCLAIMER}`} />
      </Section>

      <Section title="Data sources">
        <SourceItem
          title="Federal outlays by function"
          detail={SNAPSHOT_META.source}
          url={SNAPSHOT_META.sourceUrl}
          linkLabel="Treasury Fiscal Data, Monthly Treasury Statement"
        />
        <SourceItem
          title={`Income tax brackets & standard deduction (TY${TAX_YEAR})`}
          detail={TAX_DATA_SOURCE.source}
          url={TAX_DATA_SOURCE.sourceUrl}
          linkLabel="IRS, Tax inflation adjustments"
          secondaryUrl={TAX_DATA_SOURCE.bracketsUrl}
          secondaryLabel="IRS, Federal income tax rates & brackets"
        />
        <SourceItem
          title="Payroll tax rates & wage base"
          detail={`Social Security ${pct(PAYROLL.socialSecurityRate)} up to a ${formatUSD(PAYROLL.socialSecurityWageBase)} wage base; Medicare ${pct(PAYROLL.medicareRate)} on all wages.`}
          url={PAYROLL.socialSecuritySource}
          linkLabel="SSA, Contribution & benefit base"
          secondaryUrl={PAYROLL.medicareSource}
          secondaryLabel="IRS, Topic 751 (payroll taxes)"
        />
        <SourceItem
          title="State, local, and sales taxes"
          detail={`${STATE_TAX_SOURCE.note} ${STATE_TAX_SOURCE.incomeSource} ${STATE_TAX_SOURCE.salesSource}`}
          url={STATE_TAX_SOURCE.incomeUrl}
          linkLabel="Tax Foundation, state income tax 2025"
          secondaryUrl={STATE_TAX_SOURCE.salesUrl}
          secondaryLabel="Tax Foundation, sales tax 2025"
        />
        <SourceItem
          title="Federal awards near your ZIP"
          detail="Live grants and contracts whose place of performance is in your ZIP, from the USAspending.gov award-search API. Cached on device; sample data is clearly labeled when shown."
          url={USASPENDING_API_BASE}
          linkLabel="USAspending.gov"
          secondaryUrl="https://api.usaspending.gov/docs/endpoints"
          secondaryLabel="USAspending API documentation"
        />
        <SourceItem
          title="Finance news (News tab)"
          detail="Headlines come from free, public RSS feeds (MarketWatch and CNBC). The 'what this means for you' explanations are AI generated and clearly labeled as educational, not advice."
          url="https://www.cnbc.com/finance/"
          linkLabel="CNBC Finance"
          secondaryUrl="https://www.marketwatch.com/"
          secondaryLabel="MarketWatch"
        />
        <SourceItem
          title="Stock and index quotes (Stocks tab)"
          detail="Live quotes come from public Yahoo Finance endpoints. AI explainers are educational and do not constitute investment advice; the app never recommends buying or selling."
          url="https://finance.yahoo.com/"
          linkLabel="Yahoo Finance"
        />
        <SourceItem
          title="AI assistant (News, Stocks, FinAI)"
          detail="AI features run on Groq with a free key you create and store on your device. The AI only explains and contextualizes; it never produces the app's sourced tax or budget numbers."
          url="https://groq.com/"
          linkLabel="Groq"
          secondaryUrl="https://console.groq.com/keys"
          secondaryLabel="Get a free Groq key"
        />
      </Section>

      <Section title="What this app does, and doesn't">
        <Text variant="body" color="inkSecondary">
          It answers “where would my federal dollars go under this allocation.” It deliberately does
          not predict economic outcomes (GDP, inflation, employment) from budget changes, those need
          econometric models that can't be done credibly here and would break the promise that every
          number is sourced.
        </Text>
      </Section>

      <View style={{ marginTop: Space.xl, padding: Space.lg, borderRadius: Radius.lg, backgroundColor: theme.colors.elevated }}>
        <Text variant="label" color="inkSecondary" style={{ marginBottom: Space.xs }}>
          DISCLAIMER
        </Text>
        <Text variant="caption" color="inkSecondary">
          {EDU_DISCLAIMER} Figures are estimates for civic education and may differ from your actual
          tax return. Privacy: your income and ZIP stay on this device, no accounts, no servers.
        </Text>
        <Text variant="caption" color="inkMuted" style={{ marginTop: Space.sm }}>
          Snapshot retrieved {SNAPSHOT_META.retrieved}. Tax data {TAX_DATA_SOURCE.sourceShort}.
        </Text>
      </View>
    </Screen>
  );
}

function pct(r: number) {
  return `${(r * 100).toFixed(2).replace(/\.00$/, '')}%`;
}
function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: Space.xxl, gap: Space.md }} accessibilityRole="header">
      <Text variant="headline">{title}</Text>
      {children}
    </View>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: Space.md }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: theme.colors.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text variant="caption" color="accent" style={{ fontWeight: '700' }}>
          {n}
        </Text>
      </View>
      <Text variant="body" color="inkSecondary" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function SourceItem({
  title,
  detail,
  url,
  linkLabel,
  secondaryUrl,
  secondaryLabel,
}: {
  title: string;
  detail: string;
  url: string;
  linkLabel: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: Space.lg,
        borderRadius: Radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.line,
        gap: Space.sm,
      }}>
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="caption" color="inkSecondary">
        {detail}
      </Text>
      <SourceLink url={url} label={linkLabel} variant="label" />
      {secondaryUrl && secondaryLabel && <SourceLink url={secondaryUrl} label={secondaryLabel} variant="label" />}
    </View>
  );
}
