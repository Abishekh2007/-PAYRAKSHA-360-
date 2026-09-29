import { useState, useMemo } from 'react';
import type { Contribution } from '../../types';

export interface ContributionsChartProps { contributions: Contribution[]; score: number; clamped?: boolean; className?: string }

export function ContributionsChart({ contributions, score, clamped, className = '' }: ContributionsChartProps) {
  const [showAll, setShowAll] = useState(false);

  const sortedContributions = useMemo(() => {
    const baseline = contributions.find(c => c.kind === 'baseline');
    const others = contributions.filter(c => c.kind !== 'baseline').sort((a, b) => b.points - a.points);
    return baseline ? [baseline, ...others] : others;
  }, [contributions]);

  const maxPoints = useMemo(() => {
    return Math.max(1, ...sortedContributions.map(c => c.points));
  }, [sortedContributions]);

  const totalPoints = sortedContributions.reduce((sum, c) => sum + (c.points || 0), 0);

  const visibleContributions = showAll ? sortedContributions : sortedContributions.filter(c => c.points > 0);
  const hiddenCount = sortedContributions.length - visibleContributions.length;

  return (
    <div data-testid="contributions" className={`space-y-4 ${className}`}>
      <ul className="space-y-2">
        {visibleContributions.map((c) => {
          const widthPct = Math.max(1, Math.min(100, (c.points / maxPoints) * 100));
          return (
            <li key={c.key} className="flex flex-col gap-1 text-sm bg-slate-900/30 p-2 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center gap-2">
                <span className="font-medium text-slate-200">{c.label}</span>
                <span className="text-risk-high font-mono font-semibold shrink-0">+{c.points}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-400 shrink-0 w-20">
                  {c.kind === 'baseline' ? 'Base' : `${c.weight} × ${Number(c.value.toFixed(2))}`}
                </span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.points > 0 ? 'bg-risk-high/80' : 'bg-slate-500/50'}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm text-brand-300 hover:text-brand-200 font-medium px-2 py-1"
        >
          Show all factors (+{hiddenCount} items)
        </button>
      )}

      {showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className="text-sm text-brand-300 hover:text-brand-200 font-medium px-2 py-1"
        >
          Hide zero-point factors
        </button>
      )}

      <div className="pt-3 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <div className="font-semibold text-slate-200">Total: {totalPoints}</div>
        {clamped && <div className="text-sm text-slate-400 italic">(score clamped to 0-100)</div>}
      </div>
    </div>
  );
}
