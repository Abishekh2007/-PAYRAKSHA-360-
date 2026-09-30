import { useReducedMotion } from 'framer-motion';

export interface TickerProps {
  items: string[];
  label?: string;
  className?: string;
}

/** Scrolling alert ticker (role="marquee"). Pauses on hover; static under reduced motion. */
export function Ticker({ items, label = 'Simulated alert ticker', className = '' }: TickerProps) {
  const reduce = useReducedMotion();
  if (items.length === 0) return null;
  const row = (copy: boolean) => (
    <ul aria-hidden={copy || undefined} className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((item, i) => (
        <li key={i} className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <span aria-hidden="true" className="mr-2 text-cyan-400">
            ▸
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <div role="marquee" aria-label={label} className={`group relative overflow-hidden ${className}`}>
      <div className={`flex w-max ${reduce ? '' : 'animate-ticker group-hover:[animation-play-state:paused]'}`}>
        {row(false)}
        {!reduce && row(true)}
      </div>
    </div>
  );
}
