import type { RiskReport } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { levelTheme } from '../../lib/risk';
import { motion, useReducedMotion } from 'framer-motion';

export interface ExplanationPanelProps { report: RiskReport; title?: string; className?: string }

export function ExplanationPanel({ report, title, className = '' }: ExplanationPanelProps) {
  const heading = title ?? (report.level === 'LOW' ? 'WHY THIS LOOKS SAFER' : 'WHY ARE WE WARNING YOU?');
  const ex = report.explanation;
  const theme = levelTheme(report.level);
  const shouldReduceMotion = useReducedMotion();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05, duration: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 5 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <GlassCard className={className}>
      <h3 className="text-lg font-display font-semibold mb-4 text-slate-200">{heading}</h3>
      <div className="mb-4">
        <h4 className="font-semibold mb-1 text-slate-200">{ex.headline}</h4>
        <p className="text-slate-300 text-sm leading-relaxed">{ex.summary}</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {ex.reasons.length > 0 && (
          <ul className="space-y-2">
            {ex.reasons.map((r, i) => (
              <motion.li key={i} variants={item} className="flex gap-2 text-sm text-slate-300">
                <span className={`shrink-0 flex-none ${theme.text}`}>⚠️</span>
                <span>{r}</span>
              </motion.li>
            ))}
          </ul>
        )}

        {ex.trustSignals.length > 0 && (
          <ul className="space-y-2">
            {ex.trustSignals.map((t, i) => (
              <motion.li key={i} variants={item} className="flex gap-2 text-sm text-green-400">
                <span className="shrink-0 flex-none font-bold">✓</span>
                <span>{t}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>

      {ex.disclaimer && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-slate-500">{ex.disclaimer}</p>
        </div>
      )}
    </GlassCard>
  );
}
