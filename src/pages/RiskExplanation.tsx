import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCurrentReport, useDemoStore } from '../store/demoStore';
import { PageShell } from '../components/layout/PageShell'; // assuming PageShell location
import { ContextBar } from './ScamDna';
import { RiskScoreCard } from '../components/risk/RiskScoreCard';
import { ExplanationPanel } from '../components/risk/ExplanationPanel';
import { ContributionsChart } from '../components/risk/ContributionsChart';
import { SignalList } from '../components/risk/SignalList';
import { UrlChecksList } from '../components/risk/UrlChecksList';
import { Toggle } from '../components/ui/Toggle';

export default function RiskExplanation() {
  const { report, record, isDefault } = useCurrentReport();
  const { technicalView, setTechnicalView } = useDemoStore();
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.4 };

  const totalPoints = report.contributions.reduce((sum, c) => sum + c.points, 0);

  return (
    <PageShell eyebrow="Analysis" title="Risk Explanation" subtitle="Explainable AI" icon="brain">
      <div className="max-w-4xl mx-auto space-y-8 pb-12 w-full p-4 sm:p-6" data-testid="risk-explanation">
        <ContextBar currentReportId={report.id} record={record} isDefault={isDefault} />

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
            <RiskScoreCard report={report} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.1 }}>
            <ExplanationPanel report={report} />
          </motion.div>
        </div>

        {/* Contributions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.2 }} className="bg-navy-950 p-6 rounded-xl border border-navy-800">
          <h2 className="font-display text-xl text-white mb-6">Score Contributions</h2>
          <div className="mb-8">
            <ContributionsChart contributions={report.contributions} score={report.score} clamped={report.clamped} />
          </div>

          <div className="bg-navy-900 font-mono text-xs p-4 rounded border border-navy-800 overflow-x-auto text-navy-200">
            <div className="text-navy-400 mb-2 pb-2 border-b border-navy-800">
              Risk score = baseline + Σ (weight × signal value) + combination bonuses, clamped to 0-100
            </div>
            <div className="text-brand-300">
              {report.contributions.map(c => c.points).join(' + ')}
              {' = '}{totalPoints}
              {totalPoints !== report.score && ` → clamped to ${report.score}`}
            </div>
          </div>
        </motion.div>

        {/* Signals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.analyses.text && !report.analyses.text.empty && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.3 }} className="bg-navy-900 p-4 rounded-xl border border-navy-800">
              <h3 className="font-medium text-white mb-4 text-sm">Text Signals Detected</h3>
              <SignalList signals={report.analyses.text.signals} />
            </motion.div>
          )}

          {report.analyses.url && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.4 }} className="bg-navy-900 p-4 rounded-xl border border-navy-800">
              <h3 className="font-medium text-white mb-4 text-sm">URL Analysis</h3>
              <UrlChecksList analysis={report.analyses.url} />
            </motion.div>
          )}
        </div>

        {/* Technical View Toggle & Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.5 }} className="bg-navy-950 p-6 rounded-xl border border-navy-800 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-navy-800">
            <div>
              <h3 className="text-white font-medium">Technical view</h3>
              <p className="text-xs text-navy-300">Show raw feature values exposed to the ML layer</p>
            </div>
            <Toggle checked={technicalView} onChange={setTechnicalView} label="Technical view" className="text-brand-500" />
          </div>

          {technicalView && (
            <div className="overflow-x-auto pt-4">
              <table className="w-full text-left text-sm text-navy-100">
                <thead className="bg-navy-900 text-navy-300 font-mono text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 border-b border-navy-800 font-normal">Feature / Key</th>
                    <th className="px-4 py-2 border-b border-navy-800 font-normal w-24 text-right">Value</th>
                    <th className="px-4 py-2 border-b border-navy-800 font-normal">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/50">
                  {Object.entries(report.features).map(([key, value]) => (
                    <tr key={key} className="hover:bg-navy-900/50">
                      <td className="px-4 py-2 font-mono text-xs text-brand-300">{key}</td>
                      <td className="px-4 py-2 font-mono text-right">{typeof value === 'number' ? value.toFixed(2) : String(value)}</td>
                      <td className="px-4 py-2 text-xs text-navy-300">{report.featureDetails[key as keyof typeof report.featureDetails] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-right">
                <Link to="/technical" className="text-brand-400 hover:text-brand-300 text-sm underline underline-offset-4">
                  View full technical payload
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-navy-800">
          <Link to="/dna" className="btn-outline px-4 py-2 rounded text-sm text-brand-400 border border-brand-900 hover:bg-navy-800 transition-colors">
            View Scam DNA
          </Link>
          <Link to="/attack-chain" className="btn-outline px-4 py-2 rounded text-sm text-brand-400 border border-brand-900 hover:bg-navy-800 transition-colors">
            View Attack Chain
          </Link>
          <Link to="/report" className="btn-outline px-4 py-2 rounded text-sm text-brand-400 border border-brand-900 hover:bg-navy-800 transition-colors">
            Incident Report
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
