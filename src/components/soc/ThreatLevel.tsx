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
  /** Compact mode: hide eyebrow and LIVE pill below sm breakpoint to save horizontal space. */
  compact?: boolean;
  className?: string;
}

/** Console threat-level readout: "THREAT LEVEL  HIGH RISK  92/100  ● LIVE". */
export function ThreatLevel({ level, score = null, live = true, compact = false, className = '' }: ThreatLevelProps) {
  const tone = socToneForLevel(level);
  const t = SOC_TONES[tone];
  const label = level ? levelTheme(level).short : 'MONITORING';
  return (
    <div
      role="status"
      data-testid="threat-level"
      data-level={level ?? 'NONE'}
      className={`inline-flex items-center gap-2 rounded-sm border ${compact ? 'px-2 sm:px-3' : 'px-3'} py-1.5 ${t.border} ${t.bg} ${className}`}
    >
      <span className={`font-mono text-[10px] uppercase tracking-[0.28em] text-slate-400 ${compact ? 'hidden sm:inline' : ''}`}>THREAT LEVEL</span>
      <span className={`font-mono text-xs font-bold uppercase tracking-[0.2em] ${t.text}`}>{label}</span>
      {score != null && <span className={`hud-num text-xs ${t.text}`}>{score}/100</span>}
      {live && (
        <StatusPill tone={tone === 'slate' ? 'cyan' : tone} pulse className={compact ? 'hidden sm:inline-flex' : undefined}>
          LIVE
        </StatusPill>
      )}
    </div>
  );
}
