// STUB: replaced by the risk-viz task. Shows host (as text, never a link), reputation and each check with its points.
import type { UrlAnalysis } from '../../types';

export interface UrlChecksListProps { analysis: UrlAnalysis; className?: string }

export function UrlChecksList({ analysis, className = '' }: UrlChecksListProps) {
  return (
    <div className={className}>
      <p>{analysis.host}</p>
      <ul>{analysis.checks.map((c) => <li key={c.id}>{c.label} +{c.points}</li>)}</ul>
    </div>
  );
}
