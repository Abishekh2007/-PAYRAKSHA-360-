import { Loader2, CheckCircle2 } from 'lucide-react';

export interface ScanStepsProps { steps: string[]; activeIndex: number; className?: string }

export function ScanSteps({ steps, activeIndex, className = '' }: ScanStepsProps) {
  return (
    <ol className={`flex flex-col gap-3 ${className}`.trim()}>
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
          <li key={s} data-state={state} className="flex items-center gap-3 text-sm">
            {state === 'done' && <CheckCircle2 className="w-5 h-5 text-risk-low shrink-0" />}
            {state === 'active' && <Loader2 className="w-5 h-5 text-brand-400 animate-spin shrink-0" />}
            {state === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-700 shrink-0" />}
            <span className={`${state === 'active' ? 'text-brand-300 animate-pulse' : state === 'done' ? 'text-slate-300' : 'text-slate-500'}`}>
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}