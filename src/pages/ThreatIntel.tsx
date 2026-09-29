import React from 'react';
import { PageShell } from '../components/layout';
import { SectionHeader, SimulationBadge, GlassCard } from '../components/ui';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { weeklyCounts, categoryShares, topImpersonated, topSignals } from './threatintel/data';
import { scenarios, runScenarioLocal } from '../engine';
import { Link } from 'react-router-dom';

export default function ThreatIntel() {
  const engineData = scenarios.map((s) => {
    const report = runScenarioLocal(s.id);
    return {
      title: s.title,
      score: report.score,
      levelLabel: report.levelLabel,
      patternName: report.patternName,
    };
  });

  return (
    <PageShell
      eyebrow="SIMULATED HACKATHON DATA"
      title="Threat Intelligence"
      subtitle="Illustrative numbers for the demo. Not real-world statistics."
    >
      <div className="flex flex-col gap-8">
        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard className="flex flex-col h-[400px]">
            <SectionHeader title="Weekly Scam Reports" eyebrow="SIMULATED HACKATHON DATA" />
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyCounts}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="week" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip wrapperClassName="dark text-black" />
                  <Area type="monotone" dataKey="Utility Scams" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} />
                  <Area type="monotone" dataKey="KYC Scams" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.8} />
                  <Area type="monotone" dataKey="Shopping Scams" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                  <Area type="monotone" dataKey="Other" stackId="1" stroke="#64748b" fill="#64748b" fillOpacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
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
          </GlassCard>

          <GlassCard className="flex flex-col h-[400px]">
            <SectionHeader title="Top Categories" eyebrow="SIMULATED HACKATHON DATA" />
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryShares} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label>
                    {categoryShares.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip wrapperClassName="dark text-black" />
                </PieChart>
              </ResponsiveContainer>
              <div className="sr-only">
                <ul>
                  {categoryShares.map((d) => (
                    <li key={d.name}>{d.name}: {d.value}</li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <SectionHeader title="Top Impersonated Organisations" eyebrow="SIMULATED HACKATHON DATA" />
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm leading-relaxed text-gray-300">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-3 pr-4 font-normal">Organisation Type</th>
                  <th className="py-3 pr-4 font-normal text-right">Reports</th>
                </tr>
              </thead>
              <tbody>
                {topImpersonated.map((item) => (
                  <tr key={item.type} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="py-2 pr-4">{item.type}</td>
                    <td className="py-2 pr-4 text-right">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Top Signals" eyebrow="SIMULATED HACKATHON DATA" />
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm leading-relaxed text-gray-300">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-3 pr-4 font-normal">Signal</th>
                  <th className="py-3 pr-4 font-normal text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {topSignals.map((item) => (
                  <tr key={item.signal} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="py-2 pr-4">{item.signal}</td>
                    <td className="py-2 pr-4 text-right">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Engine view of the demo scenarios" subtitle="Computed live by the PAYRAKSHA engine on demo data" />
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm leading-relaxed text-gray-300">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-3 pr-4 font-normal">Scenario</th>
                  <th className="py-3 pr-4 font-normal text-right">Score</th>
                  <th className="py-3 pr-4 font-normal">Level</th>
                  <th className="py-3 pr-4 font-normal">Pattern</th>
                </tr>
              </thead>
              <tbody>
                {engineData.map((d) => (
                  <tr key={d.title} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="py-2 pr-4">{d.title}</td>
                    <td className="py-2 pr-4 text-right">{d.score}</td>
                    <td className="py-2 pr-4">{d.levelLabel}</td>
                    <td className="py-2 pr-4">{d.patternName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard glow="HIGH">
            <SectionHeader title="QR 'receive money' tricks" eyebrow="Emerging pattern alerts (simulated)" />
            <p className="mt-2 text-sm text-gray-300">Sample: Scan to receive your cashback of ₹1,000</p>
            <Link to="/lab" className="mt-4 block text-brand-400 hover:text-brand-300">Open Scam Lab &rarr;</Link>
          </GlassCard>
          <GlassCard glow="HIGH">
            <SectionHeader title="Fake customer care numbers" eyebrow="Emerging pattern alerts (simulated)" />
            <p className="mt-2 text-sm text-gray-300">Sample: Dial 9876543210 for immediate airline refund</p>
            <Link to="/lab" className="mt-4 block text-brand-400 hover:text-brand-300">Open Scam Lab &rarr;</Link>
          </GlassCard>
          <GlassCard glow="HIGH">
            <SectionHeader title="KYC expiry threats" eyebrow="Emerging pattern alerts (simulated)" />
            <p className="mt-2 text-sm text-gray-300">Sample: Dear customer, your bank account will be blocked in 24 hrs. Update KYC.</p>
            <Link to="/lab" className="mt-4 block text-brand-400 hover:text-brand-300">Open Scam Lab &rarr;</Link>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}
