// STUB: replaced by the risk-viz task. Lists text signals (label, matched cues, severity).
import type { TextSignal } from '../../types';

export interface SignalListProps { signals: TextSignal[]; className?: string }

export function SignalList({ signals, className = '' }: SignalListProps) {
  return <ul className={className}>{signals.map((s) => <li key={s.id} data-severity={s.severity}>{s.label}: {s.cues.join(', ')}</li>)}</ul>;
}
