import { Suspense, useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Menu, X, Search, Bell } from 'lucide-react';
import { PalettePicker } from '../../theme/PalettePicker';
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
import { LinkToaster } from '../link/LinkToaster';
import { CommandPalette, openCommandPalette } from '../command/CommandPalette';
import { DemoBanner } from './DemoBanner';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

function SocClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      data-testid="soc-clock"
      className="font-mono text-[11px] tabular-nums text-slate-300 whitespace-nowrap hidden sm:inline-block"
    >
      {istTime(now)} IST
    </span>
  );
}

function AlertTicker() {
  const items = useMemo(
    () => simulatedFeed({ now: Date.now() }).map(tickerLine),
    [],
  );
  return (
    <Ticker
      items={items}
      className="border-b border-cyan-400/10 text-[10px]"
    />
  );
}

function TopBar({
  menuOpen,
  onMenuToggle,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  const current = useDemoStore((s) => s.current);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header
      data-testid="soc-topbar"
      role="banner"
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-cyan-400/15 bg-white/90 px-4 py-3 backdrop-blur"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={onMenuToggle}
          className="flex-shrink-0 rounded-sm border border-cyan-400/20 p-1.5 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-300 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        <div className="hidden lg:flex flex-col">
          <span className="whitespace-nowrap text-sm font-medium text-slate-200">{greeting} · Demo user</span>
        </div>
      </div>

      <div className="flex min-w-[180px] flex-1 items-center gap-2 max-w-md mx-4">
        <button
          type="button"
          aria-label="Open command palette"
          onClick={openCommandPalette}
          className="flex flex-1 items-center justify-between gap-2 rounded-full border border-cyan-400/20 bg-black/20 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-cyan-400/40 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <div className="flex items-center gap-2">
            <Search size={16} />
            <span className="hidden whitespace-nowrap sm:inline">Search or jump to…</span>
          </div>
          <kbd className="hidden sm:inline-block rounded border border-cyan-400/20 bg-black/30 px-1.5 py-0.5 font-mono text-[9px]">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        <PalettePicker />
        <Link
          to="/link"
          aria-label="Phone link alerts"
          className="relative inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-full"
        >
          <Bell size={18} />
        </Link>
        <ThreatLevel
          level={current?.report.level ?? null}
          score={current?.report.score}
          compact
        />
        <StatusPill tone="green" pulse className="hidden xl:inline-flex">
          ENGINE ONLINE
        </StatusPill>
        <StatusPill tone="amber" className="hidden xl:inline-flex">
          SIMULATION MODE
        </StatusPill>
        <SocClock />
        <Link
          to="/judge"
          className="flex items-center rounded-xl border border-cyan-400/30 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 whitespace-nowrap"
        >{'🏆 '}<span className="hidden sm:inline">JUDGE MODE</span></Link>
        <div aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/20 font-display text-xs font-bold text-cyan-300 border border-cyan-400/30 ml-1">
          DU
        </div>
      </div>
    </header>
  );
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const elderMode = useDemoStore((s) => s.elderMode);

  useEffect(() => {
    document.documentElement.classList.toggle('elder', elderMode);
    return () => {
      document.documentElement.classList.remove('elder');
    };
  }, [elderMode]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-navy-950 font-sans text-slate-300 selection:bg-cyan-500/30">
      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>
      <DemoBanner />
      <div className="flex flex-1 overflow-hidden">
        <Navbar open={sidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-1 flex-col min-w-0 max-w-full overflow-hidden">
          <TopBar menuOpen={sidebarOpen} onMenuToggle={toggleSidebar} />
          <AlertTicker />
          <main id="main" tabIndex={-1} className="flex-1 overflow-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
            <Suspense
              fallback={
                <div className="flex items-center gap-2 px-4 py-6 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <LiveDot tone="cyan" pulse />
                  LOADING MODULE…
                </div>
              }
            >
              <motion.div
                key={location.pathname}
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </Suspense>
          </main>
          <Footer />
        </div>
      </div>
      <LinkToaster />
      <CommandPalette />
    </div>
  );
}
