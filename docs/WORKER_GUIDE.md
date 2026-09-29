# PAYRAKSHA 360: worker guide

**PAYRAKSHA 360: Think Before You Pay.** An Explainable AI Pre-Payment Scam Defense System (hackathon demo).
It analyses a payment situation (message + URL + QR + payment context) **before** the user pays, scores the
risk 0-100 with a transparent engine, and explains why. Workflow: signals -> contextual risk engine -> scam
pattern -> explainable score -> Scam DNA -> attack chain -> safe action. Voice: "Pause. Understand. Pay Safely."

## Stack (already installed: add no packages, edit no package.json)
React 19 + TypeScript 5.9 (strict) + Vite 8, Tailwind 3.4, framer-motion, react-router-dom 7 (HashRouter; use
`Link`, `useNavigate`), zustand 5, recharts 3, lucide-react, jsqr, qrcode, three + @react-three/fiber 9 +
@react-three/drei 10 + @react-three/postprocessing. Tests: vitest (no globals: `import { describe, it, expect, vi } from 'vitest'`),
jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom (already set up).

## Hard safety rules (breaking one fails review)
1. **Demo only.** Never initiate, authorize or simulate a real UPI/bank transaction. No `upi://` hrefs, no payment
   intents, no button that looks like it sends money. The LOW-risk action is labelled "CONTINUE (SIMULATION)" and
   only shows a note that no money moves.
2. Every screen that shows a payment, QR, recipient, amount, alert or history shows `<SimulationBadge />`
   ("SIMULATION / DEMO").
3. Never ask for, accept or store a UPI PIN, OTP, password, CVV or card number. No inputs for them.
4. No network requests except through `src/services/api.ts` (our own `/api`). Never fetch or open an analysed URL:
   render it as plain text, never as `<a href>`. No CDN assets, no remote fonts or HDRIs.
5. Never state fraud with certainty. Say "Suspicious", "Potentially risky", "Multiple warning signals detected".
   Never "This is a scam", "fraud confirmed", "100% fraud".
6. Recipients are fake ids ending in `@demo` (e.g. `unknown@demo`, `verified@demo`, `merchant@demo`). Never contact
   a real person: trusted-contact alerts are in-app simulations.
7. Threat-intelligence numbers are labelled "SIMULATED HACKATHON DATA" and never presented as real statistics.
8. **Scores are never hard-coded.** They come from the engine: `analyzeRisk()`, `analyzeLocal()`,
   `runScenarioLocal()` or the sequence helpers.

## Shared modules (import them; they are head-owned, so do not edit them)
- `src/engine/index.ts`: in-browser engine and scenario helpers: `analyzeLocal(input)`, `analyzeUrlLocal(url)`,
  `parseQrLocal(text)`, `analyzeTextLocal(text)`, `applyPatch`, `getScenario(id | 'QR001')`, `scenarioToInput(id)`,
  `runScenarioLocal(id)`, `qrScenarios()`, `labScenarios()`, `controlScenarios()`, `runCounterfactual()`,
  `whatIfInput(ids)`, `runSignalsConnected()`, `liveStageInput(stage)`, `runLiveSimulation()`, `fmtINR(n)` ("₹1,999"),
  constants `FLAGSHIP_SCENARIO_ID`, `SOURCE_OPTIONS`, `BEHAVIOUR_OPTIONS`, `URGENCY_OPTIONS`, `FACTOR_LABELS`,
  `FACTOR_WEIGHTS`, `BASELINE`, `LEVELS`, `DNA_LABELS`, `DISCLAIMER`, `SIMULATION_NOTICE`, `ENGINE_NAME`, `ENGINE_VERSION`, `scenarioBook`.
- `src/types/index.ts`: every type (`RiskReport`, `AnalyzeInput`, `Scenario`, `ActionId`, `MlInsight`, `EngineSource`, ...).
- `src/lib/risk.ts`: `levelTheme(level)` -> `{hex, text, bg, border, glow, emoji, headline, short, tone}`,
  `riskHeadline(level)` ("🚨 HIGH RISK PAYMENT"), `severityTheme(sev)`, `TONE_CLASSES`.
- `src/store/demoStore.ts`: `useDemoStore` (`current`, `history`, `elderMode`, `technicalView`, `trustedAlert`,
  `recordAnalysis`, `sendTrustedAlert`, `resolveTrustedAlert`, `setElderMode`, `toggleElderMode`, `setTechnicalView`,
  `resetDemo`), `useCurrentReport()` (latest analysis, or the flagship QR001 report), `flagshipReport()`.
- `src/services/api.ts`: `analyzeRisk(input)` -> `{report, source, latencyMs, ml}` and `analyzeUrlRisk(url)`: use these for
  every user-triggered analysis (Python API first, in-browser fallback). `src/services/qr.ts`, `src/services/report.ts`.
- Shared components, imported from the folder barrel (`import { Button, GlassCard } from '../components/ui'`):
  `ui` (GlassCard, Button, Badge, SimulationBadge, SectionHeader, RiskGauge, ScanSteps, ErrorNotice, AnimatedNumber,
  EngineBadge, StatCard, Toggle), `layout` (PageShell, ...), `risk` (RiskResultView, RiskScoreCard, PaymentPreview,
  ExplanationPanel, RecommendationPanel, ScamDnaChart, AttackChainView, ContributionsChart, SignalList, UrlChecksList,
  MlInsightCard), `three` (GuardianRobot, EngineCore, HeroScene). Other tasks are building these right now: rely on
  their props and documented test hooks, not on how the stub looks today.
- Head-owned, never edit: `package.json`, lockfile, `src/routes.ts`, `src/App.tsx`, `src/main.tsx`, `src/index.css`,
  `tailwind.config.js`, `vite.config.ts`, `src/types`, `src/engine`, `src/lib`, `src/store`, `src/test`, `shared/**`, `docs/**`.
  Need something there? Say so in your final summary instead.

## Conventions
- A page is the default export of `src/pages/<Name>.tsx`, wrapped in `<PageShell eyebrow title subtitle icon>`.
  Page-only subcomponents go in `src/pages/<name-in-lowercase>/`.
- After every user-triggered analysis call
  `useDemoStore.getState().recordAnalysis({ label, input, report, source, ml, latencyMs })` so the Explanation,
  Scam DNA, Attack Chain and Report pages show it.
- Look: deep navy background, glass cards, red / amber / green risk colours. Use the classes in `src/index.css`:
  `glass`, `glass-strong`, `glass-light`, `btn-primary|danger|safe|ghost|outline`, `chip`, `eyebrow`, `text-gradient`,
  `input`, `mono`, `grid-overlay`; colours `navy-950..500`, `brand-200..600`, `risk-low|caution|elevated|high`; fonts
  `font-display` (headings), `font-mono` (numbers, ids). Risk level colour = `levelTheme(level)`.
- Motion: framer-motion, at most 600 ms per transition, staggered reveals, and respect `prefers-reduced-motion`
  (`useReducedMotion`). Mobile-first (works at 360 px wide), keyboard accessible, visible focus, `aria-label` on
  icon-only buttons.
- Amounts: `fmtINR(n)`. Show `report.score`, `report.level`, `report.levelLabel`; never recompute them.

## Tests
- Next to the code: `src/pages/<Name>.test.tsx` or `src/components/<area>/<Name>.test.tsx`. Render pages with
  `renderWithRouter(<Page />)` from `src/test/utils.tsx`. The store is reset after every test.
- jsdom has no WebGL, camera or canvas: the 3D components render a fallback. Never assert on 3D internals.
- Timers and animations: `vi.useFakeTimers({ shouldAdvanceTime: true })` with `act(() => vi.advanceTimersByTime(ms))`,
  or `await screen.findBy...(..., {}, { timeout: 5000 })`. Keep total scripted delays short (under ~6 s).
- Assert on text your own code renders and on the stable hooks: `data-testid="risk-result"` with `data-score` and
  `data-level` (RiskResultView), `data-testid="risk-score-card"`, `role="meter"` with `aria-valuenow` (RiskGauge),
  `role="switch"` + `aria-checked` (Toggle), `role="alert"` (ErrorNotice), `li[data-state]` (ScanSteps),
  `data-testid="simulation-badge"`, action buttons named by their label (e.g. `getByRole('button', { name: 'VERIFY OFFICIALLY' })`).
- Expected scores come from the engine inside the test (`runScenarioLocal('kyc_scam').score`), except these anchors:
  utility_scam 92 HIGH, legit_utility 12 LOW, customer_care_scam 88 HIGH.
- Done means: `npx vitest run <your test files>` passes and `npx tsc --noEmit -p .` passes.

## Demo data (all computed by the engine)
Scenarios: QR001 utility_scam 92 (flagship: electricity bill, ₹1,999, unknown-electricity@demo, via WhatsApp),
QR002 legit_utility 12, QR003 kyc_scam 95, QR004 shopping_scam 85, QR005 customer_care_scam 88, QR006 prize_scam 84,
QR007 job_scam 87, QR008 investment_scam 83, QR009 refund_scam 85, parcel_scam 85, qr_receive_scam 82, legit_merchant 13.
Levels: 0-29 LOW RISK, 30-59 CAUTION, 60-79 HIGH CAUTION, 80-100 HIGH RISK.
Sequences: counterfactual 92 -> 62 -> 39 -> 24; what-if continues 20 -> 16; signals connected 45 -> 66 -> 77 -> 85;
live simulation stages message 54, +url 65, +qr 84, full 92.

## Backend
FastAPI in `backend/app` (Python 3.13, venv `backend/.venv`); tests: `node scripts/pytest.mjs [paths relative to backend/]`.
`backend/app/engine.py` is a port of `shared/reference/engine.mjs`, checked case by case against `shared/golden/golden.json`.
