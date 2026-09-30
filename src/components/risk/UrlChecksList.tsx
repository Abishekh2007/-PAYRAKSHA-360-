import type { UrlAnalysis } from '../../types';

export interface UrlChecksListProps { analysis: UrlAnalysis; className?: string }

function repMarker(reputation: string | undefined | null): { marker: string; color: string } {
  switch (reputation) {
    case 'trusted': return { marker: '[✓]', color: 'text-green-400' };
    case 'reported': return { marker: '[!]', color: 'text-red-400' };
    case 'new': return { marker: '[~]', color: 'text-amber-400' };
    default: return { marker: '[ ]', color: 'text-slate-400' };
  }
}

export function UrlChecksList({ analysis, className = '' }: UrlChecksListProps) {
  if (!analysis.valid && analysis.error) {
    return (
      <div role="alert" className={`p-3 bg-red-900/20 border border-red-500/20 text-red-300 rounded-sm font-mono text-xs ${className}`}>
        {analysis.error}
      </div>
    );
  }

  const { marker, color } = repMarker(analysis.reputation);

  return (
    <div className={`space-y-3 font-mono text-xs ${className}`}>
      {/* URL display */}
      <div className="p-3 bg-slate-900/60 border border-cyan-400/10 rounded-sm break-all">
        <span className="text-slate-200">{analysis.normalized}</span>
        <div className="mt-1 text-slate-500">Host: {analysis.host}</div>
      </div>

      <p className="text-violet-400/80 italic">Simulated intelligence: this link was never opened.</p>

      {(analysis.reputation || analysis.reputationNote) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`${color} font-bold`}>{marker}</span>
          <span className={`uppercase tracking-wider ${color}`}>{analysis.reputation}</span>
          <span className="text-slate-300">{analysis.reputationNote}</span>
        </div>
      )}

      {analysis.checks && analysis.checks.length > 0 && (
        <ul className="space-y-2 mt-2">
          {analysis.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 p-2 bg-slate-800/30 border border-slate-700/30 rounded-sm">
              <span className="text-amber-400 shrink-0">[~]</span>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-200">{c.label}</span>
                  <span className="text-cyan-300 font-semibold shrink-0">+{c.points}</span>
                </div>
                <p className="text-slate-400 mt-0.5">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
