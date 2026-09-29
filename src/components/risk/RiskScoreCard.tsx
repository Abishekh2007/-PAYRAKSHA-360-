// STUB: replaced by the risk-core task.
// Contract: root has data-testid="risk-score-card", data-score, data-level; shows riskHeadline(level)
// (e.g. "🚨 HIGH RISK PAYMENT"), a RiskGauge and the text "{score} / 100".
import type { RiskReport } from '../../types';
import { riskHeadline } from '../../lib/risk';
import { RiskGauge } from '../ui/RiskGauge';

export interface RiskScoreCardProps { report: RiskReport; compact?: boolean; className?: string }

export function RiskScoreCard({ report, compact = false, className = '' }: RiskScoreCardProps) {
  return (
    <div data-testid="risk-score-card" data-score={report.score} data-level={report.level} data-compact={compact} className={className}>
      <p>{riskHeadline(report.level)}</p>
      <RiskGauge score={report.score} level={report.level} />
    </div>
  );
}
