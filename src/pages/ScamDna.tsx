import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCurrentReport, useDemoStore } from '../store/demoStore';
import { controlScenarios, scenarioToInput, runScenarioLocal } from '../engine';
import { PageShell } from '../components/layout/PageShell';
import { ScamDnaChart } from '../components/risk/ScamDnaChart';
import { SimulationBadge } from '../components/ui/SimulationBadge';
import { HudPanel, ScamConstellation } from '../components/soc';

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
    <div className="flex flex-col sm:flex-row justify-between items-center bg-cyan-400/10 p-4 rounded-[3px] mb-6 border border-cyan-400/20">
      <div className="font-mono text-[11px] uppercase text-cyan-300 mb-4 sm:mb-0">
        {isDefault ? (
          <span>Showing the flagship demo: QR001 electricity-bill scam. Analyse something to see your own result.</span>
        ) : (
          <span>Showing: {record?.label}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <select
          aria-label="Load a demo scenario"
          className="bg-black/50 text-cyan-300 hud-label rounded-sm px-3 py-1.5 border border-cyan-400/20 focus:outline-none focus:border-cyan-400"
          onChange={handleScenarioChange}
          defaultValue=""
        >
          <option value="" disabled className="bg-slate-900">Load a demo scenario...</option>
          {scenarios.map(s => (
            <option key={s.id} value={s.id} className="bg-slate-900">{s.title}</option>
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
    <PageShell eyebrow="INTELLIGENCE" title="Scam DNA" subtitle="Deconstructing the deception" icon="dna" width="wide">
      <div className="mx-auto space-y-6 pb-12 w-full p-4 sm:p-6" data-testid="scam-dna">
        <ContextBar currentReportId={report.id} record={record} isDefault={isDefault} />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* DNA Section */}
          <div className="lg:col-span-7">
            <HudPanel eyebrow="SCAM DNA FINGERPRINT">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {report.patterns.map(p => (
                    <span key={p.id} className="hud-label border border-cyan-400/15 bg-cyan-400/5 py-1 px-2 rounded-sm text-cyan-300">
                      {p.name}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...transition, delay: 0.1 }} className="flex flex-col justify-center items-center h-64 border border-cyan-400/10 rounded-sm bg-black/20">
                  <ScamDnaChart dna={report.dna} variant="radar" />
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...transition, delay: 0.2 }} className="flex flex-col justify-center border border-cyan-400/10 rounded-sm bg-black/20 h-64 p-4">
                  <ScamDnaChart dna={report.dna} variant="bars" />
                </motion.div>
              </div>

              {/* Fingerprint Strip */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.3 }} className="space-y-2 mb-6">
                <h3 className="hud-label text-cyan-400">DNA FINGERPRINT STRIP</h3>
                <div className="h-6 w-full flex rounded-sm overflow-hidden shadow-inner bg-cyan-950/30">
                  {report.dna.map(strand => {
                    const colors: Record<string, string> = {
                      none: 'bg-slate-700',
                      low: 'bg-green-500',
                      medium: 'bg-amber-500',
                      high: 'bg-red-500'
                    };
                    const color = colors[strand.severity] || colors.none;
                    return (
                      <div
                        key={strand.key}
                        style={{ width: `${strand.percent}%` }}
                        className={`${color} h-full border-r border-cyan-950/50 last:border-r-0`}
                        title={`${strand.label}: ${Math.round(strand.percent)}%`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400">
                  The DNA fingerprint shows the relative strength of different deception signals, not standalone proof of fraud.
                </p>
              </motion.div>
            </HudPanel>
          </div>

          {/* Scam Constellation */}
          <div className="lg:col-span-5">
            <HudPanel eyebrow="SCAM CONSTELLATION">
              <ScamConstellation report={report} />
            </HudPanel>
          </div>
        </div>

        {/* Dominant Strands */}
        <HudPanel eyebrow="DOMINANT STRANDS" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dominantStrands.map((strand, i) => (
              <motion.div
                key={strand.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: 0.4 + (i * 0.1) }}
                className="bg-cyan-400/5 p-4 rounded-[3px] border border-cyan-400/15"
              >
                <div className="flex justify-between items-start mb-2 border-b border-cyan-400/15 pb-2">
                  <h4 className="hud-title text-cyan-300">{strand.label}</h4>
                  <span className="hud-label tracking-widest bg-cyan-400/10 px-1.5 py-0.5 rounded-[3px]">{Math.round(strand.percent)}%</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  {report.featureDetails[strand.key]}
                </p>
              </motion.div>
            ))}
          </div>
        </HudPanel>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-dashed border-cyan-400/20">
          <Link to="/attack-chain" className="hud-label px-4 py-2 rounded-sm text-cyan-400 border border-cyan-800 hover:bg-cyan-900/30 transition-colors">
            VIEW ATTACK CHAIN
          </Link>
          <Link to="/explain" className="hud-label px-4 py-2 rounded-sm text-cyan-400 border border-cyan-800 hover:bg-cyan-900/30 transition-colors">
            VIEW RISK EXPLANATION
          </Link>
          <Link to="/report" className="hud-label px-4 py-2 rounded-sm text-cyan-400 border border-cyan-800 hover:bg-cyan-900/30 transition-colors">
            INCIDENT REPORT
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
