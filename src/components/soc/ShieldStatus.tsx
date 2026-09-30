import type { CSSProperties, ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { RiskLevelId } from '../../types';
import { SOC_TONES, type SocTone } from './tones';

export type ShieldState = 'idle' | 'scanning' | 'clear' | 'caution' | 'hold';

export const SHIELD_STATE_LABEL: Record<ShieldState, string> = {
  idle: 'ARMED · AWAITING INPUT',
  scanning: 'SCANNING…',
  clear: 'LOW RISK · NO STRONG WARNING SIGNALS',
  caution: 'CAUTION · CHECK BEFORE YOU PAY',
  hold: 'HOLD · MULTIPLE WARNING SIGNALS',
};

const STATE_TONE: Record<ShieldState, SocTone> = { idle: 'cyan', scanning: 'cyan', clear: 'green', caution: 'amber', hold: 'red' };

/** busy → scanning; LOW → clear; CAUTION → caution; HIGH_CAUTION / HIGH → hold; nothing yet → idle. */
export function shieldStateFor(level: RiskLevelId | null | undefined, busy = false): ShieldState {
  if (busy) return 'scanning';
  switch (level) {
    case 'LOW':
      return 'clear';
    case 'CAUTION':
      return 'caution';
    case 'HIGH_CAUTION':
    case 'HIGH':
      return 'hold';
    default:
      return 'idle';
  }
}

export interface ShieldStatusProps {
  state: ShieldState;
  /** Shield name shown in the eyebrow, e.g. "QR SHIELD". */
  shield: string;
  score?: number | null;
  detail?: ReactNode;
  className?: string;
}

/** Status strip every shield page shows above its input: armed, scanning, clear, caution or hold. */
export function ShieldStatus({ state, shield, score = null, detail, className = '' }: ShieldStatusProps) {
  const reduce = useReducedMotion();
  const t = SOC_TONES[STATE_TONE[state]];
  const Icon = state === 'clear' ? ShieldCheck : state === 'caution' || state === 'hold' ? ShieldAlert : Shield;
  return (
    <div
      role="status"
      data-testid="shield-status"
      data-state={state}
      className={`hud-panel overflow-hidden px-4 py-3 ${className}`}
      style={{ '--hud-accent': t.hex } as CSSProperties}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full border ${t.border} ${t.bg}`}>
          {state === 'scanning' && !reduce && (
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-300" />
          )}
          <Icon className={`h-5 w-5 ${t.text}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="hud-eyebrow">{shield} · SIMULATION</p>
          <p className={`mt-0.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] ${t.text}`}>{SHIELD_STATE_LABEL[state]}</p>
          {detail && <p className="mt-0.5 text-xs text-slate-400">{detail}</p>}
        </div>
        {score != null && (
          <span className={`hud-num hud-glow text-2xl font-semibold ${t.text}`}>
            {score}
            <span className="text-xs text-slate-500">/100</span>
          </span>
        )}
      </div>
    </div>
  );
}
