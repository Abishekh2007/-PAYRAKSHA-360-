// STUB: replaced by the ui-kit task. Contract: always renders the exact text "SIMULATION / DEMO".
import { TONE_CLASSES } from '../../lib/risk';

export interface SimulationBadgeProps { compact?: boolean; className?: string }

export function SimulationBadge({ compact = false, className = '' }: SimulationBadgeProps) {
  return <span data-testid="simulation-badge" data-compact={compact} className={`chip ${TONE_CLASSES.demo} ${className}`}>SIMULATION / DEMO</span>;
}
