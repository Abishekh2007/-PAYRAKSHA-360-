# PAYRAKSHA 360 console — "futuristic digital bank" style guide (v2) and rules for every task

The console must look like a premium, futuristic digital bank: calm midnight-navy canvas with soft aurora glows,
frosted-glass cards with generous radii, an indigo → blue → aqua accent gradient, clean Space Grotesk headings
and Inter body copy, confident numbers, soft pills. Think a modern neobank's security centre.
It must NOT look like a hacker terminal or a SOC wall: see the don't-list.

## Tokens (already in the scaffold: use them, never redefine them)

- Page background: the body already paints the aurora canvas. Never set page backgrounds or grids.
- Cards: `<HudPanel eyebrow title right tone>` from `src/components/soc`, or the classes `hud-panel` / `glass` /
  `glass-strong` (all the same frosted card: hairline `white/10` border, 1.25rem radius, blur, deep soft shadow).
  `.glass-light` (white card) is ONLY for the printable incident report.
- Fonts: `font-sans` = Inter (body); `font-display` = Space Grotesk (headings, labels, figures; h1–h4 already use it);
  `font-mono` is ALSO Space Grotesk now, with tabular numbers (so old `font-mono` numbers keep aligning);
  `font-code` = JetBrains Mono, ONLY for raw payloads (a decoded QR, a URL, JSON).
- Text classes: `hud-eyebrow` (11px uppercase label, tracking .14em, slate-400), `hud-title` (15px display semibold white),
  `hud-label`, `hud-num` (tabular figures), `text-gradient` (indigo→blue→aqua text), `brand-gradient` (the same as a background),
  `chip` (rounded-full soft pill), `eyebrow`, `mono`. Body copy: `text-sm text-slate-300`; secondary `text-slate-400`.
- Colours: brand = `cyan-*` (remapped to a soft brand BLUE scale: `text-cyan-300`, `bg-cyan-400/10`, `border-cyan-400/20`),
  `brand-indigo` `#6366f1`, `brand-blue` `#3b82f6`, `brand-aqua` `#22d3ee`, `aqua-300/400` for true cyan highlights,
  canvas `navy-950…500`. AI predictions = violet (`text-violet-300`, tone 'violet').
  Risk (unchanged): HIGH red `#ef4444`, HIGH_CAUTION orange `#f97316`, CAUTION amber `#f59e0b`, LOW green `#22c55e`;
  get classes with `socToneForLevel(level)` + `SOC_TONES[tone]` (`text`, `border`, `bg`, `dot`, `hex`) from `src/components/soc`,
  or `levelTheme(level)` from `src/lib/risk` (`hex`, `short` = 'LOW RISK' | 'CAUTION' | 'HIGH CAUTION' | 'HIGH RISK').
- Radii (remapped, larger): `rounded-sm` .5rem, `rounded`/`rounded-md` .625/.75rem, `rounded-lg` .875rem, `rounded-xl` 1rem,
  `rounded-2xl` 1.25rem, `rounded-3xl` 1.75rem, pills `rounded-full`. Replace arbitrary tiny radii like `rounded-[3px]`.
- Shadows: `shadow-glass`, `shadow-card`, `shadow-glow-brand`, `shadow-glow-{low,caution,elevated,high,violet}` (soft drop glows).
- Buttons: `<Button variant="primary|danger|safe|ghost|outline" size="sm|md|lg" loading fullWidth>` / `ButtonLink` from
  `src/components/ui` (primary = gradient pill-ish rounded-xl with glow). Never build class names dynamically
  (`btn-${x}`): Tailwind only keeps class names it finds verbatim in the source.
- Kit (`src/components/soc` barrel): `HudPanel`, `StatusPill` (`tone pulse`), `LiveDot`, `KpiTile` (`label value tone hint icon`),
  `ThreatLevel` (`level score live`), `Ticker` (`items`), `ShieldStatus` (`state shield score detail`) + `shieldStateFor(level, busy)`,
  `simulatedFeed({now, count})`, `tickerLine(event)`, `STATUS_LABEL`, `SIM_CHANNELS`, `istTime(ms)`, `PaymentTwin`, `ScamRadar`,
  `ScamConstellation`, `NextMoveCard`, `OperationTimeline`.
- Layout: responsive 12-column card grids (`grid gap-4 lg:grid-cols-12`, `lg:col-span-8` / `lg:col-span-4`), `gap-4`/`gap-6`,
  comfortable padding (`p-5`/`p-6`), single column on phones, NO horizontal page scroll at 360px (use `min-w-0`, `break-words`,
  `overflow-x-auto` only inside tables).
- Motion: framer-motion fades / slides (`initial={{opacity:0,y:8}}`), `animate-fade-up`, `animate-aurora`, `animate-gradient-x`,
  radar sweep and dash-flow allowed inside visualisations. Respect `useReducedMotion()`: when true, no infinite animations.
- SVG visuals: `viewBox` + `width="100%"`; soft brand-blue strokes, rounded caps, gradient fills (`<linearGradient>` indigo→aqua),
  labels in `font-display` 10–12px with normal tracking.
- Emoji icons from the spec (📱 ⚠️ 🌐 📷 👤 💰 🧠 🧬 🚨 🏆) stay where a test or the spec expects them; otherwise lucide-react icons,
  preferably inside a 36–40px rounded-xl icon bubble (`bg-cyan-400/10 text-cyan-300`).

## Don't-list (remove these where you find them in your files)

Background grids or grid overlays; scanlines; corner brackets / bracket spans like `[ LIVE ]`; `//`, `>`, `$` or `::` prefixes on
labels; blinking cursors or carets; walls of uppercase mono text (keep uppercase to short labels); neon text glows on body text;
terminal words used as decoration ("TERMINAL", "ROOT", "SYS>", "0x…"); 3px radii and dashed hairline "HUD" separators.
Keep every text, role, label and `data-testid` a test asserts: change decoration, not wording.

## Safety rules (non-negotiable, from the spec)

- Hackathon DEMO. Never initiate, authorize or simulate an actual UPI / bank transaction. The QR scanner never triggers a payment.
- Never make real external network requests (the app's own `/api` via `src/services/*` is fine).
- Never ask for a UPI PIN, OTP, password, CVV or card number, and never store real card details.
- Never state that fraud has definitely occurred. Use "Suspicious", "Potentially risky", "Multiple warning signals detected",
  "Held for review", "Check before you pay".
- Every recipient, amount, alert, feed row and history item is fake DEMO data (handles end in `@demo`) and is visibly labelled
  SIMULATION or DEMO. Statistics are "SIMULATED HACKATHON DATA", never real-world figures.

## Engineering rules

- React 19 + TypeScript strict (`noUnusedLocals`, `noUnusedParameters`), Tailwind 3.4, framer-motion, lucide-react, recharts,
  react-router-dom 7 (HashRouter; tests use `renderWithRouter(ui, { route })` from `src/test/utils`), zustand `useDemoStore`
  (`src/store/demoStore`: `current`, `history`, `recordAnalysis`, `elderMode`, `toggleElderMode`, `resetDemo`; also
  `flagshipReport()`, `useCurrentReport()`).
- Engine (in-browser, synchronous, deterministic) from `src/engine`: `runScenarioLocal(id)`, `scenarios`, `getScenario(id)`,
  `FLAGSHIP_SCENARIO_ID` ('utility_scam'), `runLiveSimulation()`, `runSignalsConnected()`, `runCounterfactual()`,
  `analyzeLocal(input)`, `levelOf(score)`, `fmtINR(n)`, `qrScenarios()`, `SIMULATION_NOTICE`, `DISCLAIMER`, `engineConfig`.
- No 3D models, WebGL scenes or mascots.
- Never edit `package.json`, lockfiles, `src/routes.ts`, `src/components/soc/index.ts`, `tailwind.config.js`, `src/index.css`,
  `src/test/**`, `test/acceptance/**`, `src/types/**`. No new dependencies. Need something outside your files? Say so in your summary.
- Existing tests encode spec requirements. Keep every existing assertion about texts, roles, labels, `data-testid`s and behaviour
  passing. You may change an assertion only when it checked an old CSS class.
- `getByText` / `getByRole(..., { name })` / `getByTestId` throw when a query matches MORE than one element. Before adding any
  text, link, button, meter or testid, read your files' tests and do not create a second match for an existing single-element
  query. For risk numbers in new widgets use the format `RISK 92` (and `92/100` without spaces only in `ThreatLevel`).
- Before finishing run `npx tsc --noEmit -p .` and your tests (`npx vitest run <your test files>`), and fix everything.
