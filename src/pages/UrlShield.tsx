import React, { useState } from 'react';
import { PageShell } from '../components/layout';
import { Button, ErrorNotice, GlassCard, SimulationBadge, SectionHeader, RiskGauge, EngineBadge } from '../components/ui';
import { GuardianRobot } from '../components/three';
import { analyzeUrlRisk } from '../services/api';
import { getScenario, analyzeUrlLocal } from '../engine';
import type { UrlResponse } from '../types';
import { riskHeadline } from '../lib/risk';

export default function UrlShield() {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [urlResult, setUrlResult] = useState<UrlResponse | null>(null);

  const handleAnalyze = async (text: string) => {
    const a = analyzeUrlLocal(text);
    if (!a.valid) {
      setError(a.error || 'Enter a valid URL.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setUrlResult(null);

    try {
      const uRes = await analyzeUrlRisk(text);
      setUrlResult(uRes);
    } catch (err) {
      setError('Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAnalyze(urlInput);
    }
  };

  const sampleIds = ['utility_scam', 'kyc_scam', 'shopping_scam', 'legit_utility'];

  const mood = isAnalyzing ? 'thinking' : urlResult ? (urlResult.analysis.level === 'LOW' ? 'safe' : 'alert') : 'idle';

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
                placeholder="Paste URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-3 bg-slate-900/50 text-slate-100 border border-slate-700/50 rounded focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 placeholder:text-slate-500"
              />
            </div>

            {error && <ErrorNotice message={error} className="mb-4" />}

            <Button
              onClick={() => handleAnalyze(urlInput)}
              loading={isAnalyzing}
              fullWidth
            >
              CHECK URL
            </Button>

            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wider">Demo URLs:</p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const u = 'https://official-demo-bank.example';
                    setUrlInput(u);
                    handleAnalyze(u);
                  }}
                >
                  Official bank (demo)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const u = 'https://secure-bank-kyc-demo.example';
                    setUrlInput(u);
                    handleAnalyze(u);
                  }}
                >
                  KYC look-alike (demo)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const u = 'https://example-shopping-offer.demo';
                    setUrlInput(u);
                    handleAnalyze(u);
                  }}
                >
                  Shopping offer (demo)
                </Button>
              </div>
            </div>

            <div className="mt-6">
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

          {urlResult && (
             <GlassCard className="mb-6" data-testid="risk-result" data-score={String(urlResult.analysis.score)} data-level={urlResult.analysis.level}>
               <SimulationBadge />

               <div className="flex flex-col items-center mt-4 mb-6">
                 <h3 className="text-sm font-semibold text-gray-400 tracking-wider mb-2">URL RISK</h3>
                 <div className="text-5xl font-mono font-bold text-slate-100 my-4">
                   {urlResult.analysis.score} <span className="text-slate-500 text-3xl">/ 100</span>
                 </div>
                 <RiskGauge
                   score={urlResult.analysis.score}
                   level={urlResult.analysis.level}
                   size={160}
                   showLabel={false}
                 />
                 <div className="mt-2 text-center">
                   <div className="text-xl font-bold bg-clip-text text-transparent flex items-center justify-center gap-2">
                     {riskHeadline(urlResult.analysis.level)}
                   </div>
                 </div>
               </div>

               <div className="mb-6 bg-slate-900/50 border border-slate-700/50 p-4 rounded-lg break-all">
                 <p className="text-xs text-slate-400 mb-1">Host:</p>
                 <span className="font-mono text-sm text-slate-200">{urlResult.analysis.host}</span>
               </div>

               {urlResult.analysis.reputation && (
                 <div className="mb-6">
                   <p className="text-sm text-slate-300">
                     Demo reputation database: <span className="font-semibold">{urlResult.analysis.reputation}</span> (simulated)
                   </p>
                 </div>
               )}

               <div className="mb-6">
                 <h4 className="text-sm font-semibold text-gray-300 tracking-wider mb-4 border-b border-slate-700/50 pb-2">
                   {urlResult.analysis.score < 30 ? 'WHY THIS LINK LOOKS SAFER' : 'WHY THIS LINK WAS FLAGGED'}
                 </h4>

                 {(() => {
                   const flaggedChecks = urlResult.analysis.checks?.filter((c) => c.points > 0) || [];
                   const passedChecks = urlResult.analysis.checks?.filter((c) => c.points === 0) || [];

                   return (
                     <>
                       {flaggedChecks.length > 0 && (
                         <ul className="space-y-3 mb-4">
                           {flaggedChecks.map((c) => (
                             <li key={c.id} className="flex flex-col p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg">
                               <div className="flex justify-between items-start gap-2 mb-1">
                                 <span className="font-medium text-slate-200 text-sm">{c.label}</span>
                                 <span className="text-risk-high font-mono text-sm font-semibold shrink-0">+{c.points}</span>
                               </div>
                               <p className="text-xs text-slate-400">{c.detail}</p>
                             </li>
                           ))}
                         </ul>
                       )}

                       {passedChecks.length > 0 && (
                         <div className="mt-4">
                           <details className="group">
                             <summary className="text-xs font-semibold text-slate-400 cursor-pointer list-none flex items-center gap-2">
                               <span className="transform group-open:rotate-90 transition-transform">▶</span>
                               Checks passed ({passedChecks.length})
                             </summary>
                             <ul className="space-y-2 mt-3 ml-4 border-l border-slate-700/50 pl-4">
                               {passedChecks.map((c) => (
                                 <li key={c.id} className="flex flex-col">
                                   <span className="font-medium text-slate-300 text-xs">{c.label}</span>
                                   <p className="text-[11px] text-slate-500">{c.detail}</p>
                                 </li>
                               ))}
                             </ul>
                           </details>
                         </div>
                       )}
                     </>
                   );
                 })()}
               </div>

               <div className="mt-6 flex flex-col items-center text-center gap-2">
                 <EngineBadge source={urlResult.source} latencyMs={urlResult.latencyMs} />
                 <p className="text-[11px] text-slate-500 italic mt-2">
                   Simulated intelligence — no request was made to this link.
                 </p>
               </div>
             </GlassCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}
