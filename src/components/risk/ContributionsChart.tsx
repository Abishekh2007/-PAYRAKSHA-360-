import { useState, useMemo } from 'react';
import type { Contribution } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface ContributionsChartProps { contributions: Contribution[]; score: number; clamped?: boolean; className?: string }

export function ContributionsChart({ contributions, score, clamped, className = '' }: ContributionsChartProps) {
  const [showAll, setShowAll] = useState(false);

  const sortedContributions = useMemo(() => {
    const baseline = contributions.find(c => c.kind === 'baseline');
    const others = contributions.filter(c => c.kind !== 'baseline').sort((a, b) => b.points - a.points);
    return baseline ? [baseline, ...others] : others;
  }, [contributions]);

  const totalPoints = sortedContributions.reduce((sum, c) => sum + (c.points || 0), 0);

  const visibleContributions = showAll ? sortedContributions : sortedContributions.filter(c => c.points > 0);
  const hiddenCount = sortedContributions.length - visibleContributions.length;

  const chartData = visibleContributions.map(c => ({
    label: c.label.length > 20 ? c.label.slice(0, 18) + '…' : c.label,
    fullLabel: c.label,
    points: c.points,
    kind: c.kind,
  }));

  return (
    <div data-testid="contributions" className={`space-y-4 ${className}`}>
      {/* recharts bar chart */}
      {chartData.length > 0 && (
        <div className="w-full h-48" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#123047" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: '#0a1628',
                  border: '1px solid rgba(34,211,238,0.15)',
                  borderRadius: '2px',
                  color: '#cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: 11,
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#22d3ee' }}
                cursor={{ fill: 'rgba(34,211,238,0.05)' }}
              />
              <Bar dataKey="points" radius={[2, 2, 0, 0]} maxBarSize={32}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.points > 0 ? '#22d3ee' : '#22c55e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* terminal list */}
      <ul className="space-y-1">
        {visibleContributions.map((c) => (
          <li key={c.key} className="flex items-baseline justify-between gap-2 text-xs font-mono py-1 border-b border-slate-800/50">
            <span className="text-slate-300 truncate">{c.label}</span>
            <span className={`shrink-0 font-semibold ${c.points > 0 ? 'text-cyan-300' : 'text-green-400'}`}>
              +{c.points}
            </span>
          </li>
        ))}
      </ul>

      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="hud-eyebrow text-cyan-400 hover:text-cyan-300 px-2 py-1"
        >
          Show all factors (+{hiddenCount} items)
        </button>
      )}

      {showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className="hud-eyebrow text-cyan-400 hover:text-cyan-300 px-2 py-1"
        >
          Hide zero-point factors
        </button>
      )}

      <div className="pt-3 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <div className="font-mono text-sm font-semibold text-slate-200">Total: {totalPoints}</div>
        {clamped && <div className="text-xs text-slate-400 font-mono italic">(score clamped to 0-100)</div>}
      </div>
    </div>
  );
}
