import React, { useState } from 'react';
import { PageShell } from '../components/layout';
import { Button, ErrorNotice, GlassCard, SimulationBadge, SectionHeader } from '../components/ui';
import { RiskResultView, UrlChecksList } from '../components/risk';
import { GuardianRobot } from '../components/three';
import { analyzeRisk, analyzeUrlRisk } from '../services/api';
import { getScenario, analyzeUrlLocal } from '../engine';
import { useDemoStore } from '../store/demoStore';
import type { AnalyzeResponse, UrlResponse } from '../types';

export default function UrlShield() {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskResult, setRiskResult] = useState<AnalyzeResponse | null>(null);
  const [urlResult, setUrlResult] = useState<UrlResponse | null>(null);
  const recordAnalysis = useDemoStore((state) => state.recordAnalysis);

  const handleAnalyze = async (text: string) => {
    const a = analyzeUrlLocal(text);
    if (!a.valid) {
      setError(a.error || 'Enter a valid URL.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setRiskResult(null);
    setUrlResult(null);

    try {
      const [uRes, rRes] = await Promise.all([
        analyzeUrlRisk(text),
        analyzeRisk({ url: text })
      ]);
      setUrlResult(uRes);
      setRiskResult(rRes);

      recordAnalysis({
        label: 'URL analysis',
        input: { url: text },
        report: rRes.report,
        source: rRes.source,
        ml: rRes.ml,
        latencyMs: rRes.latencyMs,
      });
    } catch (err) {
      setError('Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sampleIds = ['utility_scam', 'kyc_scam', 'shopping_scam', 'legit_utility'];

  const mood = isAnalyzing ? 'thinking' : riskResult ? (riskResult.report.level === 'LOW' ? 'safe' : 'alert') : 'idle';

  return (
    <PageShell
      eyebrow="Shield"
      title="URL Shield"
      subtitle="Analyze suspicious links"
      icon={<span aria-hidden="true">🔗</span>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <GlassCard>
            <SectionHeader title="Input URL" />
            <div className="mb-4">
              <label htmlFor="url-input" className="sr-only">
                URL to analyze
              </label>
              <input
                type="text"
                id="url-input"
                aria-label="URL to analyze"
                placeholder="Paste a link to check (it is never opened)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full p-3 border rounded text-black bg-white"
              />
            </div>

            {error && <ErrorNotice message={error} className="mb-4" />}

            <Button
              onClick={() => handleAnalyze(urlInput)}
              loading={isAnalyzing}
              fullWidth
            >
              ANALYZE URL
            </Button>

            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Try a sample:</p>
              <div className="flex flex-wrap gap-2">
                {sampleIds.map((id) => {
                  const scenario = getScenario(id);
                  if (!scenario.url) return null;
                  return (
                    <Button
                      key={id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUrlInput(scenario.url);
                        handleAnalyze(scenario.url);
                      }}
                    >
                      {scenario.shortLabel}
                    </Button>
                  );
                })}
              </div>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              Simulated intelligence: the link was never opened, fetched or resolved.
            </p>
          </GlassCard>
        </div>

        <div>
          <div className="h-48 mb-6 relative">
            <GuardianRobot mood={mood} />
          </div>

          {(urlResult && riskResult) && (
             <GlassCard className="mb-6">
               <SimulationBadge />
               <h3 className="text-lg font-bold mb-2 mt-2">Link Analysis</h3>

               <div className="mb-4">
                 <span className="inline-block px-3 py-1 bg-gray-800 rounded-full text-sm mb-2">
                   Link risk {urlResult.analysis.score} / 100
                 </span>
                 <UrlChecksList analysis={urlResult.analysis} />
               </div>

               <RiskResultView
                 report={riskResult.report}
                 source={riskResult.source}
                 latencyMs={riskResult.latencyMs}
                 ml={riskResult.ml}
                 showPayment={false}
               />
             </GlassCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}
