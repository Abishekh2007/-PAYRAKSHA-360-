import type { ReactNode } from 'react';
import type { Tone } from '../../lib/risk';
import { TONE_CLASSES } from '../../lib/risk';
import { GlassCard } from './GlassCard';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
}

export function StatCard({ label, value, hint, icon, tone = 'neutral', className = '' }: StatCardProps) {
  // TONE_CLASSES format: 'border-... bg-... text-...' — text class is at index 2
  const toneTextClass = TONE_CLASSES[tone] ? TONE_CLASSES[tone].split(' ')[2] : 'text-cyan-300';

  return (
    <GlassCard data-tone={tone} className={`hud-panel relative px-4 py-3 flex flex-col gap-0 ${className}`}>
      {icon && (
        <span aria-hidden="true" className={`absolute right-3 top-3 ${toneTextClass}`}>
          {icon}
        </span>
      )}
      <p className="hud-label">{label}</p>
      <p className={`hud-num hud-glow mt-2 text-3xl font-semibold ${toneTextClass}`}>{value}</p>
      {hint && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{hint}</p>
      )}
    </GlassCard>
  );
}
