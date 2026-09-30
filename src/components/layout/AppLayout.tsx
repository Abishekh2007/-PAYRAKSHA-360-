import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet, useLocation, NavLink, Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { ROUTES, NAV_SECTIONS, routeByPath } from '../../routes';
import { Toggle } from '../ui';
import { useDemoStore } from '../../store/demoStore';
import {
  ThreatLevel,
  StatusPill,
  LiveDot,
  Ticker,
  simulatedFeed,
  tickerLine,
  istTime,
} from '../soc';
import { DISCLAIMER } from '../../engine';

// ─── IST Clock ───────────────────────────────────────────────────────────────

function SocClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      data-testid="soc-clock"
      className="font-mono text-[11px] tabular-nums text-slate-300 whitespace-nowrap"
    >
      {istTime(now)} IST
    </span>
  );
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────────

const visibleRoutes = ROUTES.filter((r) => r.section !== 'hidden');
const liveRoutes = new Set(['/live', '/simulation']);

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto py-2">
      {NAV_SECTIONS.map((section) => {
        const sectionRoutes = visibleRoutes.filter((r) => r.section === section.id);
        if (sectionRoutes.length === 0) return null;
        return (
          <div key={section.id} className="mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="hud-eyebrow text-slate-500">{section.label}</span>
              <span className="flex-1 border-t border-dashed border-cyan-400/20" />
            </div>
            {sectionRoutes.map((route) => {
              const Icon = route.icon;
              const isLive = liveRoutes.has(route.path);
              return (
                <NavLink
                  key={route.path}
                  to={route.path}
                  end={route.path === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 text-[13px] transition-colors ${
                      isActive
                        ? 'border-l-2 border-cyan-400 bg-cyan-400/10 text-cyan-200'
                        : 'border-l-2 border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon size={13} className="shrink-0" />
                  <span className="flex-1 font-mono">{route.label}</span>
                  {isLive && <LiveDot tone="red" pulse />}
                </NavLink>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const elderMode = useDemoStore((s) => s.elderMode);
  const toggleElderMode = useDemoStore((s) => s.toggleElderMode);

  const transitionClass = reducedMotion
    ? open ? '' : 'hidden'
    : open
    ? 'translate-x-0'
    : '-translate-x-full';

  return (
    <>
      {/* Dim backdrop on mobile */}
      {open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-cyan-400/15 bg-soc-void
          ${reducedMotion ? '' : 'transition-transform duration-200'}
          ${transitionClass}
          lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Brand block */}
        <div className="flex-shrink-0 border-b border-cyan-400/15 px-3 py-4">
          <Link to="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm">
            <ShieldCheck size={18} className="text-cyan-400 shrink-0" />
            <div>
              <p className="font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-white">
                PAYRAKSHA 360
              </p>
              <p className="hud-eyebrow text-cyan-400/70">THREAT DEFENSE CONSOLE</p>
            </div>
          </Link>
          <span className="mt-1.5 inline-block rounded-sm border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-amber-300">
            SIMULATION
          </span>
        </div>

        {/* Navigation */}
        <SidebarNav onNavigate={onClose} />

        {/* Bottom: Elder switch */}
        <div className="flex-shrink-0 border-t border-cyan-400/15 px-3 py-3 space-y-2">
          <Toggle
            checked={elderMode}
            onChange={() => toggleElderMode()}
            label="Elder Safety Mode"
          />
          <p className="hud-label text-slate-600 px-1">SIMULATED HACKATHON DATA</p>
        </div>
      </aside>
    </>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({
  menuOpen,
  onMenuToggle,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  const location = useLocation();
  const current = useDemoStore((s) => s.current);

  const route = routeByPath(location.pathname);
  const sectionLabel =
    route?.section === 'hidden'
      ? null
      : NAV_SECTIONS.find((s) => s.id === route?.section)?.label;

  const breadcrumb = route
    ? sectionLabel
      ? `CONSOLE / ${sectionLabel} / ${route.label}`
      : `CONSOLE / ${route.label}`
    : 'CONSOLE';

  return (
    <header
      data-testid="soc-topbar"
      className="sticky top-0 z-30 flex items-center gap-3 border-b border-cyan-400/15 bg-soc-void/85 px-3 py-2 backdrop-blur hud-scanlines"
    >
      {/* Mobile menu button */}
      <button
        type="button"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={onMenuToggle}
        className="flex-shrink-0 rounded-sm border border-cyan-400/20 p-1.5 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-300 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        {menuOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      {/* Breadcrumb */}
      <span className="hidden flex-1 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500 md:block">
        {breadcrumb}
      </span>
      <span className="flex-1 md:hidden" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        <ThreatLevel
          level={current?.report.level ?? null}
          score={current?.report.score}
        />

        <StatusPill tone="green" pulse className="hidden md:inline-flex">
          ENGINE ONLINE
        </StatusPill>
        <StatusPill tone="amber" className="hidden md:inline-flex">
          SIMULATION MODE
        </StatusPill>

        <SocClock />

        <Link
          to="/judge"
          className="flex items-center gap-1 rounded-sm border border-cyan-400/25 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 whitespace-nowrap"
        >
          🏆 JUDGE MODE
        </Link>
      </div>
    </header>
  );
}

// ─── Alert Ticker ─────────────────────────────────────────────────────────────

function AlertTicker() {
  const items = useMemo(
    () => simulatedFeed({ now: Date.now() }).map(tickerLine),
    [],
  );
  return (
    <Ticker
      items={items}
      className="border-b border-cyan-400/10 bg-soc-void/60 py-1.5"
    />
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const elderMode = useDemoStore((s) => s.elderMode);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Sync elder mode class
  useEffect(() => {
    document.documentElement.classList.toggle('elder', elderMode);
    return () => {
      document.documentElement.classList.remove('elder');
    };
  }, [elderMode]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[999] focus:bg-cyan-400 focus:px-4 focus:py-2 focus:font-mono focus:text-black focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Demo banner */}
      <div className="w-full bg-amber-500/10 border-b border-amber-400/20 py-1 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-amber-300">
        DEMO ENVIRONMENT — NO REAL PAYMENTS
      </div>

      {/* Body: sidebar + content column */}
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />

        {/* Content column */}
        <div className="flex flex-1 flex-col min-w-0">
          <TopBar menuOpen={sidebarOpen} onMenuToggle={toggleSidebar} />
          <AlertTicker />

          <main id="main" tabIndex={-1} className="flex-1">
            <Suspense
              fallback={
                <div className="flex items-center gap-2 px-4 py-6 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <LiveDot tone="cyan" pulse />
                  LOADING MODULE…
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </main>

          <footer
            data-testid="soc-footer"
            className="border-t border-cyan-400/15 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-600"
          >
            <p className="mb-1">
              SIMULATION · PAYRAKSHA 360 · HACKATHON PROTOTYPE
            </p>
            <p className="text-slate-700 normal-case text-[9px] tracking-normal">
              {DISCLAIMER}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
