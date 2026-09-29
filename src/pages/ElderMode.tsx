import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { useDemoStore, useCurrentReport } from '../store/demoStore';
import { controlScenarios } from '../engine';
import { Button, GlassCard, SimulationBadge, Toggle } from '../components/ui';
import { HeartHandshake, Volume2, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function ElderMode() {
  const navigate = useNavigate();
  const { elderMode, setElderMode, recordAnalysis, sendTrustedAlert } = useDemoStore();
  const { report } = useCurrentReport();
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const scenarios = controlScenarios();
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) return;
    const scenarioReport = require('../engine').runScenarioLocal(scenario.id);
    recordAnalysis({
      label: scenario.title,
      input: require('../engine').scenarioToInput(scenario),
      report: scenarioReport,
      source: 'browser',
    });
    setActionMsg(null);
  };

  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const isError = report.level === 'HIGH' || report.level === 'HIGH_CAUTION';
    const isCaution = report.level === 'CAUTION';

    let text = '';
    if (isError) text += 'STOP. DON\'T PAY YET. ';
    else if (isCaution) text += 'CHECK FIRST. ';
    else text += 'LOOKS OK. Still check the name before you pay. ';

    if (report.level !== 'LOW') {
      const reasons = report.explanation.reasons.slice(0, 3).map(r => r.replace(/\s*\(\+\d+\)$/, ''));
      text += reasons.join('. ') + '.';
    }

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const isHighDanger = report.level === 'HIGH' || report.level === 'HIGH_CAUTION';
  const isCaution = report.level === 'CAUTION';
  const isSafe = report.level === 'LOW';

  const reasons = report.explanation.reasons.slice(0, 3).map(r => r.replace(/\s*\(\+\d+\)$/, ''));

  return (
    <PageShell
      title="Elder Safety Mode"
      icon={<HeartHandshake className="w-8 h-8" />}
      actions={<SimulationBadge />}
    >
      <div className="flex flex-col gap-8">
        <GlassCard>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <Toggle
              label="Elder Safety Mode"
              description="Bigger text, simpler words, fewer choices."
              checked={elderMode}
              onChange={setElderMode}
            />

            <div className="flex flex-col gap-2 min-w-48">
              <label htmlFor="scenario-select" className="text-sm text-slate-400">
                Preview scenario:
              </label>
              <select
                id="scenario-select"
                aria-label="Preview scenario"
                className="bg-slate-900 border border-slate-700 text-white rounded p-2"
                onChange={handleScenarioChange}
                value={report.id}
              >
                <option value="" disabled>Select a scenario</option>
                {controlScenarios().map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Live Preview */}
        <div className="border-4 border-slate-700 rounded-3xl p-1 bg-black max-w-lg mx-auto w-full">
          <div className="bg-slate-950 rounded-[1.3rem] overflow-hidden">
            <div className={`p-6 sm:p-8 flex flex-col gap-6 ${isHighDanger ? 'bg-risk-high/10' : isCaution ? 'bg-risk-caution/10' : 'bg-risk-low/10'}`}>

              <div className="flex justify-between items-start">
                <h2 className="text-4xl sm:text-5xl font-black">
                  {isHighDanger && <span className="text-risk-high">⚠️ STOP</span>}
                  {isCaution && <span className="text-risk-caution">⚠️ CHECK FIRST</span>}
                  {isSafe && <span className="text-risk-low">✅ LOOKS OK</span>}
                </h2>

                {typeof window !== 'undefined' && window.speechSynthesis && (
                  <button
                    onClick={handleReadAloud}
                    className="p-3 bg-slate-800 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition"
                    aria-label="READ ALOUD"
                  >
                    <Volume2 className="w-6 h-6 sm:w-8 sm:h-8" />
                  </button>
                )}
              </div>

              <div className="text-2xl sm:text-3xl font-bold">
                {isHighDanger && "DON'T PAY YET"}
                {isCaution && <span className="text-slate-300">Wait to be sure.</span>}
              </div>

              <div className="text-xl sm:text-2xl text-slate-300 font-medium space-y-4 text-balance">
                {isSafe ? (
                  <p>Still check the name before you pay.</p>
                ) : (
                  <ul className="list-disc list-inside space-y-3">
                    {reasons.map((r, i) => (
                      <li key={i} className="leading-tight">{r}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-3 mt-4">
                {(isHighDanger || isCaution) ? (
                  <>
                    <Button size="lg" variant="outline" className="text-xl sm:text-2xl py-6" onClick={() => setActionMsg('Open the official app yourself and check there. (Demo)')}>
                      VERIFY
                    </Button>
                    <Button size="lg" variant="primary" className="text-xl sm:text-2xl py-6" onClick={() => { sendTrustedAlert(report); navigate('/trusted'); }}>
                      CALL TRUSTED PERSON
                    </Button>
                    <Button size="lg" variant="danger" className="text-xl sm:text-2xl py-6" onClick={() => setActionMsg('Payment cancelled. No money moved. (Demo)')}>
                      CANCEL
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="lg" variant="safe" className="text-xl sm:text-2xl py-6" onClick={() => setActionMsg('Simulation: low risk continue action')}>
                      CONTINUE (SIMULATION)
                    </Button>
                    <Button size="lg" variant="outline" className="text-xl sm:text-2xl py-6" onClick={() => setActionMsg('Payment cancelled. No money moved. (Demo)')}>
                      CANCEL
                    </Button>
                  </>
                )}
              </div>

              {actionMsg && (
                <div className="mt-4 p-4 text-center rounded bg-slate-900 border border-slate-700 text-lg font-medium text-slate-300 animate-in fade-in">
                  {actionMsg}
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
