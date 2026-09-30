import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Zap, Shield, ArrowUpRight } from 'lucide-react';
import type { RiskReport } from '../../types';
import { ThreatLevel } from '../soc';
import { levelTheme } from '../../lib/risk';

export interface HeroPaymentCardProps {
  report: RiskReport;
  className?: string;
}

export function HeroPaymentCard({ report, className = '' }: HeroPaymentCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const theme = levelTheme(report.level);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (report.score / 100) * circumference;

  return (
    <div
      data-testid="risk-score-card"
      data-score={report.score}
      data-level={report.level}
      className={`relative rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 shadow-glass shadow-glow-brand ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
          <span className="font-display text-xs font-semibold uppercase tracking-wider text-slate-300">
            Payment Interception · DEMO
          </span>
        </div>
        <ThreatLevel level={report.level} score={report.score} compact />
      </div>

      {/* Payee and Amount Preview */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-3 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">Flagship Intercept · QR001</p>
              <p className="text-sm font-semibold text-white truncate">Electricity Board Disconnection</p>
              <p className="font-mono text-xs text-slate-400 truncate">unknown-electricity@demo</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-2xl font-bold text-white">₹1,999</p>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-medium">
              HELD FOR REVIEW
            </span>
          </div>
        </div>
      </div>

      {/* Score Ring & Risk Level */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/[0.02] p-4 rounded-xl border border-white/5 mb-5">
        {/* SVG Score Ring */}
        <div className="sm:col-span-5 flex justify-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg width="112" height="112" viewBox="0 0 112 112" className="transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <motion.circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-red-500"
                strokeWidth="8"
                strokeDasharray={circumference}
                initial={shouldReduceMotion ? { strokeDashoffset } : { strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`font-display text-2xl font-bold tabular-nums ${theme.text}`}>
                {report.score}
              </span>
              <span className="text-[10px] font-mono text-slate-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Breakdown signals */}
        <div className="sm:col-span-7 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="truncate">Unverified payee handle</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="truncate">Immediate power cut threat</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Unsolicited payment link</span>
          </div>
        </div>
      </div>

      {/* Safety Bottom Banner */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Shield className="w-3.5 h-3.5 text-cyan-300" />
          <span className="font-display text-[11px] font-medium text-slate-300">PAYRAKSHA Engine Active</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
          SIMULATION · DEMO DATA
        </span>
      </div>
    </div>
  );
}
