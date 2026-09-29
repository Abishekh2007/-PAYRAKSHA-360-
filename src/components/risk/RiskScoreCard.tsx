import type { RiskReport } from '../../types';
import { riskHeadline, levelTheme } from '../../lib/risk';
import { RiskGauge } from '../ui/RiskGauge';
import { SimulationBadge } from '../ui/SimulationBadge';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { motion, useReducedMotion } from 'framer-motion';

export interface RiskScoreCardProps { report: RiskReport; compact?: boolean; className?: string }

export function RiskScoreCard({ report, compact = false, className = '' }: RiskScoreCardProps) {
  const theme = levelTheme(report.level);
  const shouldReduceMotion = useReducedMotion();
  const isHigh = report.level === 'HIGH';

  return (
    <GlassCard
      data-testid="risk-score-card"
      data-score={report.score}
      data-level={report.level}
      data-compact={compact}
      glow={report.level}
      className={`relative ${className}`}
    >
      <div className="flex flex-col items-center justify-center p-4">
        {isHigh ? (
          <motion.div
            initial={{ scale: shouldReduceMotion ? 1 : 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-4 text-center"
          >
            <h2 className={`text-2xl font-display font-bold ${theme.text}`}>
              {riskHeadline(report.level)}
            </h2>
          </motion.div>
        ) : (
          <div className="mb-4 text-center">
            <h2 className={`text-2xl font-display font-bold ${theme.text}`}>
              {riskHeadline(report.level)}
            </h2>
          </div>
        )}

        <RiskGauge score={report.score} level={report.level} />

        <div className="mt-4 text-center">
          <div className="text-3xl font-mono font-bold mb-1">
            {report.score} / 100
          </div>
          <div className={`text-lg font-semibold mb-3 ${theme.text}`}>
            {report.levelLabel}
          </div>
          {report.patternName && (
            <Badge tone={theme.tone} className="mb-4 inline-block">
              Pattern: {report.patternName}
            </Badge>
          )}
        </div>

        <div className="mt-2 text-center w-full flex justify-center">
          <SimulationBadge />
        </div>
      </div>
    </GlassCard>
  );
}
