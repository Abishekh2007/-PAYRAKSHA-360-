import type { UrlAnalysis } from '../../types';

export interface UrlChecksListProps { analysis: UrlAnalysis; className?: string }

export function UrlChecksList({ analysis, className = '' }: UrlChecksListProps) {
  if (!analysis.valid && analysis.error) {
    return (
      <div role="alert" className={`p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded ${className}`}>
        {analysis.error}
      </div>
    );
  }

  let repColor = 'bg-slate-500/10 text-slate-300 border-slate-500/30';
  if (analysis.reputation === 'trusted') repColor = 'bg-green-500/10 text-green-400 border-green-500/30';
  else if (analysis.reputation === 'reported') repColor = 'bg-red-500/10 text-red-400 border-red-500/30';
  else if (analysis.reputation === 'new') repColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="p-3 bg-slate-900/50 border border-slate-800 rounded font-mono text-sm break-all">
        <span className="text-slate-200">{analysis.normalized}</span>
        <div className="mt-1 text-slate-400 text-xs">Host: {analysis.host}</div>
      </div>

      <p className="text-xs text-brand-300/80 italic">Simulated intelligence: this link was never opened.</p>

      {(analysis.reputation || analysis.reputationNote) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 text-xs font-semibold uppercase rounded border ${repColor}`}>
            {analysis.reputation}
          </span>
          <span className="text-sm text-slate-300">{analysis.reputationNote}</span>
        </div>
      )}

      {analysis.checks && analysis.checks.length > 0 && (
        <ul className="space-y-3 mt-4">
          {analysis.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-3 p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg">
              <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium text-slate-200">{c.label}</span>
                  <span className="text-risk-high font-mono text-sm font-semibold shrink-0">+{c.points}</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
