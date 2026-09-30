import React, { useRef, useState, useEffect } from 'react';

export const HOLD_MS = 3000;

interface HoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onComplete: () => void;
  label: string;
}

export const HoldButton: React.FC<HoldButtonProps> = ({ onComplete, label, className = '', ...props }) => {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (time: number) => {
      if (!startTime.current) {
        startTime.current = time;
      }
      const elapsed = time - startTime.current;
      const newProgress = Math.min(elapsed / HOLD_MS, 1);
      setProgress(newProgress);

      if (newProgress < 1 && holding) {
        frameRef.current = requestAnimationFrame(animate);
      } else if (newProgress >= 1 && holding) {
        setHolding(false);
        onComplete();
      }
    };

    if (holding) {
      startTime.current = performance.now() - (progress * HOLD_MS);
      frameRef.current = requestAnimationFrame(animate);
    } else {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      setProgress(0);
      startTime.current = null;
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [holding, onComplete, progress]);

  const start = () => setHolding(true);
  const stop = () => setHolding(false);

  return (
    <button
      type="button"
      className={`relative overflow-hidden ${className}`}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          stop();
        }
      }}
      {...props}
    >
      <div
        className="absolute inset-y-0 left-0 bg-black/10 transition-none pointer-events-none"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative z-10 pointer-events-none">{label}</span>
    </button>
  );
};
