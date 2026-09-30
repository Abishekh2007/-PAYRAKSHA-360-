import { Check } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';

export interface ScanStepsProps { steps: string[]; activeIndex: number; className?: string }

export function ScanSteps({ steps, activeIndex, className = '' }: ScanStepsProps) {
  const reduce = useReducedMotion();

  return (
    <ol className={`font-mono text-xs hud-panel border border-white/10 rounded-xl p-3 flex flex-col gap-1.5 ${className}`.trim()}>
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
              <span aria-hidden="true" className="text-emerald-400 w-5 h-5 shrink-0 grid place-items-center">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
            {state === 'active' && (
              <span aria-hidden="true" className={`w-5 h-5 shrink-0 grid place-items-center`}>
                <span className={`inline-block h-2 w-2 rounded-full bg-cyan-400 ${!reduce ? 'animate-pulse' : ''}`} />
              </span>
            )}
            {state === 'pending' && (
              <span aria-hidden="true" className="w-5 h-5 shrink-0 grid place-items-center">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600" />
              </span>
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
