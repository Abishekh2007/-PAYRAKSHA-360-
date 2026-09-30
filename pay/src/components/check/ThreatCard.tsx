import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { RiskReport } from '../../../../src/types';
import type { PayTone } from '../../lib/payView';

export const ThreatCard = ({
  score,
  levelShort,
  tone,
  headline,
  reasons,
  patternName,
  report
}: {
  score: number;
  levelShort: string;
  tone: PayTone;
  headline: string;
  reasons: string[];
  patternName: string;
  report: RiskReport;
}) => {
  const [expanded, setExpanded] = useState(false);

  const toneText: Record<PayTone, string> = {
    green: 'text-risk-low',
    amber: 'text-risk-caution',
    orange: 'text-risk-elevated',
    red: 'text-risk-high',
  };

  const tonePillBg: Record<PayTone, string> = {
    green: 'bg-risk-low-soft text-risk-low-ink',
    amber: 'bg-risk-caution-soft text-risk-caution-ink',
    orange: 'bg-risk-elevated-soft text-risk-elevated-ink',
    red: 'bg-risk-high-soft text-risk-high-ink',
  };

  const toneCardBg: Record<PayTone, string> = {
    green: 'bg-risk-low-soft/30',
    amber: 'bg-risk-caution-soft/30',
    orange: 'bg-risk-elevated-soft/30',
    red: 'bg-risk-high-soft/30',
  };

  return (
    <div className={`card p-6 mt-4 ${toneCardBg[tone]}`} data-testid="threat-card">
      <div className="flex flex-col items-center">
        <svg width="120" height="60" viewBox="0 0 120 60" className="overflow-visible">
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e9eef6" strokeWidth="12" strokeLinecap="round" />
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round"
                className={toneText[tone]}
                style={{ strokeDasharray: 157, strokeDashoffset: 157 - (score / 100) * 157 }}
          />
        </svg>
        <div className="mt-4 font-bold text-lg">RISK {score}</div>
        <div className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${tonePillBg[tone]}`}>
          {levelShort}
        </div>
      </div>

      <h3 className="section-title text-center mt-6 mb-3">{headline}</h3>
      <ul className="list-disc pl-5 mb-4 text-sm text-gp-ink-2 space-y-1">
        {reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>

      <button
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="flex items-center text-sm font-medium text-gp-ink-3 mx-auto mt-4"
      >
        See full analysis {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gp-line text-sm text-gp-ink-2 space-y-4">
          <div><strong className="text-gp-ink">Pattern detected:</strong> {patternName}</div>

          {report.attackChain && report.attackChain.length > 0 && (
            <div>
              <strong className="text-gp-ink block mb-1">Attack chain:</strong>
              {report.attackChain.map((step: any, i: number) => (
                <div key={i} className="mb-1">
                  • {step.label} {step.detail && `- ${step.detail}`}
                </div>
              ))}
            </div>
          )}

          {report.explanation?.trustSignals && report.explanation.trustSignals.length > 0 && (
            <div>
              <strong className="text-gp-ink block mb-1">Trust signals:</strong>
              {report.explanation.trustSignals.map((signal: string, i: number) => (
                <div key={i} className="mb-1">✓ {signal}</div>
              ))}
            </div>
          )}

          {report.recommendation?.actions && report.recommendation.actions.length > 0 && (
            <div>
              <strong className="text-gp-ink block mb-1">Recommendations:</strong>
              {report.recommendation.actions.map((act: any, i: number) => (
                <div key={i} className="mb-1">→ {act.label || act}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-xs text-center text-gp-ink-3 font-medium bg-white/50 rounded-lg py-2">
        SIMULATION
      </div>
    </div>
  );
};
