# SOC shell contract (`AppLayout` in `src/components/layout`)

The app shell becomes a security-operations console: a left sidebar grouped into sections, a top status bar with the live
threat level, status pills, an IST clock and a scrolling simulated alert ticker, and the page in the middle.

Tests render it like this (after `act(() => useDemoStore.getState().resetDemo())`):

```tsx
render(
  <MemoryRouter initialEntries={[route]}>
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="*" element={<div data-testid="child">child</div>} />
      </Route>
    </Routes>
  </MemoryRouter>,
);
```

`AppLayout` is a named export of `src/components/layout/AppLayout.tsx` (also re-exported by `src/components/layout/index.ts`).
Routes come from `ROUTES` and `NAV_SECTIONS` in `src/routes.ts` (each route has `path`, `label`, `section`, `icon`).

## Required behaviour

1. The text `DEMO ENVIRONMENT — NO REAL PAYMENTS` is present (demo banner).
2. Exactly one element with role `navigation` and accessible name `Main` is in the document. It contains exactly the route links of
   item 3 and no other links: the brand/logo link and the JUDGE MODE link live outside it (brand above it in the sidebar, JUDGE MODE
   in the top bar).
3. Inside it, for every entry of `NAV_SECTIONS` in order, a visible section label with the exact text of `label`
   (`MONITOR`, `SHIELDS`, `INTELLIGENCE`, `LAB`, `RESPONSE`, `SYSTEM`), followed by one link per route whose `section` is that
   entry's `id`, in `ROUTES` order. Each link's accessible name contains the route `label` and its `href` is the route `path`
   (for example the link named `Command Center` has href `/dashboard`, `Scan QR` → `/qr`, `Signals Connected` → `/signals`,
   `Privacy` → `/privacy`, `Home` → `/`).
4. Routes whose section is `hidden` (`Judge Mode` `/judge`, `Technical View` `/technical`) are NOT links inside the `Main` navigation
   (no link in `Main` has href `/judge` or `/technical`). In test order, the hrefs of all links in `Main` are exactly:
   `/`, `/dashboard`, `/link`, `/live`, `/simulation`, `/qr`, `/message`, `/url`, `/payment`, `/threat-intel`, `/dna`, `/attack-chain`, `/explain`,
   `/signals`, `/lab`, `/what-if`, `/counterfactual`, `/qr-generator`, `/trusted`, `/elder`, `/report`, `/privacy`, `/demo-control`,
   `/technology`.
5. The link of the current route has `aria-current="page"`, and no other link in `Main` does (at `/dashboard`, only `Command Center`;
   at `/`, only `Home`, so `Home` must match its path exactly).
6. A top bar (`<header data-testid="soc-topbar">`, role `banner`; it is the ONLY `banner` landmark — any other `<header>` must sit inside a `<section>`, `<aside>`,
   `<nav>` or `<article>`, which makes it a plain header) contains the threat readout `data-testid="threat-level"` (the `ThreatLevel` component from
   `src/components/soc`) showing the store's current analysis: with no analysis it has `data-level="NONE"` and the text `MONITORING`;
   after `act(() => useDemoStore.getState().recordAnalysis({ label: 'x', input: r.input, report: r, source: 'browser' }))` with
   `r = runScenarioLocal('utility_scam')` it has `data-level="HIGH"` and contains `92/100`. Read the record with
   `useDemoStore((s) => s.current)`; do NOT use `useCurrentReport()` here (it falls back to the flagship report, so it would never
   show `MONITORING`).
7. The top bar contains an element `data-testid="soc-clock"` whose text matches `/^\d{2}:\d{2}:\d{2} IST$/` (India Standard Time,
   updated every second; use `istTime(Date.now())` from `src/components/soc`).
8. The top bar contains the status pills `ENGINE ONLINE` and `SIMULATION MODE` (text of `StatusPill`s).
9. A ticker with role `marquee` and accessible name `Simulated alert ticker` is present, built from `simulatedFeed()` with
   `tickerLine`; its text contains `SIMULATION`.
10. A link whose accessible name contains `JUDGE MODE` (text `🏆 JUDGE MODE`) with href `/judge`, inside the top bar (not in `Main`).
11. A switch (role `switch`) named `Elder Safety Mode`: clicking it sets `useDemoStore.getState().elderMode` to true and adds the
    class `elder` to `document.documentElement`; clicking again removes both. (The `Toggle` component from `src/components/ui`
    already renders `role="switch"` with `aria-checked`.)
12. A button labelled `Open menu` with `aria-expanded="false"` (shown on small screens). Clicking it sets `aria-expanded="true"` and
    its label becomes `Close menu`. The mobile drawer reuses the same `Main` navigation (do not render a second `navigation` named `Main`).
13. A skip link `Skip to main content` with href `#main`, and a `<main id="main">` that contains the routed page (`data-testid="child"`).
14. A footer (`<footer data-testid="soc-footer">`, role `contentinfo`, the only one) containing the text `SIMULATION` and the disclaimer text `DISCLAIMER`
    (from `src/engine`).

## Visual design (MIRRØR-style console; see docs/redesign/STYLE.md)

- Desktop (`lg` and up): a fixed left sidebar `w-60` (`hud-panel`-like dark column, `border-r border-cyan-400/15`, own scroll) and
  the content column to its right. Mobile: the sidebar is a slide-in drawer opened by the `Open menu` button, with a dim backdrop.
- Sidebar top: brand block — shield icon, `PAYRAKSHA 360` (mono, bold), eyebrow `THREAT DEFENSE CONSOLE`, and a small
  `SIMULATION` chip. Brand links to `/` (outside the `Main` nav).
- Sidebar sections: section label as `hud-eyebrow` with a thin dashed rule, then compact rows (lucide icon from the route + label,
  `text-[13px]`). Active row: `border-l-2 border-cyan-400 bg-cyan-400/10 text-cyan-200`; idle: `text-slate-400 hover:bg-white/5
  hover:text-slate-200`. `Live Protection` and `Live Attack Simulation` rows show a small pulsing red `LiveDot`.
- Sidebar bottom: the `Elder Safety Mode` switch and the line `SIMULATED HACKATHON DATA` in `hud-label`.
- Above the top bar: a thin full-width amber strip with `DEMO ENVIRONMENT — NO REAL PAYMENTS` (mono, 11px, centred).
- Top bar (`sticky top-0 z-30`, `bg-soc-void/85 backdrop-blur`, `border-b border-cyan-400/15`): menu button (mobile only), breadcrumb
  `CONSOLE / <SECTION LABEL> / <ROUTE LABEL>` (mono, 11px; derive from the current path), then on the right `ThreatLevel`, the pills
  (`ENGINE ONLINE` green with pulse, `SIMULATION MODE` amber), the `soc-clock`, and the `🏆 JUDGE MODE` link as a small outline button.
  On small screens hide the breadcrumb and pills, keep the threat level, clock and menu button.
- Under the top bar: the `Ticker` (full width, `border-b border-cyan-400/10`).
- `main`: the routed page. Footer: compact mono line(s) with `SIMULATION`, the disclaimer and `PAYRAKSHA 360 · HACKATHON PROTOTYPE`.
- `PageShell` (also in `src/components/layout`, used by every page) becomes a compact console page header: `// {eyebrow}` in
  `hud-eyebrow` with the icon, the `h1` in mono `text-2xl md:text-3xl font-semibold text-white`, subtitle `text-sm text-slate-400
  max-w-3xl`, actions right-aligned, a `hud-rule` under the header, content below. Keep its props, its `data-width` attribute and the
  `narrow`/`default`/`wide` widths (default becomes `max-w-7xl`, wide `max-w-[96rem]`), and reduce vertical padding (`py-6`).
