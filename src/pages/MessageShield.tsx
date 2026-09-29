import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { Button, ErrorNotice, GlassCard, SimulationBadge, SectionHeader } from '../components/ui';
import { RiskResultView } from '../components/risk';
import { GuardianRobot } from '../components/three';
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
        parts.forEach((part, i) => {
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
    <div className="whitespace-pre-wrap">
      {highlighted.map((segment, i) =>
        segment.severity ? (
          <mark key={i} data-severity={segment.severity}>
            {segment.text}
          </mark>
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
  low: '🟡',
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

  const mood = isAnalyzing ? 'thinking' : result ? (result.report.level === 'LOW' ? 'safe' : 'alert') : 'idle';

  return (
    <PageShell
      eyebrow="Shield"
      title="Message Shield"
      subtitle="Analyze suspicious messages"
      icon={<span aria-hidden="true">✉️</span>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <GlassCard>
            <SectionHeader title="Input Message" />
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
                className="w-full h-32 p-3 bg-slate-900/50 text-slate-100 border border-slate-700/50 rounded focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 placeholder:text-slate-500"
              />
              <div className="text-right text-sm text-gray-400">
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

            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Try a sample:</p>
              <div className="flex flex-wrap gap-2">
                {sampleIds.map((id) => {
                  const scenario = getScenario(id);
                  return (
                    <Button
                      key={id}
                      variant="outline"
                      size="sm"
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
              <p className="mt-3 text-xs text-gray-400">
                Looking for a safe example? A verified biller payment is checked with its full context in QR Shield.
              </p>
              <div className="mt-1">
                <Link
                  to="/qr?demo=QR002"
                  className="text-xs text-brand-400 hover:text-brand-300 underline inline-flex items-center gap-1"
                >
                  See a safe payment (QR002) →
                </Link>
              </div>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              Analysed in memory for this demo. Nothing is stored or sent anywhere else.
            </p>
          </GlassCard>
        </div>

        <div>
          <div className="h-48 mb-6 relative">
            <GuardianRobot mood={mood} />
          </div>

          {result && (
            <GlassCard className="mb-6">
              <SimulationBadge />
              <h3 className="text-lg font-bold mb-2 mt-2">Analysis Result</h3>
              <p className="mb-2 text-sm text-gray-300">
                Detected Category: {result.report.analyses.text.categoryLabel}
              </p>

              <div className="p-3 bg-gray-800 rounded mb-4">
                <HighlightedMessage text={result.report.input.message || ''} cues={cuesList} />
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-1">SCAM DNA</h4>
                <ul aria-label="Scam DNA" className="space-y-1 text-sm">
                  {activeSignals.length === 0 ? (
                    <li className="text-slate-300">
                      🟢 No scam signals detected in this message.
                    </li>
                  ) : (
                    activeSignals.map((signal) => (
                      <li key={signal.id} className="text-slate-300">
                        <span>
                          {SEVERITY_DOT[signal.severity] || '🟡'} {signal.label}
                        </span>
                        {signal.cues.length > 0 && (
                          <span className="text-xs text-gray-400 ml-2">
                            {signal.cues.join(', ')}
                          </span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="mb-4">
                <div className="text-sm font-semibold mb-1 text-slate-300">
                  Detected pattern:
                </div>
                {hasPattern ? (
                  <span className="inline-block font-bold uppercase text-sm px-2.5 py-1 bg-red-950/60 text-red-200 border border-red-700/60 rounded">
                    {primaryPattern}
                  </span>
                ) : (
                  <span className="inline-block text-sm px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded">
                    No significant scam pattern
                  </span>
                )}
              </div>

              {result.report.explanation?.summary && (
                <p className="text-sm text-slate-300 mb-4">
                  <span className="font-semibold text-slate-200">In simple words: </span>
                  {result.report.explanation.summary}
                </p>
              )}

              <RiskResultView
                report={result.report}
                source={result.source}
                latencyMs={result.latencyMs}
                ml={result.ml}
                showPayment={false}
              />
            </GlassCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}
