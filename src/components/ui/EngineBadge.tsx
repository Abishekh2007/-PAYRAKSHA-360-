// STUB: replaced by the ui-kit task. Contract: data-source={source}; text says which engine answered:
// python-api -> "Python risk engine (FastAPI)", browser -> "In-browser engine (offline)", plus " · {ms} ms" when latencyMs is given.
import type { EngineSource } from '../../types';

export interface EngineBadgeProps { source: EngineSource; latencyMs?: number | null; className?: string }

export function EngineBadge({ source, latencyMs = null, className = '' }: EngineBadgeProps) {
  return (
    <span data-source={source} className={`chip ${className}`}>
      {source === 'python-api' ? 'Python risk engine (FastAPI)' : 'In-browser engine (offline)'}
      {latencyMs != null && ` · ${Math.round(latencyMs)} ms`}
    </span>
  );
}
