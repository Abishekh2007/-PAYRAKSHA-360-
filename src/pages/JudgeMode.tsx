import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { Button, ScanSteps, RiskGauge, SimulationBadge } from '../components/ui';
import { RiskResultView, AttackChainView } from '../components/risk';
import { HudPanel, KpiTile } from '../components/soc';
import { getScenario, runScenarioLocal, runSignalsConnected, scenarioToInput } from '../engine';
import { useDemoStore } from '../store/demoStore';

export default function JudgeMode() {
  const [act, setAct] = useState(1);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [finished, setFinished] = useState(false);

  const recordAnalysis = useDemoStore((s) => s.recordAnalysis);

  const act1Scenario = getScenario('utility_scam');
  const act1Report = runScenarioLocal('utility_scam');

  const act2Scenario = getScenario('legit_utility');
  const act2Report = runScenarioLocal('legit_utility');

  const act3Sequence = runSignalsConnected();

  const stepsList = [
    'QR DETECTED',
    'Extracting payment metadata...',
    'Checking recipient...',
    'Checking payment context...',
    'Running risk engine...'
  ];

  const resetActState = () => {
    setRunning(false);
    setStepIndex(-1);
    setFinished(false);
  };

  const handleNext = () => {
    if (act < 3) {
      setAct(act + 1);
      resetActState();
    }
  };

  const handlePrev = () => {
    if (act > 1) {
      setAct(act - 1);
      resetActState();
    }
  };

  const runAct12 = (report: any, actNum: number, scenarioId: string) => {
    setRunning(true);
    setStepIndex(0);
    setFinished(false);
    let current = 0;
    const tick = setInterval(() => {
      current++;
      setStepIndex(current);
      if (current >= stepsList.length) {
        clearInterval(tick);
        setRunning(false);
        setFinished(true);
        recordAnalysis({
          report,
          input: scenarioToInput(scenarioId),
          source: 'browser',
          label: `Judge Mode · Act ${actNum}`
        });
      }
    }, 250);
  };

  const runAct3 = () => {
    setRunning(true);
    setStepIndex(0);
    setFinished(false);
    const totalSteps = act3Sequence.steps.length;
    let current = 0;
    const tick = setInterval(() => {
      current++;
      setStepIndex(current);
      if (current >= totalSteps) {
        clearInterval(tick);
        setRunning(false);
        setFinished(true);
        const finalReport = act3Sequence.steps[totalSteps - 1].report;
        recordAnalysis({
          report: finalReport,
          input: act3Sequence.steps[totalSteps - 1].input,
          source: 'browser',
          label: 'Judge Mode · Act 3'
        });
      }
    }, 500);
  };

  return (
    <PageShell eyebrow="SYSTEM" title="JUDGE BRIEFING" width="wide">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiTile label="Demo steps" value="3" tone="cyan" data-testid="kpi-demo-steps" />
          <KpiTile label="Scenarios" value="2" tone="violet" />
          <KpiTile label="Real payments" value="0" tone="green" />
        </div>

        <HudPanel
          title={`ACT ${act} OF 3`}
          tone="cyan"
          right={
            <div className="flex gap-2">
              <Button onClick={handlePrev} disabled={act === 1} variant="outline" size="sm">Previous</Button>
              <Button onClick={resetActState} variant="outline" size="sm">Reset</Button>
              <Button onClick={handleNext} disabled={act === 3} variant="outline" size="sm">Next</Button>
            </div>
          }
        >
          {act === 1 && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0 font-mono text-[4rem] font-bold leading-none tracking-tighter text-cyan-400/20">01</div>
                <div className="w-full space-y-4 pt-2">
                  <h3 className="hud-title text-cyan-300">Scam Context</h3>
                  <div className="font-mono text-xs text-slate-300">
                    <p className="mb-2"><strong className="text-cyan-400">Message:</strong> {act1Scenario.message}</p>
                    <p className="mb-2"><strong className="text-cyan-400">URL:</strong> {act1Scenario.url}</p>
                    <div className="mb-4">
                      <strong className="text-cyan-400">QR Payload lines:</strong>
                      <pre className="mt-2 whitespace-pre-wrap rounded border border-white/10 bg-white/5 p-3 font-code text-[10px] text-cyan-100">{act1Scenario.qrText}</pre>
                    </div>
                  </div>
                  {!running && !finished && (
                    <Button onClick={() => runAct12(act1Report, 1, 'utility_scam')} variant="primary" fullWidth>RUN ACT 1</Button>
                  )}
                </div>
              </div>

              {(running || finished) && (
                <div className="border border-white/10 p-4 rounded-xl">
                  <ScanSteps steps={stepsList} activeIndex={stepIndex} />
                </div>
              )}

              {finished && (
                <div className="space-y-6">
                  <RiskResultView report={act1Report} source="browser" />
                  <HudPanel title="Attack Chain" tone="red">
                    <AttackChainView nodes={act1Report.attackChain} />
                  </HudPanel>
                  <div className="flex gap-4 border-t border-white/10 pt-4">
                    <Link to="/counterfactual" className="flex-1"><Button variant="outline" fullWidth>Counterfactual</Button></Link>
                    <Link to="/what-if" className="flex-1"><Button variant="outline" fullWidth>What-If</Button></Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {act === 2 && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0 font-mono text-[4rem] font-bold leading-none tracking-tighter text-cyan-400/20">02</div>
                <div className="w-full space-y-4 pt-2">
                  <h3 className="hud-title text-cyan-300">Safe Context</h3>
                  <div className="font-mono text-xs text-slate-300">
                    <p className="mb-2"><strong className="text-cyan-400">Message:</strong> {act2Scenario.message}</p>
                    <p className="mb-2"><strong className="text-cyan-400">URL:</strong> {act2Scenario.url || 'None'}</p>
                    <div className="mb-4">
                      <strong className="text-cyan-400">QR Payload lines:</strong>
                      <pre className="mt-2 whitespace-pre-wrap rounded border border-white/10 bg-white/5 p-3 font-code text-[10px] text-cyan-100">{act2Scenario.qrText}</pre>
                    </div>
                  </div>
                  {!running && !finished && (
                    <Button onClick={() => runAct12(act2Report, 2, 'legit_utility')} variant="primary" fullWidth>RUN ACT 2</Button>
                  )}
                </div>
              </div>

              {(running || finished) && (
                <div className="border border-white/10 p-4 rounded-xl">
                  <ScanSteps steps={stepsList} activeIndex={stepIndex} />
                </div>
              )}

              {finished && (
                <div className="space-y-6">
                  <RiskResultView report={act2Report} source="browser" />
                  <HudPanel title="Attack Chain" tone="green">
                    <AttackChainView nodes={act2Report.attackChain} />
                  </HudPanel>
                </div>
              )}
            </div>
          )}

          {act === 3 && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0 font-mono text-[4rem] font-bold leading-none tracking-tighter text-cyan-400/20">03</div>
                <div className="w-full space-y-4 pt-2">
                  <h3 className="hud-title text-cyan-300">Signals Connected</h3>
                  {!running && !finished && (
                    <Button onClick={runAct3} variant="primary" fullWidth>RUN ACT 3</Button>
                  )}
                </div>
              </div>

              {(running || finished) && (
                <div className="space-y-4">
                  {act3Sequence.steps.slice(0, stepIndex + 1).map((s) => (
                    <div key={s.id} className="animate-dash-flow border border-white/10 bg-cyan-950/20 p-4 rounded-xl">
                      <p className="hud-label mb-3 text-cyan-200">{s.label}</p>
                      <RiskGauge score={s.report.score} level={s.report.level} />
                    </div>
                  ))}
                </div>
              )}

              {finished && (
                <HudPanel tone="amber" title="SIGNALS CONNECTED" className="animate-in fade-in">
                  <p className="font-mono text-sm uppercase tracking-wide text-amber-200">{act3Sequence.finalText}</p>
                </HudPanel>
              )}
            </div>
          )}
        </HudPanel>

        <div className="mt-8 flex justify-center">
          <SimulationBadge />
        </div>
      </div>
    </PageShell>
  );
}
