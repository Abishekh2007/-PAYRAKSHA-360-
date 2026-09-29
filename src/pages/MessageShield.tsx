import React, { useState } from 'react';
import { PageShell } from '../components/layout';
import { Button, ErrorNotice, GlassCard, SimulationBadge, SectionHeader } from '../components/ui';
import { RiskResultView, SignalList } from '../components/risk';
import { GuardianRobot } from '../components/three';
import { analyzeRisk } from '../services/api';
import { getScenario } from '../engine';
import { useDemoStore } from '../store/demoStore';
import type { AnalyzeResponse } from '../types';

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
    } catch (err) {
      setError('Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sampleIds = ['utility_scam', 'kyc_scam', 'job_scam', 'customer_care_scam', 'legit_utility'];

  const cuesList = result?.report.analyses.text.signals.flatMap((s) =>
    s.cues.map((cue) => ({ word: cue, severity: s.severity }))
  ) || [];

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
                className="w-full h-32 p-3 border rounded text-black bg-white" // ensure proper styling if needed or rely on parent
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

               {result.report.analyses.text.signals.length > 0 && (
                 <div className="mb-4">
                   <h4 className="text-sm font-semibold mb-1">Detected Signals</h4>
                   <SignalList signals={result.report.analyses.text.signals} />
                 </div>
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
