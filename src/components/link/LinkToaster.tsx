import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLinkFeed } from '../../services/link';
import { useDemoStore } from '../../store/demoStore';
import { analyzeLocal, fmtINR } from '../../engine';
import { socToneForLevel, SOC_TONES } from '../soc/tones';
import { Smartphone, X } from 'lucide-react';
import { Button } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastData {
  id: string; // unique toast id
  eventId: string; // source link event id
  title: string;
  recipient: string | null;
  amount: number | null;
  score: number;
  levelLabel: string;
  toneInfo: { text: string; bg: string; border: string; dot: string; hex: string; };
}

export function LinkToaster() {
  const feed = useLinkFeed();
  const navigate = useNavigate();
  const knownEvents = useRef<Map<string, { seq: number, inputString: string }>>(new Map());
  const initialized = useRef(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    if (!feed.reachable) return;

    if (!initialized.current) {
      for (const e of feed.events) {
        knownEvents.current.set(e.id, { seq: e.seq, inputString: JSON.stringify(e.input) });
      }
      initialized.current = true;
      return;
    }

    let newToasts: ToastData[] = [];

    for (const e of feed.events) {
      const prev = knownEvents.current.get(e.id);
      if (!prev || e.seq > prev.seq) {
        const prevInputStr = prev?.inputString;
        const currInputStr = JSON.stringify(e.input);

        let kind: 'new' | 'recheck' | 'decision';
        if (!prev) {
          kind = 'new';
        } else if (currInputStr !== prevInputStr) {
          kind = 'recheck';
        } else {
          kind = 'decision';
        }

        knownEvents.current.set(e.id, { seq: e.seq, inputString: currInputStr });

        let title = '';
        if (kind === 'new') {
          title = `${e.device} checked a payment`;
        } else if (kind === 'recheck') {
          title = `${e.device} re-checked with more context`;
        } else {
          const decisions: Record<string, string> = {
            cancelled: 'Cancelled',
            verify: 'Verify payee',
            trusted: 'Ask a trusted contact',
            paid_demo: 'Paid (demo)'
          };
          const label = decisions[e.decision] || e.decision;
          title = `${e.device} chose: ${label}`;
        }

        if (kind === 'new' || kind === 'recheck') {
          useDemoStore.getState().recordAnalysis({
            label: `Phone · ${e.device} · ${e.recipient ?? 'QR check'}`,
            input: e.input,
            report: analyzeLocal(e.input),
            source: 'browser'
          });
        }

        const toneColor = socToneForLevel(e.level);
        const toneInfo = SOC_TONES[toneColor];

        newToasts.push({
          id: `${e.id}-${e.seq}`,
          eventId: e.id,
          title,
          recipient: e.recipient,
          amount: e.amount,
          score: e.score,
          levelLabel: e.levelLabel,
          toneInfo
        });
      }
    }

    if (newToasts.length > 0) {
      newToasts.forEach(nt => {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== nt.id));
        }, 6000);
      });

      setToasts(prev => {
        // newest on top
        const combined = [...newToasts.reverse(), ...prev];
        return combined.slice(0, 3);
      });
    }

  }, [feed.reachable, feed.events]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-auto p-4 md:p-6 pb-[calc(1rem+16px)] md:pb-6 z-50 flex flex-col gap-3 max-w-[420px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="hud-panel glass-strong pointer-events-auto p-4 flex flex-col gap-3 relative"
            style={{ marginBottom: 0 }}
          >
            <button
              aria-label="Dismiss"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-400/10 text-cyan-300 flex items-center justify-center shrink-0">
                <Smartphone size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{toast.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400 truncate">
                    {toast.recipient || 'Unknown'} {toast.amount ? `· ${fmtINR(toast.amount)}` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className={`px-2 py-1 rounded border ${toast.toneInfo.bg} ${toast.toneInfo.border} flex items-center gap-1.5 shrink-0`}>
                <div className={`w-1.5 h-1.5 rounded-full ${toast.toneInfo.dot}`} />
                <span className={`hud-num text-[11px] ${toast.toneInfo.text}`}>RISK {toast.score}</span>
              </div>
              <span className={`text-[11px] font-display uppercase ${toast.toneInfo.text} truncate`}>
                {toast.levelLabel}
              </span>
              <span className="ml-auto text-[9px] hud-eyebrow border border-slate-600 text-slate-400 px-1.5 py-0.5 rounded">
                SIMULATION
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" variant="primary" onClick={() => navigate('/explain')} fullWidth>
                View analysis
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/link')} fullWidth>
                Device Link
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default LinkToaster;
