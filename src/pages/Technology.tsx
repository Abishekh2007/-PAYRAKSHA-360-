import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { PageShell } from '../components/layout';
import { SimulationBadge } from '../components/ui';
import { HudPanel, StatusPill } from '../components/soc';
import { Server, Globe, FileText, Monitor, ShieldAlert, BrainCircuit, Activity, Cpu, ArrowRight } from 'lucide-react';
import { FACTOR_KEYS, FACTOR_LABELS, FACTOR_WEIGHTS, BASELINE, LEVELS, ENGINE_NAME, ENGINE_VERSION } from '../engine';
import { getBackendHealth } from '../services/api';
import type { BackendHealth } from '../types';

export default function Technology() {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const reduce = useReducedMotion();

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
      eyebrow="SYSTEM"
      icon={<Cpu className="h-8 w-8" />}
      subtitle="The architecture and scoring engine behind PAYRAKSHA 360."
      width="wide"
      actions={<SimulationBadge />}
    >
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-4">
          {/* System Architecture Flow */}
          <HudPanel
            eyebrow="SYSTEM ARCHITECTURE"
            title="Data-Flow Diagram"
            right={<StatusPill tone="cyan" pulse>LIVE</StatusPill>}
          >
            <div className="p-4">
              {/* Flow diagram — flex row on md+, column on mobile */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
                {/* Node: Browser Engine */}
                <div className="flex flex-col items-center gap-1 border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 rounded-2xl min-w-[140px]">
                  <Globe className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                  <span className="hud-title text-cyan-200 text-center">BROWSER ENGINE</span>
                  <span className="text-[10px] text-slate-400 font-mono text-center">In-browser fallback</span>
                </div>

                {/* Connector: ↔ with dash-flow */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <svg
                    width="60"
                    height="24"
                    viewBox="0 0 60 24"
                    aria-hidden="true"
                    className="hidden md:block"
                  >
                    <line
                      x1="0" y1="12" x2="60" y2="12"
                      stroke="#22d3ee"
                      strokeOpacity="0.5"
                      strokeWidth="1.5"
                      strokeDasharray="6 6"
                      className={reduce ? '' : 'animate-dash-flow'}
                    />
                    <polygon points="54,8 60,12 54,16" fill="#22d3ee" fillOpacity="0.5" />
                    <polygon points="6,8 0,12 6,16" fill="#22d3ee" fillOpacity="0.5" />
                  </svg>
                  <span className="text-cyan-400 font-mono text-xs text-center">parity-tested:</span>
                  <span className="text-cyan-400 font-mono text-[10px] text-center">same scores</span>
                </div>

                {/* Node: FastAPI Engine */}
                <div className="flex flex-col items-center gap-1 border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 rounded-2xl min-w-[140px]">
                  <Server className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                  <span className="hud-title text-cyan-200 text-center">FASTAPI ENGINE</span>
                  <span className="text-[10px] text-slate-400 font-mono text-center">Python primary</span>
                </div>

                {/* Connector: → */}
                <div className="flex flex-col items-center shrink-0">
                  <svg
                    width="36"
                    height="24"
                    viewBox="0 0 36 24"
                    aria-hidden="true"
                    className="hidden md:block"
                  >
                    <line
                      x1="0" y1="12" x2="36" y2="12"
                      stroke="#22d3ee"
                      strokeOpacity="0.4"
                      strokeWidth="1.5"
                      strokeDasharray="6 6"
                      className={reduce ? '' : 'animate-dash-flow'}
                    />
                    <polygon points="30,8 36,12 30,16" fill="#22d3ee" fillOpacity="0.4" />
                  </svg>
                  <ArrowRight className="h-4 w-4 text-cyan-400 md:hidden" aria-hidden="true" />
                </div>

                {/* Node: Risk Report */}
                <div className="flex flex-col items-center gap-1 border border-amber-400/25 bg-amber-400/5 px-4 py-3 rounded-2xl min-w-[120px]">
                  <FileText className="h-5 w-5 text-amber-300" aria-hidden="true" />
                  <span className="hud-title text-amber-200 text-center">RISK REPORT</span>
                  <span className="text-[10px] text-slate-400 font-mono text-center">Scored + explained</span>
                </div>

                {/* Connector: → */}
                <div className="flex flex-col items-center shrink-0">
                  <svg
                    width="36"
                    height="24"
                    viewBox="0 0 36 24"
                    aria-hidden="true"
                    className="hidden md:block"
                  >
                    <line
                      x1="0" y1="12" x2="36" y2="12"
                      stroke="#22d3ee"
                      strokeOpacity="0.4"
                      strokeWidth="1.5"
                      strokeDasharray="6 6"
                      className={reduce ? '' : 'animate-dash-flow'}
                    />
                    <polygon points="30,8 36,12 30,16" fill="#22d3ee" fillOpacity="0.4" />
                  </svg>
                  <ArrowRight className="h-4 w-4 text-cyan-400 md:hidden" aria-hidden="true" />
                </div>

                {/* Node: Console UI */}
                <div className="flex flex-col items-center gap-1 border border-violet-400/25 bg-violet-400/5 px-4 py-3 rounded-2xl min-w-[120px]">
                  <Monitor className="h-5 w-5 text-violet-300" aria-hidden="true" />
                  <span className="hud-title text-violet-200 text-center">CONSOLE UI</span>
                  <span className="text-[10px] text-slate-400 font-mono text-center">React 19 + SOC kit</span>
                </div>
              </div>

              <p className="mt-6 text-sm text-slate-300">
                Same engine, two runtimes: the Python port is checked case by case against the reference engine (golden parity tests).
              </p>
            </div>
          </HudPanel>

          {/* Tech Stack Grid */}
          <HudPanel eyebrow="TECH STACK" title="Components">
            <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <Globe className="h-4 w-4 text-cyan-300" />, title: 'React 19', desc: 'Vite, TypeScript 5.9' },
                { icon: <Activity className="h-4 w-4 text-cyan-300" />, title: 'Tailwind 3.4', desc: 'SOC design tokens' },
                { icon: <Activity className="h-4 w-4 text-cyan-300" />, title: 'Framer Motion', desc: 'Animations & motion' },
                { icon: <Activity className="h-4 w-4 text-cyan-300" />, title: 'Zustand 5', desc: 'Demo state store' },
                { icon: <Server className="h-4 w-4 text-cyan-300" />, title: 'FastAPI Python', desc: 'Primary (with in-browser fallback)' },
                { icon: <BrainCircuit className="h-4 w-4 text-cyan-300" />, title: 'TF-IDF + LR ML', desc: 'Synthetic demo corpus' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-white/10 bg-white/5 px-3 py-3 rounded-2xl flex items-start gap-3"
                >
                  <span className="mt-0.5 shrink-0" aria-hidden="true">{item.icon}</span>
                  <div>
                    <p className="hud-title text-cyan-100">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </HudPanel>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Status */}
          <HudPanel eyebrow="RUNTIME" title="Live Status" right={<StatusPill tone={health ? 'green' : 'amber'}>{health ? 'ONLINE' : 'FALLBACK'}</StatusPill>}>
            <div className="p-4 text-slate-300 text-sm">
              {health ? (
                <p>Python engine online · {health.engine.name} v{health.engine.version} · runtime {health.engine.runtime} · ML {health.ml.available ? health.ml.model : 'unavailable'}</p>
              ) : (
                <p>Backend offline: the in-browser engine is active</p>
              )}
            </div>
          </HudPanel>

          {/* Machine Learning */}
          <HudPanel eyebrow="ML MODULE" title="Machine Learning">
            <div className="p-4">
              <p className="text-sm text-slate-300">
                TF-IDF + logistic regression on a small synthetic demo corpus, shown separately, never changes the score
              </p>
            </div>
          </HudPanel>

          {/* Explainable Scoring Engine */}
          <HudPanel eyebrow="SCORING ENGINE" title="Explainable Scoring">
            <div className="p-4">
              <p className="rounded-2xl border border-white/10 bg-white/5 p-3 font-mono text-sm text-slate-300 text-center">
                score = baseline + Σ weight × signal value + combination bonuses, clamped to 0-100
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-cyan-400/15">
                      <th className="py-2 hud-label">Factor</th>
                      <th className="py-2 text-right hud-label">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-cyan-400/10">
                      <td className="py-2">Base Risk (Baseline)</td>
                      <td className="py-2 text-right font-mono">{BASELINE}</td>
                    </tr>
                    {FACTOR_KEYS.map((key) => (
                      <tr key={key} className="border-b border-cyan-400/10">
                        <td className="py-2">{FACTOR_LABELS[key]}</td>
                        <td className="py-2 text-right font-mono">{FACTOR_WEIGHTS[key]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-6 hud-title text-white">Risk Levels</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-cyan-400/15">
                      <th className="py-2 hud-label">Level</th>
                      <th className="py-2 text-right hud-label">Score Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEVELS.map((lvl) => (
                      <tr key={lvl.id} className="border-b border-cyan-400/10">
                        <td className="py-2 font-medium">{lvl.label}</td>
                        <td className="py-2 text-right font-mono">{lvl.min} - {lvl.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </HudPanel>

          {/* Safety Principles */}
          <HudPanel eyebrow="SAFETY" title="Privacy & Safety Principles">
            <div className="p-4">
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  'demo only',
                  'no credentials',
                  'no real payments',
                  'no real contacts',
                  'simulated intelligence',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </HudPanel>
        </div>
      </div>
    </PageShell>
  );
}
