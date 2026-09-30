import React from 'react';
import { PageShell } from '../components/layout';
import { weeklyCounts, categoryShares, topImpersonated, topSignals } from './threatintel/data';
import { scenarios, runScenarioLocal } from '../engine';
import { Link } from 'react-router-dom';
import { HudPanel, ThreatLevel } from '../components/soc';
import { ButtonLink } from '../components/ui/Button';

export default function ThreatIntel() {
  const engineData = scenarios.map((s) => {
    const report = runScenarioLocal(s.id);
    return {
      title: s.title,
      score: report.score,
      levelLabel: report.levelLabel,
      level: report.level, // needed for ThreatLevel component
      patternName: report.patternName,
    };
  });

  return (
    <PageShell
      eyebrow="INTELLIGENCE"
      title="THREAT INTELLIGENCE BOARD"
      subtitle="Illustrative numbers for the demo. Not real-world statistics."
      width="wide"
    >
      <div className="mx-auto space-y-6 pb-12 w-full p-4 sm:p-6 text-slate-300">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Weekly Scam Reports */}
          <HudPanel eyebrow="SIMULATED HACKATHON DATA" title="Weekly Scam Reports" className="flex flex-col">
            <div className="flex-1 space-y-3 pt-2">
              {weeklyCounts.map(d => {
                const total = d['Utility Scams'] + d['KYC Scams'] + d['Shopping Scams'] + d['Other'];
                return (
                  <div key={d.week} className="flex items-center gap-3 text-[10px] font-mono">
                    <div className="w-12 text-slate-400">{d.week}</div>
                    <div className="flex-1 flex h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div style={{ width: `${(d['Utility Scams']/total)*100}%` }} className="bg-red-500 border-r border-black" title={`Utility: ${d['Utility Scams']}`} />
                      <div style={{ width: `${(d['KYC Scams']/total)*100}%` }} className="bg-orange-500 border-r border-black" title={`KYC: ${d['KYC Scams']}`} />
                      <div style={{ width: `${(d['Shopping Scams']/total)*100}%` }} className="bg-amber-500 border-r border-black" title={`Shopping: ${d['Shopping Scams']}`} />
                      <div style={{ width: `${(d['Other']/total)*100}%` }} className="bg-slate-500" title={`Other: ${d['Other']}`} />
                    </div>
                    <div className="w-10 text-right text-cyan-300">{total}</div>
                  </div>
                );
              })}

              <div className="sr-only">
                <table>
                  <caption>Weekly Scam Reports</caption>
                  <tbody>
                    {weeklyCounts.map((d) => (
                      <tr key={d.week}>
                        <td>{d.week}</td>
                        <td>{d['Utility Scams']} Utility Scams</td>
                        <td>{d['KYC Scams']} KYC Scams</td>
                        <td>{d['Shopping Scams']} Shopping Scams</td>
                        <td>{d['Other']} Other</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </HudPanel>

          {/* Top Categories Grid */}
          <HudPanel eyebrow="SIMULATED HACKATHON DATA" title="Top Categories" className="flex flex-col">
            <div className="flex-1 grid grid-cols-2 gap-3 pt-2">
              {categoryShares.map(c => {
                const tones: Record<string, string> = {
                  'Utility': 'bg-red-500/10 text-red-500 border-red-500/20',
                  'Bank KYC': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
                  'Shopping': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                  'Other': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                };
                return (
                  <div key={c.name} className={`border p-4 flex flex-col justify-center items-center rounded-sm ${tones[c.name] || 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                    <div className="text-[10px] font-mono tracking-widest uppercase mb-1 opacity-80">{c.name}</div>
                    <div className="text-2xl font-mono font-semibold">{c.value}</div>
                  </div>
                );
              })}
              <div className="sr-only">
                <ul>
                  {categoryShares.map((d) => (
                    <li key={d.name}>{d.name}: {d.value}</li>
                  ))}
                </ul>
              </div>
            </div>
          </HudPanel>
        </div>

        {/* Top Impersonated Organisations Table */}
        <HudPanel eyebrow="SIMULATED HACKATHON DATA" title="Top Impersonated Organisations">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] uppercase tracking-wider text-slate-300">
              <thead className="bg-cyan-400/5 text-cyan-500">
                <tr>
                  <th className="px-4 py-3 font-normal border-b border-cyan-400/20">Organisation Type</th>
                  <th className="px-4 py-3 font-normal text-right border-b border-cyan-400/20 w-32">Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-400/10 border-b border-cyan-400/20">
                {topImpersonated.map((item) => (
                  <tr key={item.type} className="hover:bg-cyan-400/5 transition-colors">
                    <td className="px-4 py-3">{item.type}</td>
                    <td className="px-4 py-3 text-right">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HudPanel>

        {/* Top Signals Table */}
        <HudPanel eyebrow="SIMULATED HACKATHON DATA" title="Top Signals">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] uppercase tracking-wider text-slate-300">
              <thead className="bg-cyan-400/5 text-cyan-500">
                <tr>
                  <th className="px-4 py-3 font-normal border-b border-cyan-400/20">Signal</th>
                  <th className="px-4 py-3 font-normal text-right border-b border-cyan-400/20 w-32">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-400/10 border-b border-cyan-400/20">
                {topSignals.map((item) => (
                  <tr key={item.signal} className="hover:bg-cyan-400/5 transition-colors">
                    <td className="px-4 py-3">{item.signal}</td>
                    <td className="px-4 py-3 text-right">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HudPanel>

        {/* Engine Data Table */}
        <HudPanel eyebrow="SIMULATED HACKATHON DATA" title="Engine view of the demo scenarios">
          <p className="hud-label px-4 pt-3 pb-1 text-cyan-500">Computed live by the PAYRAKSHA engine on demo data</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] uppercase tracking-wider text-slate-300">
              <thead className="bg-cyan-400/5 text-cyan-500">
                <tr>
                  <th className="px-4 py-3 font-normal border-b border-cyan-400/20">Scenario</th>
                  <th className="px-4 py-3 font-normal text-center border-b border-cyan-400/20 w-24">Score</th>
                  <th className="px-4 py-3 font-normal border-b border-cyan-400/20 min-w-40">Level</th>
                  <th className="px-4 py-3 font-normal border-b border-cyan-400/20">Pattern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-400/10 border-b border-cyan-400/20">
                {engineData.map((d) => (
                  <tr key={d.title} className="hover:bg-cyan-400/5 transition-colors">
                    <td className="px-4 py-3">{d.title}</td>
                    <td className="px-4 py-3 text-center">{d.score}</td>
                    <td className="px-4 py-3 text-cyan-400">
                       <span className="sr-only">{d.levelLabel}</span>
                       <ThreatLevel level={d.level} score={null} live={false} />
                    </td>
                    <td className="px-4 py-3">{d.patternName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HudPanel>

        {/* Emerging Pattern Alerts */}
        <div className="grid gap-6 md:grid-cols-3">
          <HudPanel eyebrow="Emerging pattern alerts (simulated)" title="QR 'receive money' tricks" tone="red">
            <p className="mt-2 text-[11px] font-mono uppercase tracking-wide text-slate-300 border-l-2 border-red-500/50 pl-3 py-1">
              Sample: Scan to receive your cashback of ₹1,000
            </p>
            <div className="mt-4 border-t border-dashed border-red-500/20 pt-4">
              <Link to="/lab" className="hud-label text-red-400 hover:text-red-300 hover:underline">
                OPEN SCAM LAB &rarr;
              </Link>
            </div>
          </HudPanel>

          <HudPanel eyebrow="Emerging pattern alerts (simulated)" title="Fake customer care numbers" tone="red">
            <p className="mt-2 text-[11px] font-mono uppercase tracking-wide text-slate-300 border-l-2 border-red-500/50 pl-3 py-1">
              Sample: Dial 9876543210 for immediate airline refund
            </p>
            <div className="mt-4 border-t border-dashed border-red-500/20 pt-4">
              <Link to="/lab" className="hud-label text-red-400 hover:text-red-300 hover:underline">
                OPEN SCAM LAB &rarr;
              </Link>
            </div>
          </HudPanel>

          <HudPanel eyebrow="Emerging pattern alerts (simulated)" title="KYC expiry threats" tone="red">
            <p className="mt-2 text-[11px] font-mono uppercase tracking-wide text-slate-300 border-l-2 border-red-500/50 pl-3 py-1">
              Sample: Dear customer, your bank account will be blocked in 24 hrs. Update KYC.
            </p>
            <div className="mt-4 border-t border-dashed border-red-500/20 pt-4">
              <Link to="/lab" className="hud-label text-red-400 hover:text-red-300 hover:underline">
                OPEN SCAM LAB &rarr;
              </Link>
            </div>
          </HudPanel>
        </div>
      </div>
    </PageShell>
  );
}
