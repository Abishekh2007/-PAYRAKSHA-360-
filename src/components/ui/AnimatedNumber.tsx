// STUB: replaced by the ui-kit task. Contract: the element has aria-label={format(value)} and data-value={value}
// from the first render; only the visible text counts up.
export interface AnimatedNumberProps { value: number; /** ms, default 900 */ duration?: number; format?: (n: number) => string; className?: string }

const defaultFormat = (n: number) => String(Math.round(n));

export function AnimatedNumber({ value, format = defaultFormat, className = '' }: AnimatedNumberProps) {
  return <span aria-label={format(value)} data-value={value} className={className}>{format(value)}</span>;
}
