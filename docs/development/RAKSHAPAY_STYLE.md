# RakshaPay · DEMO — the phone app (`pay/`): style, safety and contracts for every task

RakshaPay is a light, Material-style mobile payments app whose LAYOUT and UX follow Google Pay (India) closely:
white surfaces, a search pill at the top, a 4×2 grid of round-cornered action tiles, "People" / "Businesses" avatar
rows, a floating "Scan any QR code" pill, full-bleed black camera scanner, a payee header with a big ₹ amount, pill buttons.
Our twist: before ANY pay step, PayRaksha checks the payment and shows its threat level. Brand is **RakshaPay** only:
never use Google / GPay names, logos, the four-colour "G", or any real bank / UPI app brand.

It is a DEMO: nothing on these screens can move money. It runs on its own port (dev 5174, `npm run dev:pay`) and on a
phone through Tailscale; the console (`src/`) mirrors every check live through `/api/link/*`.

## Tokens (in `pay/tailwind.config.ts` and `pay/src/index.css`: use them, never redefine them)

- Colours: `gp-blue` `#0b57d0` (actions), `gp-blue-soft` `#d3e3fd` (tonal fills, tiles), `gp-blue-ink` `#041e49`,
  `gp-bg` white, `gp-surface` `#f0f4f9` (page), `gp-surface-2` `#e9eef6`, `gp-ink` `#1f1f1f`, `gp-ink-2` `#444746`,
  `gp-ink-3` `#747775`, `gp-line` `#c4c7c5`.
  Risk on white: `risk-low` / `risk-low-soft` / `risk-low-ink` (green), `risk-caution*` (amber), `risk-elevated*` (orange,
  HIGH_CAUTION), `risk-high*` (red). `PayView.tone` maps green → low, amber → caution, orange → elevated, red → high.
  Use literal class names (e.g. a `Record<PayTone, string>` map): Tailwind drops class names built with template strings.
- Font: Inter (`font-sans`). Sizes: screen titles 22px/medium, amounts 44–56px/medium tabular, body 14–15px, captions 12px `gp-ink-3`.
- Components: `.tile` (56px rounded-2xl blue-soft icon tile), `.pill` + `.pill-primary` / `.pill-tonal` / `.pill-outline` /
  `.pill-danger` / `.pill-text` (48px+ rounded-full buttons), `.card` (rounded-3xl white, `shadow-card`), `.section-title`,
  `.avatar` (round, white initial; give it a size and a colour). Shadows `shadow-card`, `shadow-float` (the scan pill), `shadow-sheet`.
  Animations `animate-scan-line`, `animate-fade-up`, `animate-pulse-soft`; framer-motion for sheets and transitions.
  Respect `useReducedMotion()`.
- Icons: lucide-react, 22–24px, stroke 2. Touch targets ≥ 48px. Everything must fit a 360px-wide screen without horizontal scroll.
- Shell (head-owned, do not edit): `PhoneFrame` (full screen on phones, a 400px phone frame on desktop; its inner
  `data-testid="phone-scroll"` div scrolls) and `DemoStrip` ("DEMO · SIMULATION — no real money moves", always on top).
  The frame is CSS-transformed, so `position: fixed` children (bottom nav, sheets, the floating scan pill) pin to the frame:
  use `fixed inset-x-0 bottom-0` freely, and add bottom padding (`pb-28`) to scrolling content under them.

## Screen map (`pay/src/App.tsx`, HashRouter; head-owned)

`/` Home · `/scan` Scan · `/pay` Pay (checks `usePayStore().draft`) · `/done/:recordId` Outcome · `/activity` · `/shield` · `/profile`.
Hand-off: any screen that has a payment to check calls `usePayStore.getState().setDraft({ input, source, label? })` then
`navigate('/pay')`. Pay creates a `PayRecord` (`addRecord`) and, after the user's choice, navigates to `/done/<record.id>`.

## Contracts (read the files for the full types)

- `pay/src/store/payStore.ts` (head-owned): `usePayStore` with `deviceName`, `draft`, `records` (newest first, ≤50), `link
  {online, lastSeen, target}`, `setDeviceName`, `setDraft`, `addRecord`, `updateRecord`, `setLink`, `reset`; `newRecordId()`,
  `defaultDeviceName()`, `MAX_RECORDS`. Types `PayDraft`, `PayRecord`, `LinkStatus`.
- `pay/src/lib/payView.ts`: `paymentView(report) → PayView`, `withContext(input, {onCall, screenShare, scanToReceive})`,
  `formatInr`, `isDemoVpa`, `maskVpa`, `RECEIVE_CONTEXT_MESSAGE`; types `PayMode`, `PayTone`, `PayView`, `PayContext`.
- `pay/src/lib/link.ts`: `scanCheck(input, {device, source, replaces?, timeoutMs?, fetchImpl?})` → `{report, event, engine, ml}`
  (falls back to the in-browser engine, never throws), `sendDecision(id, decision)`, `heartbeat(device)`.
- Shared from the console: `src/types/link.ts` (`LinkSource`, `LinkDecision`, `LinkEvent`, `LinkTarget`), `src/types`
  (`AnalyzeInput`, `RiskReport`, `RiskLevelId`), `src/engine` (`analyzeLocal`, `fmtINR`, `scenarios`, `getScenario`, `qrScenarios()`,
  `levelOf`), `src/lib/qr` if present for QR decode helpers. Import them with relative paths (`../../../src/engine`).
- Demo QR text format (NOT a UPI link): lines `PAYRAKSHA://demo-payment`, `recipient=…@demo`, `amount=1999`, `merchant=…`,
  `source=WhatsApp Demo`, `urgency=true`, `recipientVerified=false`, `scenario=utility_scam`. Checked as `{ qrText }`.

## Safety rules (non-negotiable)

- Never initiate, authorize or simulate an actual UPI / bank transaction. A scanned or uploaded QR ALWAYS opens the check
  screen (`/pay`), never a payment. There is no PIN pad, no bank / account picker, and NO input for a UPI PIN, OTP, password,
  CVV or card number anywhere in the app. Never store real card details. Never contact real people.
- Only fake `@demo` payees can go through the demo "pay" flow, and even then the outcome says "SIMULATION · No money moved ·
  No bank was contacted". A real-looking UPI ID (not `@demo`) is analysis-only: masked (`sh•••@okaxis`), no pay button,
  "RakshaPay DEMO can't pay real UPI IDs". A QR with no payee says "This QR is not a payment".
- Never make external network requests: only this app's own `/api/*` (same origin, proxied). No analytics, fonts or CDNs.
- Never state fraud as certain: "Suspicious", "Potentially risky", "Multiple warning signals detected", "Check before you pay".
- Label things DEMO / SIMULATION; statistics are "SIMULATED HACKATHON DATA".

## Engineering rules

- React 19 + TypeScript strict (`noUnusedLocals`, `noUnusedParameters`), Tailwind 3.4, framer-motion, lucide-react,
  react-router-dom 7, zustand 5, jsqr / qrcode. No new dependencies.
- Tests: vitest + jsdom + Testing Library (`@testing-library/react`, `@testing-library/user-event`, jest-dom matchers are set up
  globally). Render screens inside `<MemoryRouter initialEntries={[route]}><Routes><Route path=... element=.../></Routes></MemoryRouter>`
  and reset the store in `beforeEach`: `usePayStore.setState({ draft: null, records: [], link: { online: false, lastSeen: null, target: null } })`.
  Mock `pay/src/lib/link.ts` with `vi.mock` when a screen calls it. Put tests next to the code as `*.test.tsx`.
- Never edit `package.json`, lockfiles, `pay/src/App.tsx`, `pay/src/store/**`, `pay/src/components/PhoneFrame.tsx`,
  `pay/src/components/DemoStrip.tsx`, `pay/tailwind.config.ts`, `pay/src/index.css`, `pay/vite.config.ts`, `src/**`, `test/acceptance/**`.
- Before finishing run `npx tsc --noEmit -p .` and your tests (`npx vitest run pay/src/...`), and fix everything.
