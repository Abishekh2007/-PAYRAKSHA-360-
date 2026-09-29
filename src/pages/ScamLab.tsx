import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDemoStore } from '../store/demoStore';
import { labScenarios, runScenarioLocal, scenarioToInput, analyzeLocal, getScenario } from '../engine';
import { PageShell } from '../components/layout';
import { GlassCard, Button, SimulationBadge, SectionHeader } from '../components/ui';
import { RiskResultView, ScamDnaChart, AttackChainView } from '../components/risk';

export default function ScamLab() {
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const recordAnalysis = useDemoStore(s => s.recordAnalysis);

  const comparisonTable = useMemo(() => {
    const list = [...labScenarios(), getScenario('legit_utility'), getScenario('legit_merchant')];
    return list.map(s => {
      const rep = runScenarioLocal(s.id);
      return {
        id: s.id,
        title: s.labLabel || s.name || s.id,
        score: rep.score,
        levelLabel: rep.levelLabel,
        patternName: rep.patternName
      };
    });
  }, []);

  const handleRun = (scenario: any) => {
    const rep = analyzeLocal(scenarioToInput(scenario));
    setActiveReport(rep);
    recordAnalysis({
      label: `Scam Lab · ${scenario.labLabel || scenario.name}`,
      input: scenarioToInput(scenario),
      report: rep,
      source: 'browser'
    });
  };

  useEffect(() => {
    if (activeReport && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeReport]);

  const scenarios = labScenarios();

  return (
    <PageShell eyebrow="Scam Lab" title="Scam Lab" subtitle="Test the engine against known patterns" icon={<span>🧪</span>}>
      <SimulationBadge />

      <section className="mb-12">
        <SectionHeader title="Scenario Library" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map(s => (
            <GlassCard key={s.id} className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{s.icon}</span>
                <h3 className="font-bold text-lg">{s.labLabel || s.name}</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">{s.summary}</p>
              {s.message && (
                <div className="bg-slate-900 p-3 rounded text-xs mb-4 text-gray-400 italic">
                  "{s.message.substring(0, 80)}..."
                </div>
              )}
              <div className="mt-auto">
                <Button fullWidth onClick={() => handleRun(s)} aria-label={`RUN IN LAB: ${s.labLabel || s.name}`}>
                  RUN IN LAB
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
            <Link to="/payment" className="btn-outline px-6 py-2 rounded">
                 Build your own scenario
            </Link>
        </div>
      </section>

      {activeReport && (
        <section className="mb-12" ref={resultRef}>
          <SectionHeader title="Analysis Result" />
          <RiskResultView report={activeReport} source="browser" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <GlassCard>
                <h3 className="font-bold mb-4">Scam DNA</h3>
                <ScamDnaChart dna={activeReport.dna} variant="bars" />
            </GlassCard>
            <GlassCard>
                <h3 className="font-bold mb-4">Attack Chain</h3>
                <AttackChainView nodes={activeReport.attackChain} />
            </GlassCard>
          </div>
        </section>
      )}

      <section className="mb-12">
        <SectionHeader title="Pattern Comparison" />
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-2">Scenario</th>
                  <th className="py-2">Pattern</th>
                  <th className="py-2 text-right">Score</th>
                  <th className="py-2">Level</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map(r => (
                  <tr key={r.id} className="border-b border-gray-800">
                    <td className="py-2">{r.title}</td>
                    <td className="py-2 text-sm text-gray-400">{r.patternName}</td>
                    <td className="py-2 text-right font-mono">{r.score}</td>
                    <td className="py-2 pl-4 text-xs">{r.levelLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>
    </PageShell>
  );
}
