import { levelTheme } from '../../lib/risk';
import type { RiskLevelId } from '../../types';
import { StatusPill } from './StatusPill';
import { SOC_TONES, socToneForLevel } from './tones';

export interface ThreatLevelProps {
  /** null = nothing analysed yet ("MONITORING"). */
  level: RiskLevelId | null;
  score?: number | null;
  /** Show the pulsing LIVE pill. Default true. */
  live?: boolean;
  className?: string;
}

/** Console threat-level readout: "THREAT LEVEL  HIGH RISK  92/100  ● LIVE". */
export function ThreatLevel({ level, score = null, live = true, className = '' }: ThreatLevelProps) {
  const tone = socToneForLevel(level);
  const t = SOC_TONES[tone];
  const label = level ? levelTheme(level).short : 'MONITORING';
  return (
    <div
      role="status"
      data-testid="threat-level"
      data-level={level ?? 'NONE'}
      className={`inline-flex items-center gap-3 rounded-sm border px-3 py-1.5 ${t.border} ${t.bg} ${className}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-400">THREAT LEVEL</span>
      <span className={`font-mono text-xs font-bold uppercase tracking-[0.2em] ${t.text}`}>{label}</span>
      {score != null && <span className={`hud-num text-xs ${t.text}`}>{score}/100</span>}
      {live && (
        <StatusPill tone={tone === 'slate' ? 'cyan' : tone} pulse>
          LIVE
        </StatusPill>
      )}
    </div>
  );
}
