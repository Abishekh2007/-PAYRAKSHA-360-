import { Link, NavLink } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { ROUTES, NAV_SECTIONS } from '../../routes';
import { Toggle } from '../ui';
import { useDemoStore } from '../../store/demoStore';
import { LiveDot } from '../soc';

interface NavbarProps {
  open: boolean;
  onClose: () => void;
}

const visibleRoutes = ROUTES.filter((r) => r.section !== 'hidden');
const liveRoutes = new Set(['/live', '/simulation']);

export function Navbar({ open, onClose }: NavbarProps) {
  const elderMode = useDemoStore((s) => s.elderMode);
  const toggleElderMode = useDemoStore((s) => s.toggleElderMode);

  return (
    <>
      {open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-cyan-400/15 bg-navy-950 transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}
      >
        <div className="flex-shrink-0 border-b border-cyan-400/15 px-3 py-4">
          <Link to="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm">
            <div className="brand-gradient flex h-8 w-8 items-center justify-center rounded-2xl shadow-glow-brand shrink-0">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display text-[13px] font-bold text-white uppercase tracking-wider">
                PAYRAKSHA 360
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="hud-eyebrow text-cyan-400/70">THREAT DEFENSE CONSOLE</p>
                <div className="chip bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 px-1 py-0 text-[8px] uppercase tracking-widest font-mono">
                  DEMO
                </div>
              </div>
            </div>
          </Link>
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto py-2">
          {NAV_SECTIONS.map((section) => {
            const sectionRoutes = visibleRoutes.filter((r) => r.section === section.id);
            if (sectionRoutes.length === 0) return null;
            return (
              <div key={section.id} className="mb-3">
                <div className="flex items-center gap-2 px-4 py-1.5">
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
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 text-[13px] transition-colors rounded-xl mx-2 relative overflow-hidden ${
                          isActive
                            ? 'bg-gradient-to-r from-brand-indigo/25 to-brand-aqua/10 text-white ring-1 ring-white/10'
                            : 'text-slate-300 hover:bg-white/5'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <div className="absolute left-0 top-0 w-1 h-full brand-gradient" />
                          )}
                          <Icon size={14} className="shrink-0" />
                          <span className="flex-1 font-sans">{route.label}</span>
                          {isLive && <LiveDot tone="red" pulse />}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

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
