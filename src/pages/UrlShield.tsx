import React, { useState } from 'react';
import { PageShell } from '../components/layout';
import { Button, ErrorNotice, SimulationBadge, RiskGauge, EngineBadge } from '../components/ui';
import { HudPanel, ShieldStatus, shieldStateFor, StatusPill, socToneForLevel } from '../components/soc';
import { analyzeUrlRisk } from '../services/api';
import { analyzeUrlLocal, getScenario, runScenarioLocal } from '../engine';
import type { UrlResponse } from '../types';
import { levelTheme } from '../lib/risk';

const URL_VERDICT: Record<string, string> = {
  LOW: 'No strong warning signals detected in this link.',
  CAUTION: 'Some warning signals detected. Verify before you continue.',
  HIGH_CAUTION: 'Potentially risky link. Multiple warning signals detected.',
  HIGH: 'Suspicious link. Multiple strong warning signals detected.',
};

const SAMPLE_IDS = ['utility_scam', 'kyc_scam', 'shopping_scam', 'legit_utility'] as const;

interface SampleEntry {
  id: string;
  label: string;
  url: string | null;
  level: string | null;
}

const SAMPLES: SampleEntry[] = SAMPLE_IDS.map((id) => {
  const scenario = getScenario(id);
  let level: string | null = null;
  try {
    const report = runScenarioLocal(id);
    level = report.level;
  } catch {
    level = null;
  }
  return {
    id,
    label: scenario.shortLabel,
    url: scenario.url || null,
    level,
  };
});

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

  const shieldState = shieldStateFor(urlResult?.analysis.level ?? null, isAnalyzing);

  return (
    <PageShell
      title="URL Shield"
      subtitle="Paste a link to detect suspicious hosting, age, or threat reports before clicking."
      eyebrow="SHIELDS"
      width="wide"
      icon={<span aria-hidden="true">🔗</span>}
      actions={<SimulationBadge />}
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <HudPanel eyebrow="LINK INTAKE">
            <div className="mb-4">
              <label htmlFor="url-input" className="sr-only">
                URL to analyze
              </label>
              <input
                id="url-input"
                name="url-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://"
                aria-label="URL to analyze"
                className="font-mono bg-black/40 border border-cyan-400/20 text-slate-200 outline-none p-3 w-full block focus:border-cyan-300 transition-colors"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {error && <ErrorNotice message={error} className="mb-4" />}

            <Button
              variant="primary"
              fullWidth
              loading={isAnalyzing}
              onClick={() => handleAnalyze(urlInput)}
            >
              CHECK URL
            </Button>

            <div className="mt-6">
              <p className="hud-label mb-3">Demo URLs:</p>
              <div className="flex flex-col gap-2">
                <div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      const u = 'https://official-demo-bank.example';
                      setUrlInput(u);
                      handleAnalyze(u);
                    }}
                  >
                    Official bank (demo)
                  </Button>
                  <p className="mt-1 font-mono text-xs text-slate-400 break-all">https://official-demo-bank.example</p>
                </div>
                <div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      const u = 'https://secure-bank-kyc-demo.example';
                      setUrlInput(u);
                      handleAnalyze(u);
                    }}
                  >
                    KYC look-alike (demo)
                  </Button>
                  <p className="mt-1 font-mono text-xs text-slate-400 break-all">https://secure-bank-kyc-demo.example</p>
                </div>
                <div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      const u = 'https://example-shopping-offer.demo';
                      setUrlInput(u);
                      handleAnalyze(u);
                    }}
                  >
                    Shopping offer (demo)
                  </Button>
                  <p className="mt-1 font-mono text-xs text-slate-400 break-all">https://example-shopping-offer.demo</p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs text-cyan-400/70 border-t border-cyan-400/15 pt-4">
              Demo environment: All links are analyzed safely. No external requests are made.
            </p>
          </HudPanel>

          <HudPanel eyebrow="SCENARIO SAMPLES · DEMO">
            <div className="flex flex-col gap-1">
              {SAMPLES.filter((s) => s.url !== null).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full text-left font-mono text-xs border border-cyan-400/15 rounded-sm px-3 py-2 hover:bg-cyan-400/10 transition-colors flex items-center justify-between gap-2 text-slate-200"
                  onClick={() => {
                    const url = s.url!;
                    setUrlInput(url);
                    handleAnalyze(url);
                  }}
                >
                  <span>{s.label}</span>
                  {s.level && (
                    <span aria-hidden="true">
                      <StatusPill tone={socToneForLevel(s.level)}>
                        {s.level.replace('_', ' ')}
                      </StatusPill>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </HudPanel>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-4">
          <ShieldStatus
            state={shieldState}
            shield="URL SHIELD"
            score={urlResult?.analysis.score}
            detail="Live URL forensics module"
          />

          {urlResult && (
            <div
              data-testid="risk-result"
              data-score={String(urlResult.analysis.score)}
              data-level={urlResult.analysis.level}
            >
              <HudPanel eyebrow="LINK FORENSICS" className="mb-6">
                <div className="flex justify-end p-4 pb-0">
                  <SimulationBadge />
                </div>
                <div className="p-4 pt-0">
                  <div className="flex flex-col items-center mt-4 mb-6">
                    <h3 className="hud-title text-slate-400 tracking-wider mb-2">URL RISK</h3>
                    <div className="text-5xl font-mono font-bold text-slate-100 my-4">
                      {urlResult.analysis.score} <span className="text-slate-500 text-3xl">/ 100</span>
                    </div>
                    <RiskGauge
                      score={urlResult.analysis.score}
                      level={urlResult.analysis.level}
                      animate={true}
                    />
                    <div className="mt-6 text-center">
                      {(() => {
                        const theme = levelTheme(urlResult.analysis.level);
                        return (
                          <>
                            <p data-testid="url-level" className={`text-xl font-bold font-mono ${theme.text}`}>
                              {theme.emoji} {theme.short}
                            </p>
                            <p className="text-sm text-slate-300 mt-1">
                              {URL_VERDICT[urlResult.analysis.level] ?? URL_VERDICT.CAUTION}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mb-6 bg-cyan-950/20 border border-cyan-400/20 p-4 rounded-sm break-all">
                    <p className="text-xs text-cyan-500 mb-1 font-mono uppercase tracking-widest">Host:</p>
                    <span className="font-mono text-sm text-cyan-100">{urlResult.analysis.host}</span>
                  </div>

                  {urlResult.analysis.reputation ? (
                    <div className="mb-6">
                      <p className="text-sm text-slate-300">
                        Demo reputation database: <span className="font-semibold">{urlResult.analysis.reputation}</span> (simulated)
                      </p>
                    </div>
                  ) : null}

                  <div className="mb-6">
                    <h4 className="hud-title text-slate-300 mb-4 border-b border-cyan-400/15 pb-2">
                      {urlResult.analysis.score < 30 ? 'WHY THIS LINK LOOKS SAFER' : 'WHY THIS LINK WAS FLAGGED'}
                    </h4>


                    {(() => {
                      const analysis = urlResult.analysis;
                      const checks = analysis.checks || [];
                      const riskFactors = checks.filter(c => c.points > 0);
                      const safeSignals = checks.filter(c => c.points <= 0);

                      const hasRisks = riskFactors.length > 0;
                      const hasSafe = safeSignals.length > 0;

                      return (
                        <>
                          {hasRisks && (
                            <ul className="space-y-3 mb-4">
                              {riskFactors.map(c => (
                                <li key={c.id} className="flex flex-col p-3 bg-red-950/20 border border-red-900/50 rounded-sm">
                                  <div className="flex justify-between items-start gap-2 mb-1">
                                    <span className="font-medium text-slate-200 text-sm font-mono">{c.label}</span>
                                    <span className="text-risk-high font-mono text-sm font-semibold shrink-0">+{c.points}</span>
                                  </div>
                                  <p className="text-xs text-slate-400">{c.detail}</p>
                                </li>
                              ))}
                            </ul>
                          )}

                          {hasSafe && (
                            <div className="mt-4">
                              <details className="group">
                                <summary className="text-xs font-semibold text-slate-400 cursor-pointer list-none flex items-center gap-2">
                                  <span className="transform group-open:rotate-90 transition-transform text-cyan-500">▶</span>
                                  Safe signals detected
                                </summary>
                                <ul className="space-y-2 mt-3 ml-4 border-l border-cyan-400/20 pl-4">
                                  {safeSignals.map(c => (
                                    <li key={c.id} className="flex flex-col">
                                      <span className="font-medium text-slate-300 text-xs font-mono">{c.label}</span>
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

                  <div className="mt-6 flex flex-col items-center text-center gap-2 border-t border-cyan-400/15 pt-6">
                    <EngineBadge source={urlResult.source} latencyMs={urlResult.latencyMs} />
                    <p className="text-[11px] text-cyan-500 italic mt-2">
                      Simulated intelligence — no request was made to this link.
                    </p>
                  </div>
                </div>
              </HudPanel>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
