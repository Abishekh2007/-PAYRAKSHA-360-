import { useReducedMotion } from 'framer-motion';
import { Smartphone, QrCode, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ButtonLink } from '../ui';

export function DeviceLinkSection() {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      num: '01',
      title: 'Open RakshaPay on your phone',
      desc: 'Launch the companion mobile safety app or scan from your preferred UPI client.',
      icon: Smartphone,
    },
    {
      num: '02',
      title: 'Scan the QR the console shows',
      desc: 'Pair your active session in one tap with zero credentials or personal data shared.',
      icon: QrCode,
    },
    {
      num: '03',
      title: 'See the threat level on both screens — before any payment',
      desc: 'Get instant pre-payment risk explanation on both your phone and security console.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="mb-16">
      <div className="hud-panel glass p-6 sm:p-8 lg:p-10 rounded-2xl relative overflow-hidden border border-white/10 shadow-glass">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              DUAL-SCREEN DEFENCE · DEMO
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              LIVE DEVICE LINK
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl">
              Bridge your mobile payment app with the PAYRAKSHA 360 intelligence console to inspect threats in real time before approving any transaction.
            </p>
          </div>

          <div className="shrink-0">
            <ButtonLink to="/link" variant="primary" size="lg" icon={<Smartphone className="w-4 h-4" />}>
              LINK YOUR PHONE
            </ButtonLink>
          </div>
        </div>

        {/* Visual Device Link Display: Phone Mock <---> Dotted Link <---> Console Mock */}
        <div className="grid lg:grid-cols-12 gap-8 items-center my-8 bg-slate-950/70 p-6 sm:p-8 rounded-2xl border border-white/5">
          {/* Phone mock (RakshaPay) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[280px] rounded-3xl border-2 border-slate-700/80 bg-slate-950 p-4 shadow-2xl relative overflow-hidden">
              {/* Notch & status bar */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-3 px-1">
                <span className="font-mono">09:41</span>
                <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto" />
                <span className="font-mono">5G 100%</span>
              </div>

              {/* Phone app header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white">
                    RP
                  </div>
                  <span className="font-display text-xs font-semibold text-white">RakshaPay</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 font-medium">
                  DEMO
                </span>
              </div>

              {/* Transaction details */}
              <div className="space-y-3">
                <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
                  <p className="text-[11px] text-slate-400">Payment Request</p>
                  <p className="text-sm font-semibold text-white mt-0.5">Paying Electricity Board Demo</p>
                  <p className="text-xl font-bold font-display text-white mt-1">₹1,999</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">unknown-electricity@demo</p>
                </div>

                {/* Risk Warning Pill */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-2.5 text-center">
                  <div className="inline-flex items-center gap-1.5 text-orange-400 text-xs font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>HIGH CAUTION · RISK 70</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1">
                    Unverified biller &amp; high pressure message detected.
                  </p>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  className="w-full py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold transition-colors"
                >
                  Cancel payment
                </button>
              </div>
            </div>
          </div>

          {/* Center: Animated connecting bridge */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-4">
            <div className="hidden lg:flex flex-col items-center gap-2 w-full">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80">
                LIVE SYNC
              </span>
              <svg width="100%" height="24" viewBox="0 0 120 24" className="text-cyan-400 overflow-visible">
                <line
                  x1="0"
                  y1="12"
                  x2="120"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  className={shouldReduceMotion ? '' : 'animate-dash-flow'}
                />
                <circle cx="60" cy="12" r="4" fill="currentColor" />
              </svg>
              <span className="text-[9px] text-slate-400 text-center">
                Encrypted telemetry
              </span>
            </div>
            <div className="lg:hidden flex items-center justify-center gap-2 py-2">
              <span className="text-xs text-cyan-300 font-mono">↕ LIVE SYNC ↕</span>
            </div>
          </div>

          {/* Console Mock */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-display text-xs font-semibold text-white">PAYRAKSHA 360 CONSOLE</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300">CONNECTED</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>PAIRED DEVICE</span>
                    <span className="text-slate-300">Phone (RakshaPay)</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>TARGET AMOUNT</span>
                    <span className="text-white font-semibold">₹1,999</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>STATUS</span>
                    <span className="text-amber-400 font-medium">INTERCEPTED</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-400/5 border border-cyan-400/15">
                  <p className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold mb-1">
                    Explainable AI Verdict
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Disconnection urgency pattern + unlisted utility account identified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Steps */}
        <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          {steps.map((step) => (
            <div key={step.num} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-300 flex items-center justify-center font-display font-bold text-xs shrink-0">
                  {step.num}
                </div>
                <p className="font-display text-sm font-semibold text-white leading-tight">
                  {step.title}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400 font-medium">
            SIMULATION · no real money moves
          </p>
        </div>
      </div>
    </section>
  );
}
