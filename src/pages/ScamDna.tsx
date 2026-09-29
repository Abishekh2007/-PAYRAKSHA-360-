import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCurrentReport, useDemoStore } from '../store/demoStore';
import { controlScenarios, scenarioToInput, runScenarioLocal } from '../engine';
import { PageShell } from '../components/layout/PageShell'; // assuming PageShell location, will adapt if needed
import { ScamDnaChart } from '../components/risk/ScamDnaChart';
import { SimulationBadge } from '../components/ui/SimulationBadge';

// Helper component for the context bar shared between the 3 pages
export function ContextBar({ currentReportId, record, isDefault }: { currentReportId: string, record: any, isDefault: boolean }) {
  const recordAnalysis = useDemoStore((s) => s.recordAnalysis);
  const scenarios = controlScenarios();

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const scenario = scenarios.find(s => s.id === id);
    if (scenario) {
      const report = runScenarioLocal(id);
      recordAnalysis({
        label: scenario.title,
        input: scenarioToInput(id),
        report,
        source: 'browser'
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-navy-900 p-4 rounded-lg mb-6 border border-navy-700">
      <div className="text-sm text-navy-100 mb-4 sm:mb-0">
        {isDefault ? (
          <span>Showing the flagship demo: QR001 electricity-bill scam. Analyse something to see your own result.</span>
        ) : (
          <span>Showing: {record?.label}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <select
          aria-label="Load a demo scenario"
          className="bg-navy-800 text-white text-sm rounded px-3 py-1.5 border border-navy-700 focus:outline-none focus:border-brand-500"
          onChange={handleScenarioChange}
          defaultValue=""
        >
          <option value="" disabled>Load a demo scenario...</option>
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <SimulationBadge />
      </div>
    </div>
  );
}

export default function ScamDna() {
  const { report, record, isDefault } = useCurrentReport();
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.5 };

  // Top 3 strands for explanation
  const dominantStrands = [...report.dna].sort((a, b) => b.percent - a.percent).slice(0, 3);

  return (
    <PageShell eyebrow="Analysis" title="Scam DNA" subtitle="Deconstructing the deception" icon="dna">
      <div className="max-w-4xl mx-auto space-y-8 pb-12 w-full p-4 sm:p-6">
        <ContextBar currentReportId={report.id} record={record} isDefault={isDefault} />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="bg-navy-950 p-6 rounded-xl border border-navy-800">
          <h2 className="font-display text-2xl sm:text-3xl text-white mb-4">{report.patternName}</h2>
          <div className="flex flex-wrap gap-2">
            {report.patterns.map(p => (
              <span key={p.id} className="chip bg-navy-800 text-brand-300 border py-1.5 px-3 rounded-full text-xs font-medium border-brand-900 border-opacity-30">
                {p.name}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...transition, delay: 0.1 }} className="bg-navy-900 rounded-xl p-4 flex flex-col justify-center items-center border border-navy-800 h-64 md:h-80">
            <ScamDnaChart dna={report.dna} variant="radar" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...transition, delay: 0.2 }} className="bg-navy-900 rounded-xl p-4 flex flex-col justify-center border border-navy-800 h-64 md:h-80">
            <ScamDnaChart dna={report.dna} variant="bars" />
          </motion.div>
        </div>

        {/* Fingerprint Strip */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.3 }} className="space-y-2">
          <h3 className="text-sm font-medium text-navy-200">DNA Fingerprint</h3>
          <div className="h-6 w-full flex rounded overflow-hidden shadow-inner bg-navy-900">
            {report.dna.map(strand => {
              const colors = {
                none: 'bg-navy-600',
                low: 'bg-risk-low',
                medium: 'bg-risk-caution',
                high: 'bg-risk-high'
              };
              const color = colors[strand.severity] || colors.none;
              return (
                <div
                  key={strand.key}
                  style={{ width: `${strand.percent}%` }}
                  className={`${color} h-full border-r border-navy-950 last:border-r-0`}
                  title={`${strand.label}: ${Math.round(strand.percent)}%`}
                />
              );
            })}
          </div>
          <p className="text-xs text-navy-400 mt-2">
            The DNA fingerprint shows the relative strength of different deception signals, not standalone proof of fraud.
          </p>
        </motion.div>

        {/* Dominant Strands */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.4 }} className="space-y-4">
          <h3 className="font-display text-xl text-white">Dominant strands</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dominantStrands.map((strand, i) => (
              <motion.div
                key={strand.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: 0.5 + (i * 0.1) }}
                className="bg-navy-800 p-4 rounded-lg border border-navy-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-brand-300 text-sm">{strand.label}</h4>
                  <span className="text-xs font-mono text-navy-300 bg-navy-900 px-1.5 py-0.5 rounded">{Math.round(strand.percent)}%</span>
                </div>
                <p className="text-sm text-navy-200">
                  {report.featureDetails[strand.key]}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-navy-800">
          <Link to="/attack-chain" className="btn-outline px-4 py-2 rounded text-sm text-brand-400 border border-brand-900 hover:bg-navy-800 transition-colors">
            View Attack Chain
          </Link>
          <Link to="/explain" className="btn-outline px-4 py-2 rounded text-sm text-brand-400 border border-brand-900 hover:bg-navy-800 transition-colors">
            View Risk Explanation
          </Link>
          <Link to="/report" className="btn-outline px-4 py-2 rounded text-sm text-brand-400 border border-brand-900 hover:bg-navy-800 transition-colors">
            Incident Report
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
