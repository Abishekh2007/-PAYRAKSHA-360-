import React from 'react';
import { PageShell } from '../components/layout';
import { StatCard, SectionHeader, GlassCard, SimulationBadge } from '../components/ui';
import { useDemoStore } from '../store/demoStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const history = useDemoStore((s) => s.history);
  
  const numAnalyses = history.length;
  const highCautionCount = history.filter(r => r.report.level === 'HIGH' || r.report.level === 'HIGH_CAUTION').length;
  const avgScore = history.length > 0 ? Math.round(history.reduce((a, b) => a + b.report.score, 0) / history.length) : 0;
  const latestLabel = history.length > 0 ? history[0].label : 'None';

  const chartData = [...history].reverse().map((r, i) => ({
    name: `A${i + 1}`,
    score: r.report.score,
    label: r.label,
    level: r.report.levelLabel
  }));

  return (
    <PageShell
      title={<span className="flex items-center gap-3">Safety Dashboard <SimulationBadge /></span>}
      subtitle="Digital Safety Overview"
    >
      <div className="flex flex-col gap-8">
        <GlassCard>
          <SectionHeader title="Digital Safety Overview" eyebrow="SIMULATION / DEMO" />
          <div className="grid gap-6 md:grid-cols-5 mt-6">
            <StatCard label="Threats analyzed" value={42} />
            <StatCard label="High-risk situations" value={5} />
            <StatCard label="Suspicious URLs" value={8} />
            <StatCard label="Unknown recipients" value={12} />
            <StatCard label="Protected demo decisions" value={17} />
          </div>
        </GlassCard>

        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard>
            <SectionHeader title="This session" eyebrow="SIMULATION / DEMO" />
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-400">Analyses</dt>
                <dd className="text-2xl font-bold">{numAnalyses}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-400">High / High Caution</dt>
                <dd className="text-2xl font-bold">{highCautionCount}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-400">Average Score</dt>
                <dd className="text-2xl font-bold">{avgScore}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-400">Latest Label</dt>
                <dd className="text-lg font-bold">{latestLabel}</dd>
              </div>
            </dl>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Score History" eyebrow="SIMULATION / DEMO" />
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip wrapperClassName="dark text-black" />
                  <Bar dataKey="score" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
              <div className="sr-only">
                <ul>
                  {chartData.map((d) => (
                    <li key={d.name}>{d.name} - {d.score}</li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <SectionHeader title="Recent History" eyebrow="SIMULATION / DEMO" />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left font-mono text-sm leading-relaxed text-gray-300">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-3 pr-4 font-normal">Label</th>
                  <th className="py-3 pr-4 font-normal text-right">Score</th>
                  <th className="py-3 pr-4 font-normal">Level</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="py-2 pr-4">{record.label}</td>
                    <td className="py-2 pr-4 text-right">{record.report.score}</td>
                    <td className="py-2 pr-4">{record.report.levelLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex gap-4">
            <Link to="/report" className="text-brand-400 hover:text-brand-300">Open Report &rarr;</Link>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
