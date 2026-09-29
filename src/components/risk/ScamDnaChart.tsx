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

export interface ScamDnaChartProps {
  dna: DnaStrand[];
  variant?: 'bars' | 'radar';
  className?: string;
}

export function ScamDnaChart({ dna, variant = 'bars', className = '' }: ScamDnaChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const maxPercent = useMemo(() => {
    return Math.max(0, ...dna.map((d) => d.percent));
  }, [dna]);

  const renderTextLegend = () => (
    <ul className="space-y-3 mt-4 w-full">
      {dna.map((d, index) => {
        const isDominant = d.percent === maxPercent && maxPercent > 0;
        const colorClass = d.percent >= 70 ? 'bg-risk-high' : d.percent >= 40 ? 'bg-risk-caution' : 'bg-brand-500';
        return (
          <li key={d.key} className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-slate-200">
                <span className="font-medium">{d.label}</span>
                {isDominant && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-risk-high/20 text-risk-high border border-risk-high/40 rounded">
                    Dominant
                  </span>
                )}
              </div>
              <span className="font-mono text-slate-300">{d.percent}%</span>
            </div>
            {variant === 'bars' && (
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={shouldAnimate ? { width: 0 } : { width: `${d.percent}%` }}
                  animate={{ width: `${d.percent}%` }}
                  transition={{ duration: 0.6, delay: index * 0.04, ease: 'easeOut' }}
                  className={`h-full rounded-full ${colorClass}`}
                />
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
        <div className="w-full h-64" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dna}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Scam DNA"
                dataKey="percent"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.4}
                isAnimationActive={shouldAnimate}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {renderTextLegend()}
    </div>
  );
}
