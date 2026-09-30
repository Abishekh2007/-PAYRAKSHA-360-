import { motion, useReducedMotion } from 'framer-motion';
import {
  QrCode,
  MessageSquare,
  Link as LinkIcon,
  HandCoins,
  Dna,
  GitBranch,
  Lightbulb,
  FlaskConical,
  UserCheck,
  Accessibility,
  ShieldAlert,
  Shield,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ButtonLink } from '../components/ui';
import {
  HudPanel,
  StatusPill,
  simulatedFeed,
  socToneForLevel,
  SOC_TONES,
  STATUS_LABEL,
  PaymentTwin,
} from '../components/soc';
import { DeviceLinkSection, HeroPaymentCard } from '../components/landing';
import { flagshipReport } from '../store/demoStore';
import { scenarios, FACTOR_KEYS } from '../engine';

const PIPELINE_STEPS = [
  { emoji: '📱', id: 'MESSAGE', label: 'MESSAGE', desc: 'Suspicious contact signal' },
  { emoji: '🌐', id: 'LINK', label: 'LINK', desc: 'URL reputation check' },
  { emoji: '📷', id: 'QR', label: 'QR', desc: 'QR destination scan' },
  { emoji: '🧠', id: 'CONTEXT', label: 'CONTEXT ENGINE', desc: 'Behavioural context' },
  { emoji: '🚨', id: 'RISK', label: 'RISK SCORE', desc: 'Explainable score' },
  { emoji: '🛡️', id: 'DECISION', label: 'DECISION', desc: 'Hold / Pass verdict' },
];

const CAPABILITY_TILES = [
  { icon: QrCode, to: '/qr', title: 'QR Scanner', desc: 'Decode QR before paying' },
  { icon: MessageSquare, to: '/message', title: 'Message Analysis', desc: 'Context from text signals' },
  { icon: LinkIcon, to: '/url', title: 'URL Checks', desc: 'Link reputation scoring' },
  { icon: HandCoins, to: '/payment', title: 'Payment Context', desc: 'Pressure pattern detection' },
  { icon: Dna, to: '/dna', title: 'Scam DNA', desc: 'Pattern fingerprinting' },
  { icon: GitBranch, to: '/attack-chain', title: 'Attack Chain', desc: 'Multi-step threat map' },
  { icon: Lightbulb, to: '/what-if', title: 'What-If Scenarios', desc: 'Counterfactual reasoning' },
  { icon: FlaskConical, to: '/lab', title: 'Scam Lab', desc: 'Simulate threat inputs' },
  { icon: UserCheck, to: '/trusted', title: 'Trusted Contacts', desc: 'Second-opinion alerts' },
  { icon: Accessibility, to: '/elder', title: 'Elder Mode', desc: 'Simplified safety UX' },
  { icon: ShieldAlert, to: '/threat-intel', title: 'Threat Intelligence', desc: 'Live pattern intel' },
  { icon: Shield, to: '/privacy', title: 'Privacy Controls', desc: 'On-device only processing' },
];

export default function Landing() {
  const shouldReduceMotion = useReducedMotion();
  const flagship = flagshipReport();
  const now = Date.now();
  const feed = simulatedFeed({ now, count: 6 });

  const fadeIn = (delay: number) =>
    shouldReduceMotion ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay } };

  const fadeOnly = (delay: number) =>
    shouldReduceMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay } };

  const stats = [
    {
      label: 'REAL PAYMENTS',
      value: '0 real payments',
      icon: ShieldCheck,
      bubbleBg: 'bg-green-500/10',
      bubbleText: 'text-green-400',
      textColor: 'text-green-400',
    },
    {
      label: 'DEMO SCENARIOS',
      value: `${scenarios.length} DEMO scenarios`,
      icon: FlaskConical,
      bubbleBg: 'bg-cyan-400/10',
      bubbleText: 'text-cyan-300',
      textColor: 'text-cyan-300',
    },
    {
      label: 'ENGINES',
      value: 'Browser + API engines',
      icon: Cpu,
      bubbleBg: 'bg-violet-400/10',
      bubbleText: 'text-violet-300',
      textColor: 'text-violet-300',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* ─── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="py-10 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-12 items-center">
          {/* Left Column: Copy, CTAs, Badges */}
          <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
            <motion.div {...fadeIn(0)} className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Pre-payment protection · DEMO
              </div>

              <h1
                aria-label="PAYRAKSHA 360"
                className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-none"
              >
                PAYRAKSHA <span className="text-gradient">360</span>
              </h1>

              <p className="font-display text-2xl sm:text-3xl font-semibold text-gradient">
                Think Before You Pay.
              </p>

              <p className="text-base sm:text-lg text-slate-300 font-medium">
                An Explainable AI Pre-Payment Scam Defense System
              </p>
            </motion.div>

            <motion.div {...fadeOnly(0.15)} className="space-y-3">
              <blockquote className="font-display font-semibold text-xl sm:text-2xl text-white">
                <p>Don&apos;t detect fraud after the loss.</p>
                <p className="text-cyan-300 mt-1">Understand the risk before the payment.</p>
              </blockquote>

              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                An explainable, privacy-conscious pre-payment safety layer that analyzes suspicious signals surrounding
                digital payments before money is sent.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div {...fadeOnly(0.25)} className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3 items-center">
                <ButtonLink to="/simulation" variant="primary" size="lg">🚨 TRY LIVE DEMO</ButtonLink>
                <ButtonLink to="/qr" icon={<QrCode className="w-4 h-4" />} variant="outline">SCAN QR</ButtonLink>
                <ButtonLink to="/technology" variant="ghost">EXPLORE TECHNOLOGY</ButtonLink>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <ButtonLink to="/judge" variant="ghost" size="sm">🏆 JUDGE MODE</ButtonLink>
                <ButtonLink to="/message" icon={<MessageSquare className="w-4 h-4" />} variant="outline" size="sm">ANALYZE MESSAGE</ButtonLink>
              </div>
            </motion.div>

            {/* Trust badges row */}
            <motion.div {...fadeOnly(0.35)} className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/10 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
                Explainable AI
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/10 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-cyan-300" />
                Privacy-first
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/10 text-slate-300">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" />
                Never asks for PIN or OTP
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/10 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                Checks before you pay
              </span>
            </motion.div>
          </div>

          {/* Right Column: Hero Payment Preview Card */}
          <motion.div className="lg:col-span-5 min-w-0" {...fadeIn(0.2)}>
            <HeroPaymentCard report={flagship} />
          </motion.div>
        </div>
      </section>

      {/* ─── 2. STAT CARDS ───────────────────────────────────────────────── */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="hud-panel glass p-5 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="hud-eyebrow text-slate-400">{stat.label}</p>
                  <p className={`font-display text-2xl sm:text-3xl font-bold mt-2 ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bubbleBg} ${stat.bubbleText} flex items-center justify-center shrink-0`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-[10px] font-mono tracking-wider uppercase text-slate-400">
                SIMULATED HACKATHON DATA
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. LIVE DEVICE LINK ─────────────────────────────────────────── */}
      <DeviceLinkSection />

      {/* ─── 4. LIVE THREAT FEED ─────────────────────────────────────────── */}
      <section className="mb-16">
        <HudPanel
          eyebrow="REAL-TIME SIGNALS · SIMULATION"
          title="LIVE THREAT CONSOLE ACTIVITY"
          tone="cyan"
          right={
            <StatusPill tone="red" pulse>
              LIVE · SIMULATION
            </StatusPill>
          }
          bodyClassName="p-5"
        >
          <ol aria-label="Live threat console feed" className="space-y-2.5">
            {feed.map((evt) => {
              const tone = socToneForLevel(evt.level);
              const t = SOC_TONES[tone];
              return (
                <li
                  key={evt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-slate-400 shrink-0">{evt.time}</span>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${t.text} ${t.border} ${t.bg}`}>
                      {evt.channel}
                    </span>
                    <span className="text-sm font-medium text-slate-200 truncate">{evt.title}</span>
                    <span className="text-xs text-slate-400 font-mono hidden md:inline truncate">{evt.handle}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <span className={`font-display text-xs font-bold px-2 py-0.5 rounded-md border ${t.text} ${t.border} ${t.bg}`}>
                      RISK {evt.score}
                    </span>
                    <StatusPill tone={tone} className="text-[10px]">
                      {STATUS_LABEL[evt.status]}
                    </StatusPill>
                  </div>
                </li>
              );
            })}
          </ol>
        </HudPanel>
      </section>

      {/* ─── 5. HOW PAYRAKSHA THINKS ─────────────────────────────────────── */}
      <section className="mb-16">
        <HudPanel eyebrow="ANALYSIS PIPELINE · SIMULATION" title="HOW PAYRAKSHA THINKS" bodyClassName="p-6">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className="hud-panel glass px-4 py-3 text-center min-w-[100px] rounded-xl border border-white/10">
                  <div className="text-2xl" aria-hidden="true">{step.emoji}</div>
                  <div className="font-display text-xs font-semibold text-white mt-1.5">{step.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{step.desc}</div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <svg
                    aria-hidden="true"
                    width="24"
                    height="12"
                    viewBox="0 0 24 12"
                    className="shrink-0 text-cyan-400/60"
                  >
                    <line
                      x1="0"
                      y1="6"
                      x2="24"
                      y2="6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className={shouldReduceMotion ? '' : 'animate-dash-flow'}
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </HudPanel>
      </section>

      {/* ─── 6. DIGITAL TWIN SIMULATION ──────────────────────────────────── */}
      <section className="mb-16">
        <HudPanel eyebrow="DIGITAL TWIN · SIMULATION" title="FLAGSHIP ATTACK CHAIN PREVIEW" bodyClassName="p-6">
          <p className="text-sm text-slate-400 mb-4">
            Interactive representation of signal flow through WhatsApp channel to unverified recipient.
          </p>
          <PaymentTwin report={flagship} />
        </HudPanel>
      </section>

      {/* ─── 7. DEFENSE MODULES ──────────────────────────────────────────── */}
      <section className="mb-16">
        <HudPanel eyebrow="CAPABILITIES · SIMULATION" title="DEFENSE MODULES" bodyClassName="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CAPABILITY_TILES.map((cap) => (
              <Link
                key={cap.to}
                to={cap.to}
                className="hud-panel glass p-4 rounded-xl border border-white/10 flex flex-col items-center text-center gap-2 hover:border-cyan-400/40 hover:bg-slate-800/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 text-cyan-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <cap.icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="font-display text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">{cap.title}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{cap.desc}</p>
              </Link>
            ))}
          </div>
        </HudPanel>
      </section>

      {/* ─── 8. SAFETY BAND ──────────────────────────────────────────────── */}
      <section className="mb-16 py-6 px-4 border border-white/10 bg-slate-900/60 rounded-2xl text-center shadow-glass">
        <p className="font-mono text-xs font-bold text-red-400 uppercase tracking-[0.24em]">
          NEVER REQUESTS: UPI PIN · OTP · PASSWORD · CVV · FULL CARD NUMBER
        </p>
        <p className="font-mono text-[11px] text-slate-400 mt-2 uppercase tracking-[0.14em]">
          SIMULATED HACKATHON DATA · {scenarios.length} SCENARIOS · {FACTOR_KEYS.length} RISK FACTORS · 0 REAL PAYMENTS
        </p>
      </section>

      {/* ─── 9. CLOSING COPY ─────────────────────────────────────────────── */}
      <section className="pb-24 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-slate-300 text-lg">
            Most fraud detection asks:{' '}
            <span className="font-bold text-white">Was this transaction fraudulent?</span>
          </p>
          <p className="text-slate-300 pt-2 text-lg">
            We ask:{' '}
            <span className="font-bold text-white">
              Does this payment situation make sense BEFORE you pay?
            </span>
          </p>
          <div className="pt-6 flex flex-col items-center gap-2 font-display font-bold tracking-widest text-2xl">
            <span className="text-cyan-400">PAUSE.</span>
            <span className="text-cyan-400">UNDERSTAND.</span>
            <span className="text-cyan-400">VERIFY.</span>
            <span className="text-green-400">PAY SAFELY.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
