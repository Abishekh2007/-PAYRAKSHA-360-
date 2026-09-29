import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, X, ChevronDown } from 'lucide-react';
import { ROUTES } from '../../routes';
import { Toggle } from '../ui';
import { useDemoStore } from '../../store/demoStore';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const elderMode = useDemoStore((s) => s.elderMode);
  const setElderMode = useDemoStore((s) => s.setElderMode);
  const location = useLocation();
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const primaryRoutes = ROUTES.filter((r) => r.group === 'primary');
  const moreRoutes = ROUTES.filter((r) => r.group === 'more');

  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMoreMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuOpen && moreMenuRef.current && moreButtonRef.current) {
        if (!moreMenuRef.current.contains(e.target as Node) && !moreButtonRef.current.contains(e.target as Node)) {
          setMoreMenuOpen(false);
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreMenuOpen]);

  return (
    <header className="border-b border-white/10 bg-navy-950 p-4 lg:px-8">
      <nav aria-label="Main" className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 text-brand-400 transition-colors hover:text-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg">
          <ShieldCheck className="h-8 w-8 shrink-0" />
          <div className="flex flex-col justify-center">
            <span className="font-display text-xl font-bold tracking-widest text-white leading-none whitespace-nowrap">PAYRAKSHA 360</span>
            <span className="hidden text-[0.65rem] font-bold uppercase tracking-widest text-brand-400 lg:block mt-1">Think Before You Pay.</span>
          </div>
        </Link>


        <div className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          {primaryRoutes.map((r) => (
            <NavLink
              key={r.path}
              to={r.path}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 whitespace-nowrap ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {r.label}
            </NavLink>
          ))}

          <div className="relative ml-2">
            <button
              ref={moreButtonRef}
              type="button"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              aria-haspopup="menu"
              aria-expanded={moreMenuOpen}
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            >
              <span>More</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreMenuOpen && (
              <div
                ref={moreMenuRef}
                className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/10 bg-navy-900 p-2 shadow-2xl shadow-black/80 z-50 max-h-[70vh] overflow-y-auto"
                role="menu"
              >
                <div className="grid grid-cols-1 gap-1">
                  {moreRoutes.map((r) => {
                    const Icon = r.icon;
                    return (
                      <Link
                        key={r.path}
                        to={r.path}
                        role="menuitem"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white focus:outline-none"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {r.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="hidden items-center gap-6 xl:flex">
          <Link
            to="/judge"
            className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-navy-950 shadow-glow-caution transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 whitespace-nowrap"
          >
            🏆 JUDGE MODE
          </Link>
          <div className="flex h-8 items-center gap-3 border-l border-white/10 pl-6">
            <Toggle checked={elderMode} onChange={setElderMode} label="Elder Safety Mode" className="text-sm font-medium text-slate-300 whitespace-nowrap hidden md:inline-flex" />
          </div>
        </div>


        <button
          type="button"
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 xl:hidden"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>


      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[var(--header-height)] z-50 flex flex-col overflow-y-auto bg-navy-950 p-4 xl:hidden" style={{ '--header-height': '113px', paddingTop: '20px' } as React.CSSProperties}>
          <div className="flex flex-col gap-2 pb-12">
             {primaryRoutes.map((r) => (
                <NavLink
                  key={r.path}
                  to={r.path}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-lg font-medium transition-colors ${
                      isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {r.label}
                </NavLink>
              ))}

              <div className="my-4 h-px w-full bg-white/10" />
              <div className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500">More Options</div>

              {moreRoutes.map((r) => {
                const Icon = r.icon;
                return (
                  <Link
                    key={r.path}
                    to={r.path}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {r.label}
                  </Link>
                )
              })}

              <div className="my-4 h-px w-full bg-white/10" />
              <Link
                to="/judge"
                className="mx-4 flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-base font-bold text-navy-950 shadow-glow-caution transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                🏆 JUDGE MODE
              </Link>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 mx-4">
                <span className="text-sm font-medium text-slate-300">Elder Safety Mode</span>
                <Toggle checked={elderMode} onChange={setElderMode} label="Elder Safety Mode" className="text-sm" />
              </div>
          </div>
        </div>
      )}
    </header>
  );
}
