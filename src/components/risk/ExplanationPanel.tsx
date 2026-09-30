import type { RiskReport } from '../../types';
import { HudPanel, socToneForLevel } from '../soc';
import { levelTheme } from '../../lib/risk';
import { motion, useReducedMotion } from 'framer-motion';

export interface ExplanationPanelProps { report: RiskReport; title?: string; className?: string }

export function ExplanationPanel({ report, title, className = '' }: ExplanationPanelProps) {
  const heading = title ?? (report.level === 'LOW' ? 'WHY THIS LOOKS SAFER' : 'WHY ARE WE WARNING YOU?');
  const ex = report.explanation;
  const theme = levelTheme(report.level);
  const tone = socToneForLevel(report.level);
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
    <HudPanel
      as="div"
      tone={tone}
      eyebrow="EXPLANATION · SIMULATION"
      title={heading}
      className={className}
      bodyClassName="p-4"
    >
      <div className="mb-4">
        <p className="hud-label text-slate-200 mb-1">{ex.headline}</p>
        <p className="text-slate-300 text-sm leading-relaxed">{ex.summary}</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {ex.reasons.length > 0 && (
          <ul className="space-y-2">
            {ex.reasons.map((r, i) => (
              <motion.li key={i} variants={item} className="flex gap-2 text-sm text-slate-300">
                <span className={`shrink-0 flex-none ${theme.text}`}>▸</span>
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
        <div className="mt-6 pt-4 border-t border-cyan-400/10">
          <p className="text-xs text-slate-500">{ex.disclaimer}</p>
        </div>
      )}
    </HudPanel>
  );
}
