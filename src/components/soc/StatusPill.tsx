import type { ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { SOC_TONES, type SocTone } from './tones';

export interface LiveDotProps {
  tone?: SocTone;
  /** Ping animation (off under reduced motion). Default true. */
  pulse?: boolean;
  className?: string;
}

/** Small status dot with an optional ping. Decorative. */
export function LiveDot({ tone = 'cyan', pulse = true, className = '' }: LiveDotProps) {
  const reduce = useReducedMotion();
  const t = SOC_TONES[tone];
  return (
    <span aria-hidden="true" className={`relative inline-flex h-1.5 w-1.5 shrink-0 ${className}`}>
      {pulse && !reduce && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${t.dot}`} />}
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${t.dot}`} />
    </span>
  );
}

export interface StatusPillProps {
  tone?: SocTone;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Soft rounded-full status pill with a dot, e.g. "● LIVE", "● ENGINE ONLINE". */
export function StatusPill({ tone = 'cyan', pulse = false, children, className = '', title }: StatusPillProps) {
  const t = SOC_TONES[tone];
  return (
    <span
      title={title}
      className={`chip inline-flex items-center gap-1.5 whitespace-nowrap border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${t.text} ${t.border} ${t.bg} ${className}`}
    >
      <LiveDot tone={tone} pulse={pulse} />
      {children}
    </span>
  );
}
