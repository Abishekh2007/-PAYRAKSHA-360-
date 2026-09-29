import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCurrentReport } from '../store/demoStore';
import { PageShell } from '../components/layout/PageShell'; // assuming PageShell location
import { AttackChainView } from '../components/risk/AttackChainView';
import { ContextBar } from './ScamDna'; // Reusing context bar
import { Button } from '../components/ui/Button';

export default function AttackChain() {
  const { report, record, isDefault } = useCurrentReport();
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.4 };
  const [key, setKey] = useState(0); // for remounting the view

  const handleReplay = () => setKey(prev => prev + 1);

  const activeNodes = report.attackChain.filter(n => n.active);

  return (
    <PageShell eyebrow="Analysis" title="Attack Chain" subtitle="The scam lifecycle" icon="shield">
      <div className="max-w-4xl mx-auto space-y-8 pb-12 w-full p-4 sm:p-6">
        <ContextBar currentReportId={report.id} record={record} isDefault={isDefault} />

        {/* Hero Section with Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="bg-navy-950 p-6 rounded-xl border border-navy-800 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl text-white">Execution Flow</h2>
            <Button variant="outline" size="sm" onClick={handleReplay}>Replay</Button>
          </div>

          <div className="py-8 bg-navy-900 rounded-lg border border-navy-800 overflow-x-auto min-h-48">
            <AttackChainView key={key} nodes={report.attackChain} animate orientation="responsive" />
          </div>
        </motion.div>

        {/* Narrative List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.1 }} className="space-y-4">
          <h3 className="font-display text-xl text-white">Kill Chain Analysis</h3>
          <ul className="space-y-3">
            {activeNodes.map((node, i) => (
              <motion.li
                key={node.id}
                data-active={node.active}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...transition, delay: 0.2 + (i * 0.1) }}
                className="bg-navy-800 p-4 rounded-lg flex items-start gap-4 border border-navy-700"
              >
                <div className="text-2xl pt-0.5 opacity-80" aria-hidden="true">{node.icon}</div>
                <div>
                  <h4 className="font-medium text-brand-300 text-sm mb-1">{node.label}</h4>
                  <p className="text-sm text-navy-200">{node.detail}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Callout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.4 }} className="bg-risk-high bg-opacity-10 border border-risk-high border-opacity-30 p-5 rounded-lg">
          <h3 className="text-risk-high font-medium text-sm mb-2">PAYRAKSHA intervenes before the payment step:</h3>
          <p className="text-white text-lg font-display">{report.recommendation.title}</p>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-navy-800">
          <Link to="/dna" className="btn-outline px-4 py-2 rounded text-sm text-brand-400 border border-brand-900 hover:bg-navy-800 transition-colors">
            View Scam DNA
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
