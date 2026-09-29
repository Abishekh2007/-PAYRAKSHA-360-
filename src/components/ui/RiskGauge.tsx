import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { RiskLevelId } from '../../types';
import { levelTheme } from '../../lib/risk';
import { AnimatedNumber } from './AnimatedNumber';

export interface RiskGaugeProps {
  score: number;
  level: RiskLevelId;
  /** Diameter in px. Default 200. */
  size?: number;
  /** Animate the arc and number from 0. Default true. */
  animate?: boolean;
  /** Show the level label (e.g. HIGH RISK) under the number. Default true. */
  showLabel?: boolean;
  className?: string;
}

export function RiskGauge({ score, level, size = 200, animate = true, showLabel = true, className = '' }: RiskGaugeProps) {
  const prefersReducedMotion = useReducedMotion();
  const theme = levelTheme(level);
  const strokeWidth = Math.max(8, size * 0.08);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI;

  const dashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Risk score ${score} out of 100`}
      data-level={level}
      style={{ width: size }}
      className={`relative flex flex-col items-center justify-center ${className}`.trim()}
    >
      <svg
        width={size}
        height={size / 2 + strokeWidth}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        className="overflow-visible"
      >
        <path
          d={`M ${strokeWidth / 2} ${size / 2 + strokeWidth / 2} a ${radius} ${radius} 0 0 1 ${size - strokeWidth} 0`}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${strokeWidth / 2} ${size / 2 + strokeWidth / 2} a ${radius} ${radius} 0 0 1 ${size - strokeWidth} 0`}
          fill="none"
          stroke={theme.hex}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate && !prefersReducedMotion ? { strokeDashoffset: circumference } : { strokeDashoffset: dashoffset }}
          animate={{ strokeDashoffset: dashoffset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center translate-y-[20%]">
        <div className="text-4xl font-display font-bold font-mono tracking-tighter flex items-end">
          <AnimatedNumber value={score} duration={animate && !prefersReducedMotion ? 900 : 0} />
          <span className="text-lg text-slate-500 font-sans ml-1 pb-1">/ 100</span>
        </div>
        {showLabel && (
          <span className={`text-sm font-semibold tracking-wider ${theme.text} mt-1 uppercase`}>
            {theme.short}
          </span>
        )}
      </div>
    </div>
  );
}