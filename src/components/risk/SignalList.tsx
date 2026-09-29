import type { TextSignal } from '../../types';
import { severityTheme } from '../../lib/risk';

export interface SignalListProps { signals: TextSignal[]; className?: string }

export function SignalList({ signals, className = '' }: SignalListProps) {
  if (!signals || signals.length === 0) {
    return <p className={className}>No suspicious language detected.</p>;
  }

  return (
    <ul className={`space-y-3 ${className}`}>
      {signals.map((s) => {
        const theme = severityTheme(s.severity);
        return (
          <li key={s.id} data-severity={s.severity} className="flex flex-col sm:flex-row sm:items-start gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${theme.bg} ${theme.text} ${theme.border} shrink-0 mt-0.5`}>
              {theme.label}
            </span>
            <div className="flex-1">
              <span className="font-medium text-slate-200">{s.label}:</span>{' '}
              <div className="flex flex-wrap gap-1.5 mt-1 sm:mt-0 sm:inline-flex">
                {s.cues.map((cue, idx) => (
                  <span key={idx} className="font-mono text-xs px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                    "{cue}"
                  </span>
                ))}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
