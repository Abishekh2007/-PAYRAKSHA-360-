import type { ReactNode } from 'react';
import { TONE_CLASSES, type Tone } from '../../lib/risk';

export interface BadgeProps { tone?: Tone; icon?: ReactNode; className?: string; children: ReactNode }

export function Badge({ tone = 'neutral', icon, className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${TONE_CLASSES[tone]} ${className}`.trim()}
    >
      {icon}
      {children}
    </span>
  );
}
