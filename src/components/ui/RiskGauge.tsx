// STUB: replaced by the ui-kit task.
// Contract (tests rely on it): the root has role="meter", aria-valuenow={score} (the final score immediately,
// even while the visible number animates), aria-valuemin=0, aria-valuemax=100, aria-label="Risk score {score} out of 100".
import type { RiskLevelId } from '../../types';
import { levelTheme } from '../../lib/risk';

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

export function RiskGauge({ score, level, size = 200, showLabel = true, className = '' }: RiskGaugeProps) {
  return (
    <div role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Risk score ${score} out of 100`} data-level={level} style={{ width: size }} className={className}>
      <span>{score} / 100</span>
      {showLabel && <span> {levelTheme(level).short}</span>}
    </div>
  );
}
