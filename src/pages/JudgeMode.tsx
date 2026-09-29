import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { Button, GlassCard, ScanSteps, RiskGauge, SimulationBadge } from '../components/ui';
import { RiskResultView, AttackChainView } from '../components/risk';
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
    <PageShell eyebrow="DEMO" title="🏆 JUDGE MODE" subtitle="Guided 3-act demo">
      <div className="max-w-4xl mx-auto space-y-8">
        <GlassCard>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold">Act {act} of 3</h2>
            <div className="flex gap-2">
              <Button onClick={handlePrev} disabled={act === 1} variant="outline">Previous</Button>
              <Button onClick={resetActState} variant="outline">Reset</Button>
              <Button onClick={handleNext} disabled={act === 3} variant="outline">Next</Button>
            </div>
          </div>
        </GlassCard>

        {act === 1 && (
          <div className="space-y-6">
            <GlassCard>
              <h3 className="font-bold mb-4">Scam Context</h3>
              <p className="mb-2"><strong>Message:</strong> {act1Scenario.message}</p>
              <p className="mb-2"><strong>URL:</strong> {act1Scenario.url}</p>
              <div className="mb-4">
                <strong>QR Payload lines:</strong>
                <pre className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">{act1Scenario.qrText}</pre>
              </div>
              {!running && !finished && (
                <Button onClick={() => runAct12(act1Report, 1, 'utility_scam')} variant="primary" fullWidth>RUN ACT 1</Button>
              )}
            </GlassCard>

            {(running || finished) && (
              <GlassCard>
                <ScanSteps steps={stepsList} activeIndex={stepIndex} />
              </GlassCard>
            )}

            {finished && (
              <div className="space-y-6">
                <RiskResultView report={act1Report} source="browser" />
                <GlassCard>
                  <h4 className="font-bold mb-4">Attack Chain</h4>
                  <AttackChainView nodes={act1Report.attackChain} />
                </GlassCard>
                <GlassCard>
                   <div className="flex gap-4">
                     <Link to="/counterfactual"><Button variant="outline">Counterfactual</Button></Link>
                     <Link to="/what-if"><Button variant="outline">What-If</Button></Link>
                   </div>
                </GlassCard>
              </div>
            )}
          </div>
        )}

        {act === 2 && (
          <div className="space-y-6">
            <GlassCard>
              <h3 className="font-bold mb-4">Safe Context</h3>
              <p className="mb-2"><strong>Message:</strong> {act2Scenario.message}</p>
              <p className="mb-2"><strong>URL:</strong> {act2Scenario.url || 'None'}</p>
              <div className="mb-4">
                <strong>QR Payload lines:</strong>
                <pre className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">{act2Scenario.qrText}</pre>
              </div>
              {!running && !finished && (
                <Button onClick={() => runAct12(act2Report, 2, 'legit_utility')} variant="primary" fullWidth>RUN ACT 2</Button>
              )}
            </GlassCard>

            {(running || finished) && (
              <GlassCard>
                <ScanSteps steps={stepsList} activeIndex={stepIndex} />
              </GlassCard>
            )}

            {finished && (
              <div className="space-y-6">
                <RiskResultView report={act2Report} source="browser" />
                <GlassCard>
                  <h4 className="font-bold mb-4">Attack Chain</h4>
                  <AttackChainView nodes={act2Report.attackChain} />
                </GlassCard>
              </div>
            )}
          </div>
        )}

        {act === 3 && (
          <div className="space-y-6">
            <GlassCard>
              <h3 className="font-bold mb-4">Signals Connected</h3>
              {!running && !finished && (
                <Button onClick={runAct3} variant="primary" fullWidth>RUN ACT 3</Button>
              )}
            </GlassCard>

            {(running || finished) && (
              <div className="space-y-4">
                {act3Sequence.steps.slice(0, stepIndex + 1).map((s) => (
                  <GlassCard key={s.id} className="animate-in fade-in slide-in-from-bottom-2">
                    <p className="mb-2 font-bold">{s.label}</p>
                    <RiskGauge score={s.report.score} level={s.report.level} />
                  </GlassCard>
                ))}
              </div>
            )}

            {finished && (
              <GlassCard className="animate-in fade-in">
                <h4 className="font-bold mb-2">SIGNALS CONNECTED</h4>
                <p>{act3Sequence.finalText}</p>
              </GlassCard>
            )}
          </div>
        )}

        <div className="flex justify-center mt-8">
          <SimulationBadge />
        </div>
      </div>
    </PageShell>
  );
}