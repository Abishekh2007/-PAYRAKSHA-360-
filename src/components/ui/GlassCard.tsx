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
  // light variant keeps glass-light for the printable incident report
  const base = variant === 'light' ? 'glass-light' : 'hud-panel';

  let glowClass = '';
  if (glow === 'LOW') glowClass = 'shadow-glow-low';
  else if (glow === 'CAUTION') glowClass = 'shadow-glow-caution';
  else if (glow === 'HIGH_CAUTION') glowClass = 'shadow-glow-elevated';
  else if (glow === 'HIGH') glowClass = 'shadow-glow-high';
  else if (glow === 'brand') glowClass = 'shadow-glow-brand';

  return (
    <div
      data-glow={glow ?? undefined}
      className={`${base} ${padded ? 'p-5 sm:p-6' : ''} ${glowClass} ${className}`.trim()}
      {...rest}
    />
  );
}
