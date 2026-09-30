import { useEffect, useMemo, useState } from 'react';
import type { RiskReport } from '../types';
import { PageShell } from '../components/layout';
import { Button, RiskGauge } from '../components/ui';
import { runSignalsConnected } from '../engine';
import { HudPanel, ScamConstellation, NextMoveCard, socToneForLevel, SOC_TONES } from '../components/soc';

export default function SignalsConnected() {
  const seq = useMemo(() => runSignalsConnected(), []);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [playing, setPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (playing) {
      const timer = setInterval(() => {
        setActiveStep((prev) => {
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
      setActiveStep((prev) => prev + 1);
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

  // The active report is the report of the latest revealed step (null when none revealed)
  const activeReport: RiskReport | null =
    activeStep >= 0 ? seq.steps[activeStep].report : null;

  const revealedCount = activeStep + 1;

  return (
    <PageShell title="Signals Connected">
      {/* Page heading keeps the literal text "SIGNALS CONNECTED" */}
      <h2 className="hud-title mb-2 text-cyan-300">SIGNALS CONNECTED</h2>
      <p className="hud-label mb-1 text-slate-500">
        INTELLIGENCE · SIMULATION
      </p>
      <p className="hud-label mb-4 text-slate-500">
        LINKED {revealedCount}/{seq.steps.length}
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
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

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left: Signal ladder — lg:col-span-5 */}
        <div className="lg:col-span-5 min-w-0">
          <HudPanel eyebrow="SIGNAL LADDER · SIMULATION" title="CUMULATIVE RISK SIGNALS" bodyClassName="p-3">
            <div className="flex flex-col gap-2">
              {seq.steps.map((step, i) => {
                const revealed = i <= activeStep;
                const tone = socToneForLevel(step.report.level);
                const toneClasses = SOC_TONES[tone];

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 rounded-sm border px-3 py-2 transition-all duration-500 ${
                      revealed
                        ? `${toneClasses.border} ${toneClasses.bg} opacity-100`
                        : 'border-slate-700/30 bg-slate-800/20 opacity-30'
                    }`}
                  >
                    {/* Step label */}
                    <div className="flex-1 min-w-0">
                      <p className={`hud-label truncate ${revealed ? toneClasses.text : 'text-slate-500'}`}>
                        {step.label}
                      </p>
                      <p className={`hud-label text-xs mt-0.5 ${revealed ? 'text-slate-400' : 'text-slate-600'}`}>
                        {step.report.patternName}
                      </p>
                    </div>

                    {/* Risk gauge (role=meter, aria-valuenow=score) */}
                    <div className="flex-shrink-0">
                      <RiskGauge
                        score={step.report.score}
                        level={step.report.level}
                        size={64}
                        showLabel={false}
                      />
                    </div>

                    {/* RISK score label */}
                    <div className="flex-shrink-0 text-right w-16">
                      <span className={`hud-num text-sm font-bold ${toneClasses.text}`}>
                        RISK {step.report.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </HudPanel>
        </div>

        {/* Right: Constellation + Next Move — lg:col-span-7 */}
        <div className="lg:col-span-7 flex flex-col gap-4 min-w-0">
          <HudPanel
            eyebrow="SIGNAL CONSTELLATION"
            title="ACTIVE THREAT INTELLIGENCE"
            bodyClassName="p-4"
          >
            <ScamConstellation report={activeReport} />
          </HudPanel>

          <NextMoveCard report={activeReport} />
        </div>
      </div>

      {/* Final text — shown only when all steps are revealed */}
      {activeStep === seq.steps.length - 1 && (
        <div className="mt-6 p-4 border border-cyan-400/20 rounded-sm bg-cyan-400/5 text-slate-200 text-sm text-center">
          {seq.finalText}
        </div>
      )}
    </PageShell>
  );
}
