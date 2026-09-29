// STUB: replaced by the ui-kit task.
// Contract: an <ol>; each step is an <li data-state="done|active|pending"> containing the step text.
// Steps before activeIndex are done, the one at activeIndex is active, later ones pending.
// activeIndex -1 = nothing started; activeIndex >= steps.length = all done.
export interface ScanStepsProps { steps: string[]; activeIndex: number; className?: string }

export function ScanSteps({ steps, activeIndex, className = '' }: ScanStepsProps) {
  return (
    <ol className={className}>
      {steps.map((s, i) => (
        <li key={s} data-state={i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending'}>{s}</li>
      ))}
    </ol>
  );
}
