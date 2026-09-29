import type { MlInsight } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

export interface MlInsightCardProps { ml: MlInsight | null | undefined; className?: string }

export function MlInsightCard({ ml, className = '' }: MlInsightCardProps) {
  if (!ml || !ml.available) return null;

  return (
    <GlassCard data-testid="ml-insight" className={className}>
      <h3 className="text-sm font-semibold mb-4 text-slate-300 uppercase tracking-wider">
        ML second opinion
      </h3>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-1">
          <span className="text-xs text-slate-400 font-mono">{ml.model}</span>
          <span className="font-bold text-lg text-slate-200">
            {Math.round(ml.scamProbability * 100)}% scam-like
          </span>
        </div>
        <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${ml.label === 'scam-like' ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${Math.round(ml.scamProbability * 100)}%` }}
          />
        </div>
        <div className="mt-2 text-right text-xs font-semibold uppercase text-slate-300">
          {ml.label}
        </div>
      </div>

      {ml.topTerms.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-2">Top terms:</div>
          <div className="flex flex-wrap gap-2">
            {ml.topTerms.map((t, i) => (
              <Badge key={i} tone="neutral" className="text-xs">
                {t.term}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {ml.note && (
        <p className="text-sm text-slate-300 mb-4">{ml.note}</p>
      )}

      <div className="text-xs text-slate-500 mt-2 border-t border-white/10 pt-2 text-center font-semibold">
        It never changes the explainable risk score.
      </div>
    </GlassCard>
  );
}
