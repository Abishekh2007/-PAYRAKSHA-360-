import { useMemo, useState } from 'react';
import { PageShell } from '../components/layout';
import { SectionHeader, SimulationBadge, RiskGauge, Toggle, Button } from '../components/ui';
import { HudPanel, ThreatLevel } from '../components/soc';
import { analyzeLocal, whatIfInput, scenarioBook } from '../engine';

export default function WhatIf() {
  const [activeIds, setActiveIds] = useState<string[]>([]);

  const seq = scenarioBook.sequences.whatIf;
  const controls = seq.controls;

  const base = useMemo(() => analyzeLocal(whatIfInput([])), []);
  const current = useMemo(() => analyzeLocal(whatIfInput(activeIds)), [activeIds]);

  const handleToggle = (id: string, checked: boolean) => {
    if (checked) {
      setActiveIds(prev => [...prev, id]);
    } else {
      setActiveIds(prev => prev.filter(x => x !== id));
    }
  };

  const applyAll = () => setActiveIds(controls.map(c => c.id));
  const reset = () => setActiveIds([]);

  const delta = current.score - base.score;
  const allActive = activeIds.length === controls.length;

  const droppedContributions = useMemo(() => {
    const list = [];
    for (const b of base.contributions) {
      const c = current.contributions.find(x => x.key === b.key);
      const diff = b.points - (c ? c.points : 0);
      if (diff > 0) {
        list.push({ label: b.label, diff });
      }
    }
    return list;
  }, [base, current]);

  return (
    <PageShell title="What-If Safety Simulator" eyebrow="LAB" width="wide" actions={<SimulationBadge />}>
      <h2 className="hud-title text-cyan-300 mb-6">WHAT WOULD MAKE THIS PAYMENT SAFER?</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <HudPanel eyebrow="SIGNAL SWITCHBOARD" className="lg:col-span-5">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 mb-2">
              <Button onClick={applyAll} variant="outline" size="sm">APPLY ALL</Button>
              <Button onClick={reset} variant="ghost" size="sm">RESET</Button>
            </div>

            {controls.map(control => (
              <div key={control.id} className="flex justify-between items-center p-3 border border-cyan-400/15 rounded-sm bg-cyan-400/5">
                <div>
                  <div className="hud-label text-slate-200">{control.label}</div>
                  <div className="font-mono text-[10px] text-slate-500 mt-1">{control.from} → {control.to}</div>
                </div>
                <Toggle
                  label={control.label}
                  checked={activeIds.includes(control.id)}
                  onChange={checked => handleToggle(control.id, checked)}
                />
              </div>
            ))}
          </div>
        </HudPanel>

        <HudPanel eyebrow="LIVE READOUT" className="lg:col-span-7 flex flex-col items-center gap-6">
          <ThreatLevel level={current.level} score={current.score} live={false} />

          <div className="flex flex-col md:flex-row justify-center gap-8 items-center w-full">
            <div className="flex flex-col items-center">
              <div className="hud-eyebrow text-slate-500 mb-4">BASE STATE</div>
              <RiskGauge score={base.score} level={base.level} size={150} />
            </div>

            <div className="flex flex-col items-center">
              <div className="hud-eyebrow text-slate-500 mb-4">SIMULATED STATE</div>
              <RiskGauge score={current.score} level={current.level} size={150} />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <span
              data-testid="delta-chip"
              className={`font-mono text-xs px-3 py-1 rounded-sm border font-semibold tracking-wider ${
                delta < 0
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : delta > 0
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
              }`}
            >
              Δ {delta > 0 ? '+' : ''}{delta} POINTS
            </span>
            <span className="hud-label">
              {base.levelLabel} → {current.levelLabel}
            </span>
          </div>

          {current.score < base.score && (
            <div className="mt-2 p-4 border border-cyan-400/20 rounded-sm bg-cyan-400/10 text-sm w-full">
              <p className="mb-2 hud-title text-cyan-300">Risk context changed because suspicious signals were removed.</p>
              <ul className="list-disc pl-5 font-mono text-[11px] uppercase tracking-wide text-cyan-300/80 space-y-1">
                {droppedContributions.map(c => (
                  <li key={c.label}>
                    {c.label}: −{c.diff}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {allActive && (
            <div className="mt-2 p-4 border border-green-500/20 rounded-sm bg-green-500/10 text-green-400 font-mono text-[11px] uppercase tracking-wide w-full text-center">
              {seq.finalText}
            </div>
          )}
        </HudPanel>
      </div>
    </PageShell>
  );
}
