import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDemoStore } from '../store/demoStore';
import { labScenarios, runScenarioLocal, scenarioToInput, getScenario } from '../engine';
import { analyzeRisk } from '../services/api';
import { PageShell } from '../components/layout';
import { ErrorNotice, Button, SimulationBadge } from '../components/ui';
import { RiskResultView, ScamDnaChart, AttackChainView } from '../components/risk';
import { HudPanel, KpiTile, StatusPill, channelFor, socToneForLevel } from '../components/soc';
import type { RiskReport, Scenario, EngineSource } from '../types';

export default function ScamLab() {
  const [activeResponse, setActiveResponse] = useState<{ report: RiskReport; source: EngineSource; latencyMs?: number | null; ml?: any } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const activeReport = activeResponse?.report || null;
  const resultRef = useRef<HTMLDivElement>(null);
  const recordAnalysis = useDemoStore(s => s.recordAnalysis);

  const tableData = useMemo(() => {
    const labList = labScenarios();
    const extras: Scenario[] = [];
    try { extras.push(getScenario('legit_utility')); } catch { /* ignore */ }
    try { extras.push(getScenario('legit_merchant')); } catch { /* ignore */ }
    const list = [...labList, ...extras.filter(e => !labList.find(s => s.id === e.id))];

    return list.map((s: Scenario) => {
      const report = runScenarioLocal(s.id);
      const expected = (s as any).expectation ?? (s.id.startsWith('legit_') ? 'SHOULD PASS' : 'SHOULD FLAG');
      const isFlagged = report.level !== 'LOW';
      const match = (expected === 'SHOULD FLAG' && isFlagged) || (expected === 'SHOULD PASS' && !isFlagged);
      return { s, report, expected, isFlagged, match };
    });
  }, []);

  const kpis = useMemo(() => {
    return {
      scenarios: tableData.length,
      flagged: tableData.filter(d => d.isFlagged).length,
      passed: tableData.filter(d => !d.isFlagged).length,
      matches: tableData.filter(d => d.match).length,
    };
  }, [tableData]);

  const cardData = useMemo(() => {
    return labScenarios().map((s) => ({ s, report: runScenarioLocal(s.id) }));
  }, []);

  const handleRun = async (scenario: Scenario) => {
    setError('');
    setIsAnalyzing(true);
    setActiveScenarioId(scenario.id);
    try {
      const input = scenarioToInput(scenario);
      const response = await analyzeRisk(input);
      setActiveResponse(response);
      recordAnalysis({
        label: `Scam Lab · ${scenario.labLabel || scenario.title}`,
        input,
        report: response.report,
        source: response.source,
        ml: response.ml,
        latencyMs: response.latencyMs
      });
    } catch {
      setError('Analysis failed.');
    } finally {
      setIsAnalyzing(false);
      setActiveScenarioId(null);
    }
  };

  useEffect(() => {
    if (activeReport && resultRef.current) {
      resultRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }, [activeReport]);

  return (
    <PageShell eyebrow="LAB" title="THREAT LIBRARY" width="wide">
      <HudPanel eyebrow="SIMULATED HACKATHON DATA" title="DETECTION COVERAGE" className="mb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiTile label="Scenarios" value={kpis.scenarios} />
          <KpiTile label="Flagged" value={kpis.flagged} tone="orange" />
          <KpiTile label="Passed as low risk" value={kpis.passed} tone="green" />
          <KpiTile label="Matches" value={`${kpis.matches}/${kpis.scenarios}`} tone={kpis.matches === kpis.scenarios ? 'green' : 'amber'} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-cyan-400/15 hud-label text-slate-400">
                <th className="py-2">Scenario</th>
                <th className="py-2">Expected</th>
                <th className="py-2">Engine Result</th>
                <th className="py-2 text-right">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map(({ s, report, expected, match }) => (
                <tr key={s.id} className="border-b border-cyan-400/15 text-sm">
                  <td className="py-2 font-mono text-cyan-100">{s.labLabel || s.title}</td>
                  <td className="py-2 font-mono text-xs text-slate-300">{expected}</td>
                  <td className="py-2">
                     <div className="flex items-center gap-2">
                       <span className="font-mono text-xs text-slate-300">RISK {report.score}</span>
                       <StatusPill tone={socToneForLevel(report.level)}>{report.level}</StatusPill>
                     </div>
                  </td>
                  <td className="py-2 text-right font-mono text-xs">
                    {match ? <span className="text-green-400">✓ MATCH</span> : <span className="text-red-400">✗ MISS</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </HudPanel>

      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cardData.map(({ s, report }) => (
            <HudPanel key={s.id} tone={socToneForLevel(report.level)} className="flex flex-col h-full">
              <div className="flex items-center justify-between gap-2 mb-3">
                 <div className="flex items-center gap-2">
                   <span className="text-xl" aria-hidden="true">{s.icon}</span>
                   <StatusPill tone="slate">{channelFor(report)}</StatusPill>
                 </div>
                 <StatusPill tone="slate">{report.attackChain.length} BEATS</StatusPill>
              </div>
              <h3 className="hud-title mb-2 text-cyan-50">{s.labLabel || s.title}</h3>
              <p className="text-sm text-slate-300 mb-4 flex-1">{s.summary}</p>

              {s.message && (
                <div className="bg-slate-900/50 p-3 rounded-sm text-xs mb-4 text-slate-400 italic font-medium leading-relaxed border border-cyan-400/10">
                  "{s.message.substring(0, 80)}..."
                </div>
              )}

              <div className="flex items-center justify-between mb-4 border-t border-cyan-400/15 pt-4">
                <StatusPill tone={socToneForLevel(report.level)}>{report.level}</StatusPill>
                <div className="font-mono text-xs text-slate-300">
                   RISK {report.score}
                </div>
              </div>

              <div className="mt-auto">
                <Button
                  fullWidth
                  onClick={() => handleRun(s)}
                  disabled={isAnalyzing}
                  aria-label={`RUN IN LAB: ${s.labLabel || s.title}`}
                >
                  {isAnalyzing && activeScenarioId === s.id ? 'Analyzing...' : 'RUN IN LAB'}
                </Button>
              </div>
            </HudPanel>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
            <Link to="/payment" className="hud-label text-cyan-400 hover:text-cyan-300 border border-cyan-400/20 px-4 py-2 rounded-sm bg-cyan-400/5">
                 Build your own scenario
            </Link>
        </div>
      </section>

      {error && <ErrorNotice message={error} className="mb-8" />}

      {activeReport && activeResponse && (
        <section className="mb-12" ref={resultRef}>
          <h2 className="hud-title mb-4">ANALYSIS RESULT</h2>
          <RiskResultView
            report={activeReport}
            source={activeResponse.source}
            latencyMs={activeResponse.latencyMs}
            ml={activeResponse.ml}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <HudPanel title="Scam DNA">
                <ScamDnaChart dna={activeReport.dna} variant="bars" />
            </HudPanel>
            <HudPanel title="Attack Chain">
                <AttackChainView nodes={activeReport.attackChain} />
            </HudPanel>
          </div>
        </section>
      )}
    </PageShell>
  );
}
