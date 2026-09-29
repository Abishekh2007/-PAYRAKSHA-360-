import type { EngineSource } from '../../types';

export interface EngineBadgeProps { source: EngineSource; latencyMs?: number | null; className?: string }

export function EngineBadge({ source, latencyMs = null, className = '' }: EngineBadgeProps) {
  const text = source === 'python-api' ? 'Python risk engine (FastAPI)' : 'In-browser engine (offline)';
  const toneClass = source === 'python-api' ? 'bg-risk-low/20 text-risk-low border-risk-low/30' : 'bg-risk-caution/20 text-risk-caution border-risk-caution/30';
  const dotClass = source === 'python-api' ? 'bg-risk-low' : 'bg-risk-caution';

  return (
    <span data-source={source} className={`chip border ${toneClass} ${className}`.trim()}>
      <span className={`w-2 h-2 rounded-full ${dotClass} shadow-[0_0_8px_currentColor]`} />
      {text}
      {latencyMs != null && ` · ${Math.round(latencyMs)} ms`}
    </span>
  );
}