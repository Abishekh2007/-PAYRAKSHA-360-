// STUB: replaced by the risk-core task.
// Contract: heading = title ?? ("WHY THIS LOOKS SAFER" for LOW, else "WHY ARE WE WARNING YOU?"); lists
// explanation.reasons, explanation.trustSignals (each prefixed "✓") and the disclaimer.
import type { RiskReport } from '../../types';

export interface ExplanationPanelProps { report: RiskReport; title?: string; className?: string }

export function ExplanationPanel({ report, title, className = '' }: ExplanationPanelProps) {
  const heading = title ?? (report.level === 'LOW' ? 'WHY THIS LOOKS SAFER' : 'WHY ARE WE WARNING YOU?');
  const ex = report.explanation;
  return (
    <div className={className}>
      <h3>{heading}</h3>
      <p>{ex.summary}</p>
      <ul>{ex.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      {ex.trustSignals.length > 0 && <ul>{ex.trustSignals.map((t) => <li key={t}>✓ {t}</li>)}</ul>}
      <p>{ex.disclaimer}</p>
    </div>
  );
}
