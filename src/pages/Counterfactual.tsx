import { useMemo, useState } from 'react';
import { PageShell } from '../components/layout';
import { SimulationBadge, RiskGauge, Button } from '../components/ui';
import { HudPanel, SOC_TONES, socToneForLevel } from '../components/soc';
import { runCounterfactual } from '../engine';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Counterfactual() {
  const cf = useMemo(() => runCounterfactual(), []);
  const [activeStep, setActiveStep] = useState<number>(-1);

  const currentReport = activeStep === -1 ? cf.base : cf.steps[activeStep].report;

  const handleReset = () => setActiveStep(-1);

  const revealedSteps = [cf.base, ...cf.steps.slice(0, activeStep + 1).map(s => s.report)];

  const chartData = revealedSteps.map((report, i) => ({
    name: i === 0 ? 'Base' : `Step ${i}`,
    score: report.score,
  }));

  const timelineText = revealedSteps.map(r => r.score).join(' → ');

  return (
    <PageShell title="Counterfactual Demo" eyebrow="LAB" width="wide" actions={<SimulationBadge />}>
      <h2 className="hud-title text-cyan-300 mb-6">COUNTERFACTUAL SIMULATION</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <HudPanel eyebrow="ATTACK vs DEFENCE" title="SIMULATION STEPS">
            <div className="flex justify-end mb-4">
              <Button onClick={handleReset} variant="ghost" size="sm">RESET</Button>
            </div>

            <div className="flex flex-col gap-3">
              {cf.steps.map((step, i) => {
                const isNext = i === activeStep + 1;
                const isDone = i <= activeStep;
                const prevScore = i === 0 ? cf.base.score : cf.steps[i - 1].report.score;
                const curScore = step.report.score;
                const curLevel = step.report.level;
                const diff = curScore - prevScore;
                
                const tone = socToneForLevel(curLevel);
                const t = SOC_TONES[tone];

                return (
                  <div key={step.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-cyan-400/15 bg-cyan-400/5 rounded-sm gap-4">
                    <div className="font-mono text-xs text-slate-300 max-w-sm leading-relaxed">
                      {step.prompt}
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <div className={`hud-num font-bold ${t.text}`}>RISK {curScore}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                           {diff < 0 ? '↓' : diff > 0 ? '↑' : ''} {Math.abs(diff)} PTS
                        </div>
                      </div>
                      
                      <Button
                        disabled={!isNext}
                        variant={isDone ? 'ghost' : 'outline'}
                        onClick={() => setActiveStep(i)}
                      >
                        {step.button}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </HudPanel>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <HudPanel eyebrow="TELEMETRY" title="CURRENT STATE" className="flex flex-col items-center gap-6">
            <div className="hud-eyebrow text-slate-500 mt-2">MAIN SCORE</div>

            <RiskGauge
              score={currentReport.score}
              level={currentReport.level}
              size={200}
            />

            <div className="text-center hud-title text-cyan-300">
              {currentReport.levelLabel}
            </div>

            {activeStep === cf.steps.length - 1 && (
              <div className="mt-2 p-4 border border-green-500/20 rounded-sm bg-green-500/10 text-green-400 font-mono text-[11px] uppercase tracking-wide w-full text-center">
                {cf.finalText}
              </div>
            )}
          </HudPanel>

          <HudPanel eyebrow="HISTORY" title="SCORE TIMELINE">
            <div className="text-cyan-300 font-mono mb-6 text-center tracking-widest bg-cyan-900/20 border border-cyan-800/30 py-2 rounded-sm text-sm">
              {timelineText}
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip wrapperClassName="bg-slate-900 border-slate-700" labelClassName="text-slate-400" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ fill: '#22d3ee', strokeWidth: 0, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </HudPanel>
        </div>
      </div>
    </PageShell>
  );
}
