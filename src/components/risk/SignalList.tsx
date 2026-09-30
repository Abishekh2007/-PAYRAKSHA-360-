import type { TextSignal } from '../../types';
import { severityTheme } from '../../lib/risk';

export interface SignalListProps { signals: TextSignal[]; className?: string }

function severityMarker(severity: string): string {
  switch (severity) {
    case 'high': return '[!]';
    case 'medium': return '[~]';
    case 'low': return '[✓]';
    default: return '[ ]';
  }
}

function markerColor(severity: string): string {
  switch (severity) {
    case 'high': return 'text-red-400';
    case 'medium': return 'text-amber-400';
    case 'low': return 'text-green-400';
    default: return 'text-slate-500';
  }
}

export function SignalList({ signals, className = '' }: SignalListProps) {
  if (!signals || signals.length === 0) {
    return <p className={`font-mono text-xs text-slate-400 ${className}`}>No suspicious language detected.</p>;
  }

  return (
    <ul className={`space-y-2 font-mono text-xs ${className}`}>
      {signals.map((s) => {
        const theme = severityTheme(s.severity);
        return (
          <li key={s.id} data-severity={s.severity} className="flex flex-col sm:flex-row sm:items-start gap-1">
            <div className="flex items-center gap-2 shrink-0">
              <span className={`${markerColor(s.severity)} font-bold`}>{severityMarker(s.severity)}</span>
              <span className={`uppercase tracking-wider ${theme.text}`}>{theme.label}</span>
            </div>
            <div className="flex-1 sm:pl-2">
              <span className="text-slate-200">{s.label}:</span>{' '}
              <div className="flex flex-wrap gap-1 mt-0.5">
                {s.cues.map((cue, idx) => (
                  <span key={idx} className="px-1 py-0.5 bg-slate-800/80 text-slate-300 border border-slate-700/50 rounded-sm">
                    &ldquo;{cue}&rdquo;
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
