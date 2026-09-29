import React, { useEffect, useState } from 'react';
import { PageShell } from '../components/layout';
import { Badge, GlassCard, SectionHeader, SimulationBadge } from '../components/ui';
import { EngineCore } from '../components/three';
import { Server, ShieldAlert, BrainCircuit, Activity, Cpu } from 'lucide-react';
import { FACTOR_KEYS, FACTOR_LABELS, FACTOR_WEIGHTS, BASELINE, LEVELS, ENGINE_NAME, ENGINE_VERSION } from '../engine';
import { getBackendHealth } from '../services/api';
import type { BackendHealth } from '../types';

export default function Technology() {
  const [health, setHealth] = useState<BackendHealth | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const h = await getBackendHealth();
        if (mounted) setHealth(h);
      } catch (e) {
        if (mounted) setHealth(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <PageShell
      title="Technology"
      icon={<Cpu className="h-8 w-8" />}
      subtitle="The architecture and scoring engine behind PAYRAKSHA 360."
      actions={<SimulationBadge />}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <GlassCard>
            <SectionHeader title="Architecture" icon={<Server className="h-5 w-5 text-brand-400" />} />
            <div className="mt-4 flex flex-col items-center gap-4 text-center md:flex-row md:justify-around">
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                <strong>React SPA</strong>
                <div className="text-sm text-slate-400">Vite, TypeScript</div>
              </div>
              <div className="text-brand-400">↔</div>
              <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-4">
                <strong>FastAPI Python engine</strong>
                <div className="text-sm text-slate-400">Primary (with in-browser fallback)</div>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-300">
              Same engine, two runtimes: the Python port is checked case by case against the reference engine (golden parity tests).
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge tone="neutral">React 19</Badge>
              <Badge tone="neutral">TypeScript 5.9</Badge>
              <Badge tone="neutral">Tailwind 3.4</Badge>
              <Badge tone="neutral">Framer Motion</Badge>
              <Badge tone="neutral">Zustand 5</Badge>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Live Status" icon={<Activity className="h-5 w-5 text-brand-400" />} />
            <div className="mt-4 text-slate-300">
              {health ? (
                <p>Python engine online · {health.engine.name} v{health.engine.version} · runtime {health.engine.runtime} · ML {health.ml.available ? health.ml.model : 'unavailable'}</p>
              ) : (
                <p>Backend offline: the in-browser engine is active</p>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Machine Learning" icon={<BrainCircuit className="h-5 w-5 text-brand-400" />} />
            <p className="mt-4 text-slate-300 gap-2">
              TF-IDF + logistic regression on a small synthetic demo corpus, shown separately, never changes the score
            </p>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Safety Principles" icon={<ShieldAlert className="h-5 w-5 text-risk-high" />} />
            <ul className="mt-4 list-inside list-disc space-y-2 text-slate-300">
              <li>demo only</li>
              <li>no credentials</li>
              <li>no real payments</li>
              <li>no real contacts</li>
              <li>simulated intelligence</li>
            </ul>
          </GlassCard>
        </div>

        <div className="space-y-8">
          <GlassCard>
            <SectionHeader title="Explainable Scoring Engine" icon={<Activity className="h-5 w-5 text-brand-400" />} />

            <p className="mt-4 rounded bg-slate-800 p-3 font-mono text-sm text-slate-300">
              score = baseline + Σ weight × signal value + combination bonuses, clamped to 0-100
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-2 text-white">Factor</th>
                    <th className="py-2 text-right text-white">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-2">Base Risk (Baseline)</td>
                    <td className="py-2 text-right">{BASELINE}</td>
                  </tr>
                  {FACTOR_KEYS.map((key) => (
                    <tr key={key} className="border-b border-slate-800">
                      <td className="py-2">{FACTOR_LABELS[key]}</td>
                      <td className="py-2 text-right">{FACTOR_WEIGHTS[key]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-6 font-display text-lg font-bold text-white">Risk Levels</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-2 text-white">Level</th>
                    <th className="py-2 text-right text-white">Score Range</th>
                  </tr>
                </thead>
                <tbody>
                  {LEVELS.map((lvl) => (
                    <tr key={lvl.id} className="border-b border-slate-800">
                      <td className="py-2 font-medium">{lvl.label}</td>
                      <td className="py-2 text-right">{lvl.min} - {lvl.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="3D Visualization" />
            <div className="relative mt-4 h-64 w-full rounded-lg bg-black">
              <EngineCore />
            </div>
            <div className="mt-4 text-xs text-slate-400">
              <h4 className="font-bold text-slate-300">3D model credits</h4>
              <p className="mt-2 text-slate-400">
                Both models come from the three.js repository on GitHub: https://github.com/mrdoob/three.js (`examples/models/gltf/`).
                They are served locally from `public/models/`; nothing is fetched from a CDN at runtime.
              </p>
              <ul className="mt-2 space-y-1">
                <li>
                  <strong className="text-slate-300">RobotExpressive.glb</strong>: Tomás Laulhé (Quaternius), modifications by Don McCurdy
                  (Licence: CC0 1.0). Used for PAYRAKSHA guardian robot (animations: Idle, Wave, Yes, No, ThumbsUp, Dance, ...)
                </li>
                <li>
                  <strong className="text-slate-300">PrimaryIonDrive.glb</strong>: Mike Murdock
                  (Licence: CC BY 4.0). Used for Risk engine core on the technology and simulation pages
                </li>
              </ul>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}
