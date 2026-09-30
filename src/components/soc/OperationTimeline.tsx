import { useReducedMotion } from 'framer-motion';
import type { RiskLevelId } from '../../types';
import { StatusPill, LiveDot } from './StatusPill';
import { SOC_TONES, socToneForLevel } from './tones';

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
 */
export function OperationTimeline({
  name,
  beats,
  revealed,
  status = 'idle',
  onReplay,
  className = '',
}: OperationTimelineProps) {
  const reduce = useReducedMotion();
  const clampedRevealed = Math.max(0, Math.min(revealed, beats.length));
  const revealedBeats = beats.slice(0, clampedRevealed);

  const statusTone =
    status === 'idle' ? 'slate' : status === 'running' ? 'red' : 'cyan';

  return (
    <div
      data-testid="operation-timeline"
      data-status={status}
      className={`hud-panel ${className}`}
    >
      {/* Header */}
      <header className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
        <h3 className="hud-title text-red-400 hud-glow mr-auto">
          OPERATION {name.toUpperCase()}
        </h3>
        <span className="inline-flex items-center chip border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          {beats.length} BEATS
        </span>
        <span data-testid="operation-status">
          <StatusPill
            tone={statusTone}
            pulse={status === 'running'}
          >
            {OPERATION_STATUS_LABEL[status]}
          </StatusPill>
        </span>
        <span className="inline-flex items-center chip border-slate-500/40 bg-slate-500/10 text-slate-400">
          SIMULATION
        </span>
      </header>

      {/* Timeline body */}
      <div className="p-4">
        <ol aria-label="Operation timeline" className="relative ml-3 space-y-0">
          {/* Vertical rail */}
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 bottom-0 w-px bg-cyan-400/20"
          />

          {revealedBeats.map((beat, i) => {
            const isLast = i === clampedRevealed - 1;
            const tone = socToneForLevel(beat.level ?? null);
            const t = SOC_TONES[tone];
            const hasScore = typeof beat.score === 'number';

            return (
              <li
                key={beat.id}
                data-testid={`beat-${String(i + 1).padStart(2, '0')}`}
                aria-current={isLast ? 'step' : undefined}
                className={`relative pl-5 pb-4 transition-colors ${isLast ? 'opacity-100' : 'opacity-70'}`}
                style={
                  reduce
                    ? undefined
                    : { animation: undefined }
                }
              >
                {/* Rail dot */}
                <span
                  aria-hidden="true"
                  className={`absolute left-[-4px] top-1 flex h-2 w-2 items-center justify-center rounded-full ${t.dot} ${isLast ? 'ring-2 ring-offset-1 ring-offset-slate-950' : ''}`}
                  style={isLast ? { boxShadow: `0 0 6px ${t.hex}` } : undefined}
                >
                  {isLast && !reduce && (
                    <LiveDot tone={tone} pulse className="absolute -inset-1" />
                  )}
                </span>

                <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                  {/* Time */}
                  <span className="hud-num text-[10px] text-slate-500 shrink-0">
                    {beat.time}
                  </span>
                  {/* Stage chip */}
                  <span
                    className={`chip text-[9px] font-bold ${t.text} ${t.border} ${t.bg}`}
                  >
                    {beat.stage}
                  </span>
                  {/* Score right-aligned */}
                  {hasScore && (
                    <span className={`ml-auto hud-num text-[10px] font-bold shrink-0 ${t.text}`}>
                      RISK {beat.score}
                    </span>
                  )}
                </div>

                {/* Title */}
                <p className={`mt-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] ${isLast ? t.text : 'text-slate-300'}`}>
                  {beat.title}
                </p>

                {/* Detail */}
                {beat.detail && (
                  <p className="mt-0.5 font-sans text-[11px] text-slate-400">
                    {beat.detail}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        {/* Replay button */}
        {status === 'complete' && onReplay && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              aria-label="Replay operation"
              onClick={onReplay}
              className="btn-outline text-xs"
            >
              Replay operation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
