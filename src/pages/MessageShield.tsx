import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { Button, ErrorNotice } from '../components/ui';
import { RiskResultView } from '../components/risk';
import { HudPanel, ShieldStatus, shieldStateFor } from '../components/soc';
import { analyzeRisk } from '../services/api';
import { getScenario } from '../engine';
import { useDemoStore } from '../store/demoStore';
import type { AnalyzeResponse, DetectedPattern } from '../types';

function HighlightedMessage({ text, cues }: { text: string; cues: { word: string; severity: string }[] }) {
  if (!text || cues.length === 0) return <div>{text}</div>;

  let highlighted = [{ text, severity: '' }];

  cues.forEach((cue) => {
    const cueRegex = new RegExp(`(${cue.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
    const newHighlighted: { text: string; severity: string }[] = [];
    highlighted.forEach((segment) => {
      if (segment.severity !== '') {
        newHighlighted.push(segment);
      } else {
        const parts = segment.text.split(cueRegex);
        parts.forEach((part) => {
          if (part.toLowerCase() === cue.word.toLowerCase()) {
            newHighlighted.push({ text: part, severity: cue.severity });
          } else if (part !== '') {
            newHighlighted.push({ text: part, severity: '' });
          }
        });
      }
    });
    highlighted = newHighlighted;
  });

  return (
    <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300 p-3 bg-black/40 border border-cyan-400/20 rounded-[3px]">
      {highlighted.map((segment, i) =>
        segment.severity ? (
          <span
            key={i}
            className={`font-semibold px-1 rounded-[2px] ${
              segment.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {segment.text}
          </span>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </div>
  );
}

const SEVERITY_DOT: Record<string, string> = {
  high: '🔴',
  medium: '🟠',
  low: '🟢',
};

export default function MessageShield() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const recordAnalysis = useDemoStore((state) => state.recordAnalysis);

  const handleAnalyze = async (text: string) => {
    if (!text.trim()) {
      setError('Enter a message for analysis.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setResult(null);

    try {
      const input = { message: text };
      const response = await analyzeRisk(input);
      setResult(response);
      recordAnalysis({
        label: 'Message analysis',
        input,
        report: response.report,
        source: response.source,
        ml: response.ml,
        latencyMs: response.latencyMs,
      });
    } catch {
      setError('Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sampleIds = ['kyc_scam', 'utility_scam', 'job_scam', 'customer_care_scam'];

  const cuesList =
    result?.report.analyses.text.signals.flatMap((s) =>
      s.cues.map((cue) => ({ word: cue, severity: s.severity }))
    ) || [];

  const activeSignals =
    result?.report.analyses.text.signals.filter((s) => s.severity !== 'none') || [];

  const primaryPattern =
    result?.report.patterns?.find((p: DetectedPattern) => p.kind === 'primary')?.name ??
    result?.report.patternName;

  const hasPattern =
    Boolean(primaryPattern) &&
    primaryPattern?.toUpperCase() !== 'NO SIGNIFICANT SCAM PATTERN';

  return (
    <PageShell
      eyebrow="SHIELDS"
      title="MESSAGE SHIELD"
      subtitle="Suspicious payload analysis"
      width="wide"
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <HudPanel title="MESSAGE INTAKE">
            <div className="mb-4">
              <label htmlFor="message-input" className="sr-only">
                Message to analyze
              </label>
              <textarea
                id="message-input"
                aria-label="Message to analyze"
                placeholder="Paste suspicious message here..."
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-40 p-3 bg-black/40 text-slate-100 border border-cyan-400/20 rounded-[3px] focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 placeholder:text-slate-600 font-mono text-sm caret-cyan-300 resize-none"
              />
              <div className="text-right text-xs text-slate-500 font-mono mt-1">
                {message.length} / 2000
              </div>
            </div>

            {error && <ErrorNotice message={error} className="mb-4" />}

            <Button
              onClick={() => handleAnalyze(message)}
              loading={isAnalyzing}
              fullWidth
            >
              ANALYZE MESSAGE
            </Button>
          </HudPanel>

          <HudPanel title="SAMPLE MESSAGES">
            <p className="text-xs text-slate-400 mb-3 font-mono uppercase">Load standard vector:</p>
            <div className="flex flex-wrap gap-2">
              {sampleIds.map((id) => {
                const scenario = getScenario(id);
                return (
                  <Button
                    key={id}
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs uppercase"
                    onClick={() => {
                      setMessage(scenario.message);
                      handleAnalyze(scenario.message);
                    }}
                  >
                    {scenario.shortLabel}
                  </Button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-cyan-400/15">
              <Link
                to="/qr?demo=QR002"
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 uppercase tracking-wide group w-fit"
              >
                See a safe payment (QR002)
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </HudPanel>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-4">
          <ShieldStatus
            state={shieldStateFor(result?.report.level ?? null, isAnalyzing)}
            shield="MESSAGE SHIELD"
            score={result?.report.score ?? null}
            detail={result ? (hasPattern ? `Pattern match: ${primaryPattern}` : `Category: ${result.report.analyses.text.categoryLabel}`) : (isAnalyzing ? 'Running linguistic analysis...' : 'Awaiting text input')}
          />

          {result && (
            <div className="flex flex-col gap-4">
              <HudPanel title="DECODED PAYLOAD">
                <HighlightedMessage text={result.report.input.message || ''} cues={cuesList} />
              </HudPanel>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HudPanel title="SCAM DNA">
                  <ul aria-label="Scam DNA" className="space-y-2 text-xs font-mono">
                    {activeSignals.length === 0 ? (
                      <li className="text-cyan-600/80 uppercase">
                        [ NO SCAM SIGNALS DETECTED ]
                      </li>
                    ) : (
                      activeSignals.map((signal) => (
                        <li key={signal.id} className="text-slate-300 block">
                          <span className="flex items-center gap-2">
                             <span>{SEVERITY_DOT[signal.severity] || '🟡'} {signal.label}</span>
                          </span>
                          {signal.cues.length > 0 && (
                            <span className="block mt-1 text-[10px] text-slate-500 ml-6 break-words">
                              MATCHES: {signal.cues.join(', ')}
                            </span>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </HudPanel>

                <HudPanel title="PATTERN DETECT" className="h-full">
                  <div className="text-sm font-semibold mb-2 text-slate-300 hud-label">Detected pattern:</div>
                  {hasPattern ? (
                    <div className="font-mono text-sm uppercase font-bold text-red-400">
                      {primaryPattern}
                    </div>
                  ) : (
                    <div className="font-mono text-sm uppercase text-slate-400">
                      NO SIGNIFICANT SCAM PATTERN
                    </div>
                  )}

                  {result.report.explanation?.summary && (
                    <p className="mt-4 text-xs text-slate-400 leading-relaxed font-sans">
                      <span className="font-semibold text-slate-300">In simple words: </span>
                      {result.report.explanation.summary}
                    </p>
                  )}
                </HudPanel>
              </div>

              <RiskResultView
                report={result.report}
                source={result.source}
                latencyMs={result.latencyMs}
                ml={result.ml}
                showPayment={false}
              />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}