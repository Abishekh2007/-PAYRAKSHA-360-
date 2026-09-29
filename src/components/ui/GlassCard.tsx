// STUB: replaced by the ui-kit task. Keep the export name and props.
import type { HTMLAttributes } from 'react';
import type { RiskLevelId } from '../../types';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** glass = translucent dark, strong = brighter glass, light = white card (dark text). Default glass. */
  variant?: 'glass' | 'strong' | 'light';
  /** Coloured glow for a risk level or the brand colour. Default none. */
  glow?: RiskLevelId | 'brand' | null;
  /** Default true (p-5 sm:p-6). */
  padded?: boolean;
}

export function GlassCard({ variant = 'glass', glow = null, padded = true, className = '', ...rest }: GlassCardProps) {
  const base = variant === 'strong' ? 'glass-strong' : variant === 'light' ? 'glass-light' : 'glass';
  return <div data-glow={glow ?? undefined} className={`${base} ${padded ? 'p-5' : ''} ${className}`} {...rest} />;
}
