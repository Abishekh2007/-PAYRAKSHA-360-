import type { EngineSource } from '../../types';
import { LiveDot } from '../soc';

export interface EngineBadgeProps { source: EngineSource; latencyMs?: number | null; className?: string }

export function EngineBadge({ source, latencyMs = null, className = '' }: EngineBadgeProps) {
  const text = source === 'python-api' ? 'Python risk engine (FastAPI)' : 'In-browser engine (offline)';
  // python-api = cyan, browser = green, anything else = amber
  const tone = source === 'python-api' ? 'cyan' : 'green';

  const borderClass = tone === 'cyan'
    ? 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10'
    : 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10';

  return (
    <span
      data-source={source}
      className={`chip inline-flex items-center gap-1.5 border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${borderClass} ${className}`.trim()}
    >
      <LiveDot tone={tone === 'cyan' ? 'cyan' : 'green'} pulse={false} />
      {text}
      {latencyMs != null && ` · ${Math.round(latencyMs)} ms`}
    </span>
  );
}
