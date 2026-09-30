import type { MlInsight } from '../../types';
import { HudPanel, StatusPill } from '../soc';

export interface MlInsightCardProps { ml: MlInsight | null | undefined; className?: string }

export function MlInsightCard({ ml, className = '' }: MlInsightCardProps) {
  if (!ml || !ml.available) return null;

  const scamPct = Math.round(ml.scamProbability * 100);

  return (
    <HudPanel
      as="div"
      data-testid="ml-insight"
      tone="violet"
      eyebrow="ML INSIGHT · SIMULATED MODEL"
      title="ML Second Opinion"
      right={<StatusPill tone="violet">AI</StatusPill>}
      className={className}
      bodyClassName="p-4"
    >
      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <span className="hud-label text-violet-400">{ml.model}</span>
          <span className="hud-num text-lg font-bold text-slate-100">
            {scamPct}% scam-like
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-2 rounded-sm overflow-hidden">
          <div
            className={`h-full rounded-sm ${ml.label === 'scam-like' ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${scamPct}%` }}
          />
        </div>
        <div className="mt-2 text-right hud-label text-violet-300">
          {ml.label}
        </div>
      </div>

      {ml.topTerms.length > 0 && (
        <div className="mb-4">
          <div className="hud-eyebrow mb-2">Top terms:</div>
          <div className="flex flex-wrap gap-1.5">
            {ml.topTerms.map((t, i) => (
              <span
                key={i}
                className="font-mono text-[10px] px-1.5 py-0.5 border border-violet-400/20 bg-violet-400/5 text-violet-300 rounded-sm"
              >
                {t.term}
              </span>
            ))}
          </div>
        </div>
      )}

      {ml.note && (
        <p className="text-sm text-slate-300 mb-4">{ml.note}</p>
      )}

      <div className="hud-eyebrow text-center border-t border-cyan-400/10 pt-2 mt-2">
        It never changes the explainable risk score.
      </div>
    </HudPanel>
  );
}
