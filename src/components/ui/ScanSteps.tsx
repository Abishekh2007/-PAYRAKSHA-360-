import { useReducedMotion } from 'framer-motion';

export interface ScanStepsProps { steps: string[]; activeIndex: number; className?: string }

export function ScanSteps({ steps, activeIndex, className = '' }: ScanStepsProps) {
  const reduce = useReducedMotion();

  return (
    <ol className={`font-mono text-xs bg-black/30 border border-cyan-400/15 rounded-sm p-3 flex flex-col gap-1.5 ${className}`.trim()}>
      {steps.map((s, i) => {
        let state = 'pending';
        if (activeIndex === -1) {
          state = 'pending';
        } else if (i < activeIndex) {
          state = 'done';
        } else if (i === activeIndex) {
          state = 'active';
        } else {
          state = 'pending';
        }

        return (
          <li key={s} data-state={state} className="flex items-center gap-2">
            {state === 'done' && (
              <span aria-hidden="true" className="text-emerald-400 w-7 shrink-0">[ OK ]</span>
            )}
            {state === 'active' && (
              <span aria-hidden="true" className={`text-cyan-300 w-7 shrink-0 ${!reduce ? 'animate-blink' : ''}`}>[ .. ]</span>
            )}
            {state === 'pending' && (
              <span aria-hidden="true" className="text-slate-600 w-7 shrink-0">[    ]</span>
            )}
            <span className={
              state === 'done' ? 'text-slate-300' :
              state === 'active' ? 'text-cyan-300' :
              'text-slate-500'
            }>
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
