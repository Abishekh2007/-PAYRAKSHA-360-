import { useMemo, useState } from 'react';
import { PageShell } from '../components/layout';
import { SectionHeader, SimulationBadge, GlassCard, RiskGauge, Button } from '../components/ui';
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
    <PageShell title="Counterfactual Demo" actions={<SimulationBadge />}>
      <SectionHeader title="COUNTERFACTUAL SIMULATION" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Steps</span>
            <Button onClick={handleReset} variant="ghost" size="sm">RESET</Button>
          </div>

          {cf.steps.map((step, i) => {
            const isNext = i === activeStep + 1;
            const isDone = i <= activeStep;

            return (
              <GlassCard key={step.id} className="flex flex-col gap-4">
                <div className="font-bold text-lg">{step.prompt}</div>
                <Button
                  disabled={!isNext}
                  variant={isDone ? 'ghost' : 'outline'}
                  onClick={() => setActiveStep(i)}
                >
                  {step.button}
                </Button>
              </GlassCard>
            );
          })}
        </div>

        <div className="flex flex-col gap-6">
          <GlassCard className="flex flex-col items-center gap-6">
            <div className="text-sm text-slate-400 font-bold uppercase tracking-wider">Main Score</div>

            <RiskGauge
              score={currentReport.score}
              level={currentReport.level}
              size={200}
            />

            <div className="text-center font-bold">
              {currentReport.levelLabel}
            </div>

            {activeStep === cf.steps.length - 1 && (
              <div className="mt-4 p-4 border border-green-500/20 rounded bg-green-500/10 text-green-200">
                {cf.finalText}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <div className="font-bold mb-4">Score Timeline</div>
            <div className="text-brand-300 font-mono mb-4 text-center text-lg">{timelineText}</div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip wrapperClassName="bg-slate-900 border-slate-700" labelClassName="text-slate-400" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ fill: '#38bdf8', strokeWidth: 0, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}