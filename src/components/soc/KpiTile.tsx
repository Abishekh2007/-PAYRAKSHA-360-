import type { CSSProperties, ReactNode } from 'react';
import { SOC_TONES, type SocTone } from './tones';

export interface KpiTileProps {
  label: ReactNode;
  value: ReactNode;
  tone?: SocTone;
  /** Small line under the value, e.g. "LAST 10 MIN · SIMULATED". */
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

/** Big glowing number with a mono label: the KPI strip of the command center. */
export function KpiTile({ label, value, tone = 'cyan', hint, icon, className = '', 'data-testid': testId }: KpiTileProps) {
  const t = SOC_TONES[tone];
  return (
    <div data-testid={testId} className={`hud-panel relative px-4 py-3 ${className}`} style={{ '--hud-accent': t.hex } as CSSProperties}>
      {icon && (
        <span aria-hidden="true" className={`absolute right-3 top-3 ${t.text}`}>
          {icon}
        </span>
      )}
      {/* The value is the label's next element sibling (page tests read it that way). */}
      <p className={`hud-label ${icon ? 'pr-6' : ''}`}>{label}</p>
      <p className={`hud-num hud-glow mt-2 text-3xl font-semibold ${t.text}`}>{value}</p>
      {hint && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{hint}</p>}
    </div>
  );
}
