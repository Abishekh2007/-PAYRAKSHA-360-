import { useReducedMotion, motion } from 'framer-motion';
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

/** Number of tick marks around the 270-degree arc track. */
const TICK_COUNT = 20;

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export function RiskGauge({ score, level, size = 200, animate = true, showLabel = true, className = '' }: RiskGaugeProps) {
  const prefersReducedMotion = useReducedMotion();
  const theme = levelTheme(level);

  // Arc spans 270° starting from 135° (bottom-left) to 405° (bottom-right)
  const START_ANGLE = 135;
  const TOTAL_ARC = 270;
  const sw = Math.max(6, size * 0.06); // stroke width
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - sw * 2) / 2;

  const trackPath = describeArc(cx, cy, r, START_ANGLE, START_ANGLE + TOTAL_ARC);
  const valueFraction = Math.max(0, Math.min(1, score / 100));
  const valueEndAngle = START_ANGLE + TOTAL_ARC * valueFraction;
  const valuePath = describeArc(cx, cy, r, START_ANGLE, valueEndAngle);

  // Circumference-based dash for animation
  const fullLen = (TOTAL_ARC / 360) * 2 * Math.PI * r;
  const activeLen = fullLen * valueFraction;

  // Tick marks
  const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i <= TICK_COUNT; i++) {
    const angle = START_ANGLE + (TOTAL_ARC * i) / TICK_COUNT;
    const rad = (angle * Math.PI) / 180;
    const rOuter = r + sw / 2 + 2;
    const rInner = r + sw / 2 + 6;
    ticks.push({
      x1: cx + rOuter * Math.cos(rad),
      y1: cy + rOuter * Math.sin(rad),
      x2: cx + rInner * Math.cos(rad),
      y2: cy + rInner * Math.sin(rad),
    });
  }

  const shouldAnimate = animate && !prefersReducedMotion;

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
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="rgba(34,211,238,0.25)"
            strokeWidth={1}
          />
        ))}
        {/* Track arc */}
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        {/* Value arc */}
        {shouldAnimate ? (
          <motion.path
            d={valuePath}
            fill="none"
            stroke={theme.hex}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${activeLen} ${fullLen}`}
            initial={{ strokeDasharray: `0 ${fullLen}` }}
            animate={{ strokeDasharray: `${activeLen} ${fullLen}` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        ) : (
          <path
            d={valuePath}
            fill="none"
            stroke={theme.hex}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        )}
      </svg>
      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`hud-num hud-glow text-4xl font-bold tracking-tighter flex items-end ${theme.text}`}>
          <AnimatedNumber value={score} duration={shouldAnimate ? 900 : 0} />
          <span className="text-lg text-slate-500 font-mono ml-1 pb-1"> / 100</span>
        </div>
        {showLabel && (
          <span className={`hud-eyebrow mt-1 ${theme.text}`}>
            {theme.short}
          </span>
        )}
      </div>
    </div>
  );
}
