import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../components/layout';
import { SectionHeader, SimulationBadge, GlassCard, RiskGauge, Button } from '../components/ui';
import { runSignalsConnected } from '../engine';

export default function SignalsConnected() {
  const seq = useMemo(() => runSignalsConnected(), []);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [playing, setPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (playing) {
      const timer = setInterval(() => {
        setActiveStep(prev => {
          if (prev >= seq.steps.length - 1) {
            return prev;
          }
          return prev + 1;
        });
      }, 700);
      return () => clearInterval(timer);
    }
  }, [playing, seq.steps.length]);

  useEffect(() => {
    if (playing && activeStep >= seq.steps.length - 1) {
      setPlaying(false);
    }
  }, [playing, activeStep, seq.steps.length]);

  const addNextSignal = () => {
    if (activeStep < seq.steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const playAll = () => {
    if (activeStep === seq.steps.length - 1) {
      setActiveStep(-1);
    }
    setPlaying(true);
  };

  const handleReset = () => {
    setActiveStep(-1);
    setPlaying(false);
  };

  return (
    <PageShell title="Signals Connected" actions={<SimulationBadge />}>
      <SectionHeader title="SIGNALS CONNECTED" />

      <div className="flex flex-wrap gap-4 mt-6 mb-12">
        <Button
          onClick={addNextSignal}
          disabled={activeStep >= seq.steps.length - 1 || playing}
        >
          ADD NEXT SIGNAL
        </Button>
        <Button
          onClick={playAll}
          disabled={playing || activeStep >= seq.steps.length - 1}
          variant="outline"
        >
          PLAY ALL
        </Button>
        <Button onClick={handleReset} variant="ghost">
          RESET
        </Button>
      </div>

      <div className="relative">
        {/* Background dark line */}
        <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-slate-800" />

        {/* Lit up line for active progress */}
        {activeStep >= 0 && (
          <div
            className="absolute left-[15px] top-0 w-[2px] bg-brand-500 shadow-[0_0_8px_#38bdf8] transition-all duration-700 ease-in-out"
            style={{ height: `${(activeStep / (seq.steps.length - 1)) * 100}%` }}
          />
        )}

        <div className="relative z-10 flex flex-col gap-12">
          {seq.steps.map((step, i) => {
            const revealed = i <= activeStep;
            const delta = i === 0 ? null : step.report.score - seq.steps[i - 1].report.score;

            return (
              <div
                key={step.id}
                className={`flex gap-6 items-center transition-all duration-500 ${
                  revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
                }`}
              >
                {/* Node */}
                <div
                  className={`w-[32px] h-[32px] flex-shrink-0 rounded-full border-4 border-slate-900 transition-colors duration-500 ${
                    revealed ? 'bg-brand-500 shadow-[0_0_12px_#38bdf8]' : 'bg-slate-700'
                  }`}
                />

                <GlassCard className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">{step.label}</div>
                    {delta !== null && (
                      <div className="text-brand-300 mt-1 font-mono text-sm">
                        +{delta} points combined
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <RiskGauge score={step.report.score} level={step.report.level} size={100} showLabel={false} />
                    <div className="text-sm font-bold mt-2">{step.report.levelLabel}</div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>

      {activeStep === seq.steps.length - 1 && (
        <div className="mt-12 p-6 border border-brand-500/30 rounded bg-brand-500/10 text-brand-100 font-bold text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          {seq.finalText}
        </div>
      )}
    </PageShell>
  );
}