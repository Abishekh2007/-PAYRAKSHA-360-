import type { ReactNode } from 'react';
import type { Tone } from '../../lib/risk';
import { TONE_CLASSES } from '../../lib/risk';
import { GlassCard } from './GlassCard';

export interface StatCardProps { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone; className?: string }

export function StatCard({ label, value, hint, icon, tone = 'neutral', className = '' }: StatCardProps) {
  return (
    <GlassCard data-tone={tone} className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
        {icon && <span className={TONE_CLASSES[tone] ? TONE_CLASSES[tone].split(' ')[2] : ''}>{icon}</span>}
        {label}
      </div>
      <div className="text-3xl font-display font-bold text-slate-100">
        {value}
      </div>
      {hint && <div className="text-sm text-slate-400">{hint}</div>}
    </GlassCard>
  );
}