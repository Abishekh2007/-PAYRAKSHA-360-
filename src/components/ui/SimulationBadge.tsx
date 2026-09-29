import { FlaskConical } from 'lucide-react';
import { TONE_CLASSES } from '../../lib/risk';

export interface SimulationBadgeProps { compact?: boolean; className?: string }

export function SimulationBadge({ compact = false, className = '' }: SimulationBadgeProps) {
  return (
    <span data-testid="simulation-badge" data-compact={compact} className={`chip flex items-center gap-1 ${TONE_CLASSES.demo} ${className}`.trim()}>
      <FlaskConical className="w-3 h-3" />
      SIMULATION / DEMO
    </span>
  );
}