# PAYRAKSHA 360 — SOC console redesign: style guide and rules for every task

The app must look like a security operations center running a live threat simulation (reference feel: the
MIRRØR threat console): near-black void background with a faint cyan grid, hairline cyan panels with corner
brackets, mono uppercase labels with wide tracking, glowing numbers, red / amber / green risk colours, live
dots, radar sweeps and flowing dashed edges. It must NOT look like a friendly consumer app with white cards,
big rounded corners, mascots or 3D models.

## Design tokens (already in the scaffold — use them, do not redefine them)

- Body background: already the void grid (do not set page backgrounds).
- Surfaces: `<HudPanel eyebrow title right tone>` from `src/components/soc` (or the class `hud-panel`).
  `.glass` / `.glass-strong` render the same HUD panel. `.glass-light` (white card) is ONLY for the printable incident report.
- Text classes: `hud-eyebrow` (10px mono, tracking .32em, cyan), `hud-title` (13px mono semibold uppercase),
  `hud-label` (11px mono uppercase slate), `hud-num` (mono tabular numbers), `hud-glow` (text glow in the current colour),
  `hud-rule` (dashed cyan separator), `hud-scanlines` (subtle scanline overlay), `eyebrow`, `chip`, `mono`.
  Body copy: sans, `text-sm text-slate-300`. Headings h1–h4 are already mono.
- Colours: system / neutral = cyan (`text-cyan-300`, `border-cyan-400/20`, `bg-cyan-400/10`).
  Risk: HIGH red `#ef4444`, HIGH_CAUTION orange `#f97316`, CAUTION amber `#f59e0b`, LOW green `#22c55e`.
  Get classes with `socToneForLevel(level)` + `SOC_TONES[tone]` (`text`, `border`, `bg`, `dot`, `hex`) from `src/components/soc`,
  or `levelTheme(level)` from `src/lib/risk` (`hex`, `short` = 'LOW RISK' | 'CAUTION' | 'HIGH CAUTION' | 'HIGH RISK').
  Predictions / AI guesses = violet (`text-violet-300`, tone 'violet').
- Kit (all in `src/components/soc`, import from that barrel): `HudPanel`, `StatusPill` (`<StatusPill tone="red" pulse>LIVE</StatusPill>`),
  `LiveDot`, `KpiTile` (`label value tone hint icon`), `ThreatLevel` (`level score live`), `Ticker` (`items`),
  `ShieldStatus` (`state shield score detail`) with `shieldStateFor(level, busy)`, `simulatedFeed({now, count})` → `SimEvent[]`,
  `tickerLine(event)`, `STATUS_LABEL`, `SIM_CHANNELS`, `istTime(ms)`.
- Buttons: keep using `<Button variant="primary|danger|safe|ghost|outline" size loading fullWidth>` and `ButtonLink` from
  `src/components/ui` (already mono / cyan).
- Shape: small radii only (`rounded-sm`, `rounded-[3px]`); hairline borders (`border-cyan-400/15`); dense 12-column panel grids
  (`grid gap-4 lg:grid-cols-12`, panels `lg:col-span-8` / `lg:col-span-4`); single column on mobile; no horizontal page scroll.
- Motion: framer-motion; Tailwind `animate-radar-sweep`, `animate-dash-flow` (SVG strokes with `strokeDasharray="6 6"`),
  `animate-blink`, `animate-ping`, `animate-scan`. Respect `useReducedMotion()` from framer-motion: when it is true, no infinite
  animations.
- SVG visualisations: hand-drawn SVG with `viewBox` and `width="100%"` so they scale; cyan grid lines at low opacity; mono labels
  (`fontFamily` via the `font-mono` class on `<text>`, fontSize 9–11, letterSpacing 1.5).
- Emoji icons from the spec (📱 ⚠️ 🌐 📷 👤 💰 🧠 🧬 🚨 🏆) stay where a test or the spec expects them; otherwise prefer lucide-react icons.

## Safety rules (non-negotiable, from the spec)

- Hackathon DEMO. Never initiate, authorize or simulate an actual UPI / bank transaction. The QR scanner never triggers a payment.
- Never make real external network requests (no fetch to outside hosts; the app's own `/api` via `src/services/api` is fine).
- Never ask for a UPI PIN, OTP, password, CVV or card number, and never store real card details.
- Never state that fraud has definitely occurred. Use "Suspicious", "Potentially risky", "Multiple warning signals detected",
  "Held for review", "Check before you pay".
- Every recipient, amount, alert, feed row and history item is fake DEMO data (handles end in `@demo`) and is visibly labelled
  SIMULATION or DEMO. Statistics are "SIMULATED HACKATHON DATA", never real-world figures.

## Engineering rules

- React 19 + TypeScript strict (`noUnusedLocals`, `noUnusedParameters`), Tailwind 3.4, framer-motion, lucide-react, recharts,
  react-router-dom 7 (the app uses HashRouter; tests use `renderWithRouter(ui, { route })` from `src/test/utils`), zustand store
  `useDemoStore` (`src/store/demoStore`: `current`, `history`, `recordAnalysis`, `elderMode`, `toggleElderMode`, `resetDemo`;
  also `flagshipReport()` and `useCurrentReport()`).
- Engine (in-browser, synchronous, deterministic) from `src/engine`: `runScenarioLocal(id)`, `scenarios`, `getScenario(id)`,
  `FLAGSHIP_SCENARIO_ID` ('utility_scam', 92 HIGH), `runLiveSimulation()`, `runSignalsConnected()`, `runCounterfactual()`,
  `analyzeLocal(input)`, `levelOf(score)`, `SIMULATION_NOTICE`, `DISCLAIMER`, `engineConfig`.
- The 3D layer is gone (`src/components/three` was deleted): no 3D models, WebGL scenes or mascots.
- Never edit `package.json`, lockfiles, `src/routes.ts`, `src/components/soc/index.ts`, `tailwind.config.js`, `src/index.css`,
  `src/test/**` or `test/acceptance/**`. No new dependencies. If you need something outside your files, say so in your summary.
- Existing tests encode spec requirements. Keep every existing assertion about texts, roles, labels, `data-testid`s and behaviour
  passing. You may change an assertion only when it checked an old CSS class or the removed 3D components.
- Page tests use `getByText` / `getByRole(..., { name })` / `getByTestId`, which throw when a query matches MORE than one element.
  Before adding any text, link, button, meter or testid to a page, read that page's test file and make sure you do not create a
  second match for any existing single-element query (for example a second `role="meter"`, a second link whose name matches
  `/SCAN QR/i`, a second element whose own text is `RISK SCORE` or `42`, or a second `92 / 100`). For risk numbers in new
  widgets use the format `RISK 92` (and `92/100` without spaces only in `ThreatLevel`).
- Before finishing, run `npx tsc --noEmit -p .` and your tests, and fix everything.
