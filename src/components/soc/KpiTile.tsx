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
    <div data-testid={testId} className={`hud-panel px-4 py-3 ${className}`} style={{ '--hud-accent': t.hex } as CSSProperties}>
      <div className="flex items-center justify-between gap-2">
        <p className="hud-label">{label}</p>
        {icon && (
          <span aria-hidden="true" className={t.text}>
            {icon}
          </span>
        )}
      </div>
      <p className={`hud-num hud-glow mt-2 text-3xl font-semibold ${t.text}`}>{value}</p>
      {hint && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{hint}</p>}
    </div>
  );
}
