import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export interface AnimatedNumberProps {
  value: number;
  /** ms, default 900 */
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

const defaultFormat = (n: number) => String(Math.round(n));

export function AnimatedNumber({ value, duration = 900, format = defaultFormat, className = '' }: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    // Only animate if value actually changes to avoid re-triggering on unrelated renders
    if (prevValueRef.current === value) return;

    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    let reqId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + (endValue - startValue) * ease;

      setDisplayValue(current);

      if (progress < 1) {
        reqId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    reqId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqId);
  }, [value, duration, prefersReducedMotion]);

  return (
    <span aria-label={format(value)} data-value={value} className={className}>
      {format(displayValue)}
    </span>
  );
}