import { FlaskConical } from 'lucide-react';
import { TONE_CLASSES } from '../../lib/risk';

export interface SimulationBadgeProps { compact?: boolean; className?: string }

export function SimulationBadge({ compact = false, className = '' }: SimulationBadgeProps) {
  return (
    <span
      data-testid="simulation-badge"
      data-compact={compact}
      className={`chip inline-flex items-center gap-1 border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${TONE_CLASSES.demo} ${className}`.trim()}
    >
      <FlaskConical className="w-3 h-3" />
      SIMULATION / DEMO
    </span>
  );
}
