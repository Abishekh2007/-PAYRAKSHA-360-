import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { DnaStrand } from '../../types';
import type { Severity } from '../../types';

export interface ScamDnaChartProps {
  dna: DnaStrand[];
  variant?: 'bars' | 'radar';
  /** Show the labelled list under the chart (off when a bars chart sits next to the radar). */
  legend?: boolean;
  className?: string;
}

function severityBarColor(severity: Severity | string | undefined): string {
  switch (severity) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#22d3ee';
    default: return '#475569';
  }
}

function segmentFill(pct: number, segIdx: number): string {
  const threshold = (pct / 100) * 10;
  if (segIdx < threshold) {
    if (pct >= 70) return '#ef4444';
    if (pct >= 40) return '#f59e0b';
    if (pct > 0) return '#22d3ee';
  }
  return '#1e293b';
}

export function ScamDnaChart({ dna, variant = 'bars', className = '', legend = true }: ScamDnaChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const maxPercent = useMemo(() => {
    return Math.max(0, ...dna.map((d) => d.percent));
  }, [dna]);

  const renderTextLegend = () => (
    <ul className="space-y-2 mt-4 w-full font-mono">
      {dna.map((d, index) => {
        const isDominant = d.percent === maxPercent && maxPercent > 0;
        const barColor = severityBarColor((d as any).severity);
        return (
          <li key={d.key} className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="hud-label text-[10px]">{d.label}</span>
                {isDominant && (
                  <span className="px-1 py-0.5 text-[8px] uppercase font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded-sm">
                    Dominant
                  </span>
                )}
              </div>
              <span className="hud-num text-[11px] text-slate-300">{d.percent}%</span>
            </div>
            {variant === 'bars' && (
              <div className="flex gap-px" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={shouldAnimate ? { opacity: 0 } : {}}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.04 + i * 0.02 }}
                    className="flex-1 h-2 rounded-sm"
                    style={{ backgroundColor: segmentFill(d.percent, i) }}
                  />
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div data-testid="scam-dna" data-variant={variant} className={`flex flex-col items-center ${className}`}>
      {variant === 'radar' && dna.length > 0 && (
        <div className="w-full h-72" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="62%" margin={{ top: 16, right: 40, bottom: 16, left: 40 }} data={dna}>
              <PolarGrid stroke="#cbd5e1" />
              <PolarAngleAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Scam DNA"
                dataKey="percent"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
                isAnimationActive={shouldAnimate}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {legend && renderTextLegend()}
    </div>
  );
}
