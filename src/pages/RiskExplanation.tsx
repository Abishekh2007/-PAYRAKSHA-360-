import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCurrentReport, useDemoStore } from '../store/demoStore';
import { PageShell } from '../components/layout/PageShell';
import { ContextBar } from './ScamDna';
import { RiskScoreCard } from '../components/risk/RiskScoreCard';
import { ExplanationPanel } from '../components/risk/ExplanationPanel';
import { ContributionsChart } from '../components/risk/ContributionsChart';
import { SignalList } from '../components/risk/SignalList';
import { UrlChecksList } from '../components/risk/UrlChecksList';
import { Toggle } from '../components/ui/Toggle';
import { HudPanel, NextMoveCard } from '../components/soc';

export default function RiskExplanation() {
  const { report, record, isDefault } = useCurrentReport();
  const { technicalView, setTechnicalView } = useDemoStore();
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.4 };

  const totalPoints = report.contributions.reduce((sum, c) => sum + c.points, 0);

  return (
    <PageShell eyebrow="INTELLIGENCE" title="Risk Explanation" subtitle="Explainable AI" icon="brain" width="wide">
      <div className="mx-auto space-y-6 pb-12 w-full p-4 sm:p-6" data-testid="risk-explanation">
        <ContextBar currentReportId={report.id} record={record} isDefault={isDefault} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
                <RiskScoreCard report={report} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.1 }}>
                <ExplanationPanel report={report} />
              </motion.div>
            </div>

            {/* Contributions */}
            <HudPanel eyebrow="SCORING" title="Score Contributions" className="w-full">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.2 }}>
                <div className="mb-8">
                  <ContributionsChart contributions={report.contributions} score={report.score} clamped={report.clamped} />
                </div>

                <div className="bg-black/20 p-4 rounded-sm border border-cyan-400/15 overflow-x-auto text-slate-300">
                  <div className="text-cyan-400/70 mb-2 pb-2 border-b border-cyan-400/15 font-mono text-xs">
                    Risk score = baseline + Σ (weight × signal value) + combination bonuses, clamped to 0-100
                  </div>
                  <div className="text-cyan-300 font-mono text-[11px] uppercase tracking-wider">
                    {report.contributions.map(c => c.points).join(' + ')}
                    {' = '}{totalPoints}
                    {totalPoints !== report.score && ` → clamped to ${report.score}`}
                  </div>
                </div>
              </motion.div>
            </HudPanel>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <HudPanel eyebrow="PREDICTION" title="ADVERSARY NEXT MOVE">
              <NextMoveCard report={report} />
            </HudPanel>

            <HudPanel eyebrow="SIGNALS" title="DETECTED THREAT VECTORS">
              <div className="space-y-6">
                {report.analyses.text && !report.analyses.text.empty && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.3 }} className="bg-cyan-400/5 p-4 rounded-[3px] border border-cyan-400/15">
                    <h3 className="hud-label text-cyan-500 mb-4">Text Signals Detected</h3>
                    <SignalList signals={report.analyses.text.signals} />
                  </motion.div>
                )}

                {report.analyses.url && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.4 }} className="bg-cyan-400/5 p-4 rounded-[3px] border border-cyan-400/15">
                    <h3 className="hud-label text-cyan-500 mb-4">URL Analysis</h3>
                    <UrlChecksList analysis={report.analyses.url} />
                  </motion.div>
                )}
              </div>
            </HudPanel>
          </div>
        </div>

        {/* Technical View Toggle & Table */}
        <HudPanel eyebrow="TELEMETRY" title="Technical view" right={
          <Toggle checked={technicalView} onChange={setTechnicalView} label="Technical view" className="text-cyan-500" />
        }>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.5 }} className="space-y-4">
            <p className="text-xs text-slate-400 font-mono">Show raw feature values exposed to the ML layer</p>
            {technicalView && (
              <div className="overflow-x-auto pt-4">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-cyan-400/10 text-cyan-500 font-mono text-[10px] uppercase tracking-widest border-b border-cyan-400/20">
                    <tr>
                      <th className="px-4 py-3 font-normal">Feature / Key</th>
                      <th className="px-4 py-3 font-normal w-24 text-right">Value</th>
                      <th className="px-4 py-3 font-normal">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-400/10 border-b border-cyan-400/20">
                    {Object.entries(report.features).map(([key, value]) => (
                      <tr key={key} className="hover:bg-cyan-400/5 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-cyan-300">{key}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-right">{typeof value === 'number' ? value.toFixed(2) : String(value)}</td>
                        <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{report.featureDetails[key as keyof typeof report.featureDetails] || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-right">
                  <Link to="/technical" className="text-cyan-400 hover:text-cyan-300 font-mono text-[10px] uppercase tracking-widest underline underline-offset-4">
                    VIEW FULL TECHNICAL PAYLOAD
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </HudPanel>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-dashed border-cyan-400/20">
          <Link to="/dna" className="hud-label px-4 py-2 rounded-sm text-cyan-400 border border-cyan-800 hover:bg-cyan-900/30 transition-colors">
            VIEW SCAM DNA
          </Link>
          <Link to="/attack-chain" className="hud-label px-4 py-2 rounded-sm text-cyan-400 border border-cyan-800 hover:bg-cyan-900/30 transition-colors">
            VIEW ATTACK CHAIN
          </Link>
          <Link to="/report" className="hud-label px-4 py-2 rounded-sm text-cyan-400 border border-cyan-800 hover:bg-cyan-900/30 transition-colors">
            INCIDENT REPORT
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
