// STUB: contract only. Builder task `operation` implements this file.
// The acceptance tests in test/acceptance/operation-timeline.test.tsx are written from the comments below.
import type { RiskLevelId } from '../../types';

export interface OperationBeat {
  id: string;
  /** Mission clock, e.g. 'T+00:04'. */
  time: string;
  /** Short stage tag, e.g. 'MESSAGE', 'LINK', 'QR'. */
  stage: string;
  title: string;
  detail?: string;
  score?: number | null;
  level?: RiskLevelId | null;
}

export type OperationStatus = 'idle' | 'running' | 'complete';

export const OPERATION_STATUS_LABEL: Record<OperationStatus, string> = {
  idle: 'STANDBY',
  running: 'IN PROGRESS',
  complete: 'COMPLETE',
};

export interface OperationTimelineProps {
  /** Operation code name, e.g. 'Blackout'. */
  name: string;
  beats: OperationBeat[];
  /** How many beats are revealed so far (clamped to 0..beats.length). */
  revealed: number;
  /** Default 'idle'. */
  status?: OperationStatus;
  onReplay?: () => void;
  className?: string;
}

/**
 * Attack operation as a SOC timeline, revealed beat by beat.
 * Renders:
 *   - a wrapper with data-testid="operation-timeline" and data-status={status}
 *   - a heading whose text is `OPERATION ${name.toUpperCase()}` (e.g. 'OPERATION BLACKOUT')
 *   - the text `${beats.length} BEATS`
 *   - a status chip with data-testid="operation-status" whose text is OPERATION_STATUS_LABEL[status]
 *   - <ol aria-label="Operation timeline"> containing ONLY the first clamp(revealed, 0, beats.length) beats, beat i (from 0) as
 *     <li data-testid={`beat-${String(i + 1).padStart(2, '0')}`}> (beat-01, beat-02, …) showing beat.time, beat.stage, beat.title,
 *     beat.detail when present, and `RISK ${beat.score}` when beat.score is a number; the last revealed <li> has aria-current="step"
 *   - a <button> with the accessible name 'Replay operation' only when status === 'complete' and onReplay is given; clicking calls onReplay()
 *   - the visible text 'SIMULATION'
 */
export function OperationTimeline({ name, beats, revealed, className = '' }: OperationTimelineProps) {
  return (
    <div data-testid="operation-timeline-stub" className={className}>
      Operation {name} (not built yet): {Math.min(revealed, beats.length)} / {beats.length}
    </div>
  );
}
