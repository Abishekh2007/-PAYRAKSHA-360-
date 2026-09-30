import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCurrentReport } from '../store/demoStore';
import { PageShell } from '../components/layout/PageShell';
import { AttackChainView } from '../components/risk/AttackChainView';
import { ContextBar } from './ScamDna';
import { Button } from '../components/ui/Button';
import { HudPanel, ThreatLevel, StatusPill } from '../components/soc';

export default function AttackChain() {
  const { report, record, isDefault } = useCurrentReport();
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.4 };
  const [key, setKey] = useState(0);

  const handleReplay = () => setKey(prev => prev + 1);

  const activeNodes = report.attackChain.filter(n => n.active);

  return (
    <PageShell eyebrow="INTELLIGENCE" title="Attack Chain" subtitle="The scam lifecycle" icon="shield" width="wide">
      <div className="mx-auto space-y-6 pb-12 w-full p-4 sm:p-6">
        <ContextBar currentReportId={report.id} record={record} isDefault={isDefault} />

        {/* Header Strip with ThreatLevel and Stages Chip */}
        <div className="flex items-center gap-4 bg-cyan-400/5 p-4 rounded-sm border border-cyan-400/15">
          <ThreatLevel level={report.level} score={report.score} live={false} />
          <StatusPill tone="slate">{report.attackChain.length} STAGES</StatusPill>
        </div>

        {/* Hero Section with Chart */}
        <HudPanel eyebrow="KILL CHAIN" title="EXECUTION FLOW" right={<Button variant="outline" size="sm" onClick={handleReplay}>REPLAY</Button>}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="relative">
            <div className="py-8 bg-black/20 rounded-sm border border-cyan-400/10 overflow-x-auto min-h-48">
              <AttackChainView key={key} nodes={report.attackChain} animate orientation="responsive" />
            </div>
          </motion.div>
        </HudPanel>

        {/* Narrative List */}
        <HudPanel eyebrow="ANALYSIS">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.1 }} className="space-y-4">
            <h3 className="hud-title text-cyan-300">Kill Chain Analysis</h3>
            <ul className="space-y-3">
              {activeNodes.map((node, i) => (
                <motion.li
                  key={node.id}
                  data-active={node.active}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...transition, delay: 0.2 + (i * 0.1) }}
                  className="bg-cyan-400/5 p-4 rounded-sm flex items-start gap-4 border border-cyan-400/15"
                >
                  <div className="text-2xl pt-0.5 opacity-80" aria-hidden="true">{node.icon}</div>
                  <div>
                    <h4 className="hud-title text-cyan-300 mb-1">{node.label}</h4>
                    <p className="text-sm text-slate-300">{node.detail}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </HudPanel>

        {/* Callout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.4 }} className="bg-red-500/10 border border-red-500/30 p-5 rounded-sm">
          <h3 className="hud-label text-red-400 mb-2">PAYRAKSHA INTERVENES BEFORE THE PAYMENT STEP:</h3>
          <p className="text-red-300 text-lg uppercase tracking-wider font-mono">{report.recommendation.title}</p>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-dashed border-cyan-400/20">
          <Link to="/dna" className="hud-label px-4 py-2 rounded-sm text-cyan-400 border border-cyan-800 hover:bg-cyan-900/30 transition-colors">
            VIEW SCAM DNA
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
