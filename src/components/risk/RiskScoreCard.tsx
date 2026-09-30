import type { RiskReport } from '../../types';
import { riskHeadline, levelTheme } from '../../lib/risk';
import { HudPanel, StatusPill, socToneForLevel } from '../soc';
import { motion, useReducedMotion } from 'framer-motion';

export interface RiskScoreCardProps { report: RiskReport; compact?: boolean; className?: string }

export function RiskScoreCard({ report, compact = false, className = '' }: RiskScoreCardProps) {
  const theme = levelTheme(report.level);
  const shouldReduceMotion = useReducedMotion();
  const tone = socToneForLevel(report.level);

  // Level boundary ticks (0-100 bar)
  const BOUNDARIES = [
    { at: 20, label: '20' },
    { at: 50, label: '50' },
    { at: 75, label: '75' },
  ];

  return (
    <div
      data-testid="risk-score-card"
      data-score={report.score}
      data-level={report.level}
      data-compact={compact}
      className={className}
    >
    <HudPanel
      as="div"
      tone={tone}
      eyebrow="RISK ASSESSMENT · SIMULATION"
      title={riskHeadline(report.level)}
      bodyClassName="p-4"
    >
      {/* Big glowing score */}
      <div className="flex flex-col items-center gap-3 py-2">
        <motion.div
          initial={shouldReduceMotion ? {} : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className={`hud-num text-5xl font-bold tabular-nums hud-glow ${theme.text}`}
        >
          {report.score} / 100
        </motion.div>

        {/* Level pill */}
        <StatusPill tone={tone} pulse={report.level === 'HIGH'}>
          {report.levelLabel}
        </StatusPill>

        {/* 0–100 progress bar with boundary ticks */}
        <div className="w-full mt-2 relative">
          <div className="w-full h-2 bg-slate-800 rounded-sm overflow-hidden relative">
            <motion.div
              initial={shouldReduceMotion ? {} : { width: 0 }}
              animate={{ width: `${report.score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-sm ${theme.bg.replace('/15', '/80')}`}
              style={{ backgroundColor: theme.hex }}
            />
            {/* Tick marks */}
            {BOUNDARIES.map(b => (
              <div
                key={b.at}
                className="absolute top-0 bottom-0 w-px bg-slate-600/60"
                style={{ left: `${b.at}%` }}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 relative" aria-hidden="true">
            <span className="hud-eyebrow text-[9px]">0</span>
            {BOUNDARIES.map(b => (
              <span
                key={b.at}
                className="hud-eyebrow text-[9px] absolute"
                style={{ left: `${b.at}%`, transform: 'translateX(-50%)' }}
              >
                {b.label}
              </span>
            ))}
            <span className="hud-eyebrow text-[9px]">100</span>
          </div>
        </div>

        {report.patternName && (
          <div className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border ${theme.border} ${theme.bg} ${theme.text}`}>
            Pattern: {report.patternName}
          </div>
        )}

        <div className="hud-eyebrow mt-1">SIMULATION · DEMO DATA</div>
      </div>
    </HudPanel>
    </div>
  );
}
