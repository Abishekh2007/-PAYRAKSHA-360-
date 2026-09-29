import { useMemo, useState } from 'react';
import { PageShell } from '../components/layout';
import { SectionHeader, SimulationBadge, GlassCard, RiskGauge, Toggle, Button } from '../components/ui';
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
    <PageShell title="What-If Safety Simulator" actions={<SimulationBadge />}>
      <SectionHeader title="WHAT WOULD MAKE THIS PAYMENT SAFER?" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 mb-4">
            <Button onClick={applyAll} variant="outline">APPLY ALL</Button>
            <Button onClick={reset} variant="ghost">RESET</Button>
          </div>

          {controls.map(control => (
            <GlassCard key={control.id} className="flex justify-between items-center">
              <div>
                <div className="font-bold">{control.label}</div>
                <div className="text-sm text-slate-400">{control.from} → {control.to}</div>
              </div>
              <Toggle
                label={control.label}
                checked={activeIds.includes(control.id)}
                onChange={checked => handleToggle(control.id, checked)}
              />
            </GlassCard>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <GlassCard className="flex flex-col items-center gap-6">
            <div className="flex justify-center gap-8 items-center w-full">
              <div className="flex flex-col items-center">
                <div className="text-sm text-slate-400 mb-2">Base</div>
                <RiskGauge score={base.score} level={base.level} size={150} />
              </div>

              <div className="flex flex-col items-center">
                <div className="text-sm text-slate-400 mb-2">Current</div>
                <RiskGauge score={current.score} level={current.level} size={150} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="chip bg-slate-800">
                {delta < 0 ? `−${Math.abs(delta)}` : `+${delta}`} points
              </span>
              <span className="text-sm">
                {base.levelLabel} → {current.levelLabel}
              </span>
            </div>

            {current.score < base.score && (
              <div className="mt-4 p-4 border border-brand-500/20 rounded bg-brand-500/5 text-sm w-full">
                <p className="mb-2 font-bold">Risk context changed because suspicious signals were removed.</p>
                <ul className="list-disc pl-5">
                  {droppedContributions.map(c => (
                    <li key={c.label}>
                      {c.label}: −{c.diff}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {allActive && (
              <div className="mt-4 p-4 border border-green-500/20 rounded bg-green-500/10 text-green-200">
                {seq.finalText}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}