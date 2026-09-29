// STUB: replaced by the ui-kit task. Keep the export name and props.
import type { ReactNode } from 'react';
import { TONE_CLASSES, type Tone } from '../../lib/risk';

export interface BadgeProps { tone?: Tone; icon?: ReactNode; className?: string; children: ReactNode }

export function Badge({ tone = 'neutral', icon, className = '', children }: BadgeProps) {
  return <span className={`chip ${TONE_CLASSES[tone]} ${className}`}>{icon}{children}</span>;
}
