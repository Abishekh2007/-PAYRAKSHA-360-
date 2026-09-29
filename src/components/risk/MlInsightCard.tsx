// STUB: replaced by the risk-core task. Renders nothing when ml is null or unavailable.
import type { MlInsight } from '../../types';

export interface MlInsightCardProps { ml: MlInsight | null | undefined; className?: string }

export function MlInsightCard({ ml, className = '' }: MlInsightCardProps) {
  if (!ml || !ml.available) return null;
  return <div data-testid="ml-insight" className={className}>{ml.label} {Math.round(ml.scamProbability * 100)}%</div>;
}
