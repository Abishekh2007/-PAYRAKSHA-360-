// STUB: replaced by the risk-viz task. Contract: root data-testid="contributions"; one row per contribution with points > 0
// (label and "+{points}"), and a total row showing the score.
import type { Contribution } from '../../types';

export interface ContributionsChartProps { contributions: Contribution[]; score: number; clamped?: boolean; className?: string }

export function ContributionsChart({ contributions, score, className = '' }: ContributionsChartProps) {
  return (
    <ul data-testid="contributions" className={className}>
      {contributions.filter((c) => c.points > 0).map((c) => <li key={c.key}>{c.label} +{c.points}</li>)}
      <li>Total {score}</li>
    </ul>
  );
}
