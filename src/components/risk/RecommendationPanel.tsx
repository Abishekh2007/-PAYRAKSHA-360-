// STUB: replaced by the risk-core task.
// Contract: shows recommendation.title (e.g. "DON'T PAY YET") and message, and one <button> per action whose
// accessible name is exactly the action label (e.g. "VERIFY OFFICIALLY"); clicking calls onAction(action.id).
import type { ActionId, Recommendation, RiskLevelId } from '../../types';

export interface RecommendationPanelProps { recommendation: Recommendation; level: RiskLevelId; onAction?: (id: ActionId) => void; className?: string }

export function RecommendationPanel({ recommendation, level, onAction, className = '' }: RecommendationPanelProps) {
  return (
    <div data-level={level} className={className}>
      <h3>{recommendation.title}</h3>
      <p>{recommendation.message}</p>
      <div>
        {recommendation.actions.map((a) => (
          <button key={a.id} type="button" onClick={() => onAction?.(a.id)}>{a.label}</button>
        ))}
      </div>
    </div>
  );
}
