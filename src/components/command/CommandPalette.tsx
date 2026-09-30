// Command palette (Ctrl/⌘+K), mounted once in AppLayout.
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, HeartHandshake, RotateCcw, Smartphone, Play } from 'lucide-react';
import { ROUTES } from '../../routes';
import { scenarios, runScenarioLocal } from '../../engine';
import { useDemoStore } from '../../store/demoStore';

/** Window event that opens the palette; the top bar's search button dispatches it via openCommandPalette(). */
export const PALETTE_EVENT = 'payraksha:palette';

export function openCommandPalette(): void {
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT));
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    const handleEvent = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener(PALETTE_EVENT, handleEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(PALETTE_EVENT, handleEvent);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      // Let React render first so input is mounted
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const items = useMemo(() => {
    const q = query.toLowerCase();

    const pages = ROUTES.map((r) => ({
      id: `page-${r.path}`,
      group: 'Pages',
      label: r.label,
      icon: r.icon,
      onSelect: () => navigate(r.path),
    }));

    const scens = scenarios.map((s) => ({
      id: `scen-${s.id}`,
      group: 'Run a demo scenario',
      label: `Run scenario: ${s.title}`,
      icon: Play,
      onSelect: () => {
        const input = { scenarioId: s.id } as any;
        const report = runScenarioLocal(s.id);
        useDemoStore.getState().recordAnalysis({
          label: s.title,
          input,
          report,
          source: 'browser',
        });
        navigate('/explain');
      },
    }));

    const actions = [
      {
        id: 'action-elder',
        group: 'Actions',
        label: 'Toggle elder mode',
        icon: HeartHandshake,
        onSelect: () => useDemoStore.getState().toggleElderMode(),
      },
      {
        id: 'action-reset',
        group: 'Actions',
        label: 'Reset demo data',
        icon: RotateCcw,
        onSelect: () => useDemoStore.getState().resetDemo(),
      },
      {
        id: 'action-link',
        group: 'Actions',
        label: 'Open Device Link (phone)',
        icon: Smartphone,
        onSelect: () => navigate('/link'),
      },
    ];

    const all = [...pages, ...scens, ...actions];
    return q ? all.filter((cmd) => cmd.label.toLowerCase().includes(q)) : all;
  }, [query, navigate]);

  useEffect(() => {
    setActiveIdx(0);
  }, [items]);

  const handleClose = () => setIsOpen(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % (items.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + (items.length || 1)) % (items.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[activeIdx]) {
          items[activeIdx].onSelect();
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, items, activeIdx]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -10 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            className="w-full max-w-xl relative glass-strong rounded-2xl overflow-hidden flex flex-col max-h-[70vh] shadow-glass"
          >
            <div className="flex items-center px-5 py-4 border-b border-white/10 shrink-0">
              <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-white font-sans text-[15px] outline-none placeholder-slate-400 w-full"
                placeholder="Search pages, scenarios and actions…"
                aria-label="Search commands"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2" role="listbox">
              {items.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400 font-sans">
                  No results
                </div>
              ) : (
                items.map((item, i) => {
                  const isGrpFirst = i === 0 || items[i - 1].group !== item.group;
                  return (
                    <div key={item.id}>
                      {isGrpFirst && (
                        <div className="hud-eyebrow px-3 py-2 mt-2 select-none">
                          {item.group}
                        </div>
                      )}
                      <div
                        role="option"
                        aria-selected={i === activeIdx}
                        onMouseEnter={() => setActiveIdx(i)}
                        onClick={() => {
                          item.onSelect();
                          handleClose();
                        }}
                        className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${
                          i === activeIdx ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 mr-3 shrink-0 transition-colors ${i === activeIdx ? 'text-cyan-300' : 'text-slate-400'}`} />
                        <span className="font-sans text-sm truncate">{item.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="shrink-0 px-4 py-3 border-t border-white/10 text-xs text-slate-400 font-sans text-right select-none">
              ESC to close
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
