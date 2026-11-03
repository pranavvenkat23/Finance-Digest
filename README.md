# Finance Digest

**See exactly where your federal income tax goes, then follow the federal money that flows back into your community.**

Finance Digest is a civic-finance iOS app built with Expo and TypeScript. Enter your income, filing status, and ZIP code, and it itemizes your federal tax across the budget, maps federal awards near you, lets you remix the budget in a live What-If simulator, and explains financial news and market moves in terms of your own tax picture. Every dollar figure traces to an official federal source.

---

## Features

| Tab | What it does |
| --- | --- |
| **Taxes** | Computes your federal income tax from current IRS brackets and itemizes it across budget functions (Social Security, Medicare, defense, interest on the debt, and more) in proportion to real Treasury outlays. Works fully offline. |
| **Local** | State, local, and sales tax estimates for all 50 states plus DC, a tax-burden map, and live federal grants and contracts near your ZIP. |
| **What-If** | A transparent budget simulator: shift dollars between categories or change your income and watch the breakdown recompute. Every transfer conserves the total. |
| **News** | Finance headlines with an on-demand "what this means for you" explainer tied to your tax situation. |
| **Stocks** | Major indices and a personal watchlist with live quotes, plus plain-language explainers covering tax angles such as capital gains. |
| **FinAI** | A chat assistant for money, tax, budget, and market questions, grounded in your own numbers. |

A **Sources & Method** screen documents every dataset and the allocation methodology.

## Tech stack

- **Language:** TypeScript (strict mode)
- **App:** React Native, Expo SDK 56, Expo Router (file-based navigation)
- **State & storage:** Zustand, AsyncStorage (TTL cache)
- **UI:** Reanimated, React Native SVG, react-native-maps (Apple Maps), Expo UI / glass effects
- **Testing:** Jest (`jest-expo`), `tsc --noEmit`
- **Integrations:** U.S. Treasury Fiscal Data, IRS tax tables, USAspending.gov, U.S. Census ZCTA Gazetteer, Yahoo Finance quotes, RSS / Perigon news, Groq inference API
- **Delivery:** EAS Build & Submit

## Data pipeline

1. **Federal outlays snapshot.** `scripts/refresh-snapshot.ts` pulls Monthly Treasury Statement Table 9 from the Treasury API, verifies the budget functions sum to the published total, and writes `src/data/federal-outlays-snapshot.json`. The Taxes and What-If views run entirely from this committed snapshot, so they're instant and work offline.
2. **Tax engine.** `src/lib/tax.ts` applies the standard deduction and marginal brackets. `src/lib/receipt.ts` then allocates the result across budget functions in proportion to outlays, so line items always sum exactly to your tax. Payroll taxes are shown separately.
3. **Live local data.** `src/lib/api/usaspending.ts` queries USAspending for awards near your ZIP and caches them per ZIP for 7 days, with a committed sample-data fallback.
4. **Market and news feeds.** Quotes and headlines are fetched live. Explanations are generated on demand and always labeled educational, not financial advice. Sourced dollar figures never come from generated text.

## Getting started

Requires **Node 18+** and the **Expo Go** app on an iPhone.

```bash
npm install
cp .env.example .env.local   # optional: add API keys for News, Stocks, FinAI
npx expo start               # scan the QR code with Expo Go
```

The tax breakdown, budget data, and sample awards are committed, so a fresh clone runs with no data setup. Without API keys, the explainer features show a friendly setup prompt instead of failing.

### Scripts

```bash
npm test                  # unit tests: bracket math, allocation and reallocation invariants
npm run typecheck         # strict TypeScript check
npm run refresh-snapshot  # regenerate the Treasury outlays snapshot (FISCAL_YEAR=2025 by default)
```

### Ship to the App Store

```bash
npm install -g eas-cli
eas build -p ios --profile production
eas submit -p ios --profile production
```

Set `EXPO_PUBLIC_*` keys as [EAS environment variables](https://docs.expo.dev/eas/environment-variables/) for cloud builds. These values are embedded in the app bundle, so route requests through a server-side proxy if a key must stay secret.

## Project structure

```
src/
  app/          Expo Router screens (onboarding gate + tabs)
  lib/          tax & allocation engines, API clients, cache, theme, constants
  data/         committed Treasury snapshot, tax brackets, sample awards, ZIP centroids
  store/        persisted user profile (Zustand)
  components/   UI primitives and feature components
  __tests__/    unit tests
scripts/        reproducible data refresh
```

## Disclaimer

Educational estimates for civic learning. Not tax, legal, or investment advice, and not an official filing. Your income and ZIP stay on your device; there are no accounts and no servers.

## License

[MIT](LICENSE)
