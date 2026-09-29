// STUB: replaced by the risk-core task.
// Contract: root data-testid="risk-result" data-score data-level. Composes PaymentPreview (when showPayment),
// RiskScoreCard, ExplanationPanel, RecommendationPanel, EngineBadge (when source is given) and MlInsightCard.
// Must be rendered inside a Router. Default action handling when onAction is not given:
// 'analysis' -> navigate('/explain'), 'trusted' -> navigate('/trusted'); 'verify', 'cancel' and 'continue' show an inline demo note.
import type { ActionId, EngineSource, MlInsight, RiskReport } from '../../types';
import { EngineBadge } from '../ui/EngineBadge';
import { ExplanationPanel } from './ExplanationPanel';
import { MlInsightCard } from './MlInsightCard';
import { PaymentPreview } from './PaymentPreview';
import { RecommendationPanel } from './RecommendationPanel';
import { RiskScoreCard } from './RiskScoreCard';

export interface RiskResultViewProps {
  report: RiskReport;
  source?: EngineSource;
  latencyMs?: number | null;
  ml?: MlInsight | null;
  /** Default true. */
  showPayment?: boolean;
  onAction?: (id: ActionId) => void;
  className?: string;
}

export function RiskResultView({ report, source, latencyMs = null, ml = null, showPayment = true, onAction, className = '' }: RiskResultViewProps) {
  return (
    <div data-testid="risk-result" data-score={report.score} data-level={report.level} className={className}>
      {showPayment && <PaymentPreview payment={report.payment} />}
      <RiskScoreCard report={report} />
      <ExplanationPanel report={report} />
      <RecommendationPanel recommendation={report.recommendation} level={report.level} onAction={onAction} />
      {source && <EngineBadge source={source} latencyMs={latencyMs} />}
      <MlInsightCard ml={ml} />
    </div>
  );
}
