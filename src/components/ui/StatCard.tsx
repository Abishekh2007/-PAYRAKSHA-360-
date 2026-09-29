// STUB: replaced by the ui-kit task. Keep the export name and props.
import type { ReactNode } from 'react';
import type { Tone } from '../../lib/risk';

export interface StatCardProps { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone; className?: string }

export function StatCard({ label, value, hint, icon, tone = 'neutral', className = '' }: StatCardProps) {
  return (
    <div data-tone={tone} className={`glass p-4 ${className}`}>
      {icon}
      <p>{label}</p>
      <p>{value}</p>
      {hint && <p>{hint}</p>}
    </div>
  );
}
