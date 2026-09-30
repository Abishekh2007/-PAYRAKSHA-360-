import { LinkEvent } from '../../types/link';
import { socToneForLevel, SOC_TONES } from '../soc';
import { fmtINR } from '../../engine';

interface PhoneMirrorProps {
  event: LinkEvent | null;
}

export function PhoneMirror({ event }: PhoneMirrorProps) {
  if (!event) {
    return (
      <div className="mx-auto w-[280px] h-[580px] rounded-[2rem] border border-white/10 glass bg-navy-900/50 shadow-glass flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-[120px] h-[6px] bg-black/20 rounded-full absolute top-3" />
        <p className="text-slate-300 text-sm">Waiting for a phone check…</p>
        <p className="text-slate-400 text-sm">Scan a demo QR to start.</p>
      </div>
    );
  }

  const { device, at, recipient, amount, score, levelLabel, headline, decision, level } = event;
  const timeStr = new Date(at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const tone = socToneForLevel(level);
  const color = SOC_TONES[tone];

  const decisions: Record<string, string> = {
    pending: 'Checked',
    cancelled: 'Cancelled on phone',
    verify: 'Verifying payee',
    trusted: 'Asked a trusted contact',
    paid_demo: 'Paid (demo)'
  };
  const decisionLabel = decisions[decision] ?? decision;

  return (
    <div className="relative mx-auto w-[280px] h-[580px] rounded-[2rem] border border-white/20 glass shadow-card flex flex-col pt-10 pb-6 px-4 bg-gradient-to-b from-navy-800 to-navy-950 overflow-hidden">
      {/* Notch */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-center">
        <div className="w-[120px] h-[24px] bg-black/40 rounded-b-xl" />
      </div>

      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto mt-2 text-center no-scrollbar">
        {/* Device & Time */}
        <div className="space-y-1">
          <p className="hud-eyebrow text-slate-400">{device}</p>
          <p className="text-xs text-slate-500">Checked {timeStr}</p>
        </div>

        {/* Amount & Payee */}
        <div className="space-y-2">
          <div className="text-3xl font-display text-white">
            {amount !== null ? fmtINR(amount) : 'Amount not set'}
          </div>
          <div className="text-sm text-slate-300 bg-black/20 px-3 py-1 rounded-full inline-block">
            {recipient ?? 'Unknown payee'}
          </div>
        </div>

        {/* Score Ring */}
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-2 mt-4">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" className="stroke-white/10" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={color.hex}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 283} 283`}
            />
          </svg>
          <div className="flex flex-col items-center justify-center font-display space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">RISK</span>
            <span className={`text-3xl hud-num ${color.text} leading-none`}>{score}</span>
          </div>
        </div>

        {/* Level and Headline */}
        <div className="space-y-3 px-2">
          <div className={`inline-block px-3 py-1 rounded-full border ${color.border} ${color.bg} ${color.text} text-xs font-display font-medium uppercase tracking-wider`}>
            {levelLabel}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {headline}
          </p>
        </div>

        {/* Decision Chip */}
        <div className="mt-auto pt-4 flex flex-col items-center gap-3">
          <div className="bg-white/10 border border-white/10 px-4 py-2 rounded-full text-sm text-white">
            {decisionLabel}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-brand-aqua/80 bg-brand-aqua/10 px-2 py-0.5 rounded">
            SIMULATION
          </div>
        </div>
      </div>
    </div>
  );
}
