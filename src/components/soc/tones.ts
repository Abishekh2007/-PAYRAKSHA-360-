// SOC colour tones (head-owned). Class strings are literal so Tailwind's scanner keeps them.
import type { RiskLevelId } from '../../types';

export type SocTone = 'cyan' | 'green' | 'amber' | 'orange' | 'red' | 'violet' | 'slate';

export interface SocToneClasses {
  text: string;
  border: string;
  bg: string;
  dot: string;
  /** Raw colour for SVG strokes and the --hud-accent corner brackets. */
  hex: string;
}

export const SOC_TONES: Record<SocTone, SocToneClasses> = {
  cyan: { text: 'text-cyan-300', border: 'border-cyan-400/40', bg: 'bg-cyan-400/10', dot: 'bg-cyan-400', hex: '#22d3ee' },
  green: { text: 'text-green-300', border: 'border-green-400/40', bg: 'bg-green-500/10', dot: 'bg-green-400', hex: '#22c55e' },
  amber: { text: 'text-amber-300', border: 'border-amber-400/40', bg: 'bg-amber-400/10', dot: 'bg-amber-400', hex: '#f59e0b' },
  orange: { text: 'text-orange-300', border: 'border-orange-400/40', bg: 'bg-orange-500/10', dot: 'bg-orange-400', hex: '#f97316' },
  red: { text: 'text-red-300', border: 'border-red-400/50', bg: 'bg-red-500/10', dot: 'bg-red-500', hex: '#ef4444' },
  violet: { text: 'text-violet-300', border: 'border-violet-400/40', bg: 'bg-violet-400/10', dot: 'bg-violet-400', hex: '#a78bfa' },
  slate: { text: 'text-slate-300', border: 'border-slate-500/40', bg: 'bg-slate-500/10', dot: 'bg-slate-400', hex: '#94a3b8' },
};

/** LOW → green, CAUTION → amber, HIGH_CAUTION → orange, HIGH → red, anything else → slate. */
export function socToneForLevel(level: RiskLevelId | string | null | undefined): SocTone {
  switch (level) {
    case 'LOW':
      return 'green';
    case 'CAUTION':
      return 'amber';
    case 'HIGH_CAUTION':
      return 'orange';
    case 'HIGH':
      return 'red';
    default:
      return 'slate';
  }
}
