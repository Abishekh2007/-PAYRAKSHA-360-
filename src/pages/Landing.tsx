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
} from 'lucide-react';
import { ButtonLink } from '../components/ui';
import { RiskScoreCard } from '../components/risk';
import {
  HudPanel,
  StatusPill,
  ThreatLevel,
  KpiTile,
  simulatedFeed,
  socToneForLevel,
  SOC_TONES,
} from '../components/soc';
import { PaymentTwin } from '../components/soc';
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

function LevelColorText({ level, score }: { level: string; score: number }) {
  const tone = socToneForLevel(level);
  const t = SOC_TONES[tone];
  return <span className={`font-mono text-xs font-semibold ${t.text}`}>RISK {score}</span>;
}

export default function Landing() {
  const shouldReduceMotion = useReducedMotion();
  const flagship = flagshipReport();
  const now = Date.now();
  const feed = simulatedFeed({ now, count: 6 });

  const fadeIn = (delay: number) =>
    shouldReduceMotion ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay } };

  const fadeOnly = (delay: number) =>
    shouldReduceMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay } };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* ─── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: copy + CTAs */}
          <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
            <motion.div {...fadeIn(0)}>
              <p className="hud-eyebrow mb-3">// PRE-PAYMENT THREAT DEFENSE · SIMULATION</p>
              <h1
                aria-label="PAYRAKSHA 360"
                className="font-mono text-5xl md:text-7xl font-bold text-white leading-none tracking-tight"
              >
                PAYRAKSHA{' '}
                <span className="text-cyan-300 hud-glow">360</span>
              </h1>
            </motion.div>

            <motion.div {...fadeOnly(0.1)}>
              <p className="text-xl text-white font-semibold">Think Before You Pay.</p>
              <p className="text-lg text-slate-400 mt-1">An Explainable AI Pre-Payment Scam Defense System</p>
            </motion.div>

            <motion.div {...fadeOnly(0.2)} className="space-y-3">
              <blockquote className="font-mono font-semibold text-xl md:text-2xl text-white">
                <p>Don&apos;t detect fraud after the loss.</p>
                <p className="text-cyan-300 mt-2">Understand the risk before the payment.</p>
              </blockquote>
              <p className="text-sm text-slate-300 max-w-2xl">
                An explainable, privacy-conscious pre-payment safety layer that analyzes suspicious signals surrounding
                digital payments before money is sent.
              </p>
              <p className="text-sm tracking-[0.2em] text-slate-500 uppercase">
                Pause. Understand. Pay safely.
              </p>
            </motion.div>

            {/* CTA links */}
            <motion.div {...fadeOnly(0.3)} className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                <ButtonLink to="/simulation" variant="danger">🚨 TRY LIVE DEMO</ButtonLink>
                <ButtonLink to="/qr" icon={<QrCode />} variant="primary">SCAN QR</ButtonLink>
                <ButtonLink to="/technology" variant="outline">EXPLORE TECHNOLOGY</ButtonLink>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink to="/judge" variant="primary" size="sm">🏆 JUDGE MODE</ButtonLink>
                <ButtonLink to="/message" icon={<MessageSquare />} variant="primary" size="sm">ANALYZE MESSAGE</ButtonLink>
              </div>
            </motion.div>

            {/* KPI strip */}
            <motion.div {...fadeOnly(0.4)} className="grid grid-cols-3 gap-3">
              <KpiTile label="REAL PAYMENTS" value="0 real payments" tone="green" hint="SIMULATION ONLY" />
              <KpiTile label="DEMO SCENARIOS" value={`${scenarios.length} DEMO scenarios`} tone="cyan" hint="ALL SIMULATED" />
              <KpiTile label="ENGINES" value="Browser + API engines" tone="violet" hint="IN-BROWSER FIRST" />
            </motion.div>
          </div>

          {/* Right: live threat console panel */}
          <motion.div className="lg:col-span-5 min-w-0" {...fadeIn(0.2)}>
            <HudPanel
              eyebrow="MONITOR · SIMULATION"
              title="LIVE THREAT CONSOLE"
              tone="red"
              right={
                <StatusPill tone="red" pulse>
                  LIVE · SIMULATION
                </StatusPill>
              }
              bodyClassName="p-4 relative overflow-hidden"
            >
              {/* Scan line (none under reduced motion) */}
              {!shouldReduceMotion && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan-400/30 animate-scan z-10"
                />
              )}

              <div className="mb-3">
                <ThreatLevel level="HIGH" score={92} />
              </div>

              <ol aria-label="Live threat console feed" className="space-y-1.5 text-xs">
                {feed.map((evt) => {
                  const tone = socToneForLevel(evt.level);
                  const t = SOC_TONES[tone];
                  return (
                    <li
                      key={evt.id}
                      className="flex items-center gap-2 border border-cyan-400/10 rounded-sm px-2 py-1.5 bg-slate-900/40"
                    >
                      <span className="font-mono text-slate-500 shrink-0">{evt.time}</span>
                      <span className={`font-mono text-[10px] px-1 py-0.5 rounded-sm border shrink-0 ${t.text} ${t.border} ${t.bg}`}>
                        {evt.channel}
                      </span>
                      <span className="font-mono text-slate-300 truncate flex-1 min-w-0">{evt.title}</span>
                      <LevelColorText level={evt.level} score={evt.score} />
                    </li>
                  );
                })}
              </ol>
            </HudPanel>
          </motion.div>
        </div>
      </section>

      {/* ─── 2. HOW PAYRAKSHA THINKS ─────────────────────────────────────── */}
      <section className="mb-12">
        <HudPanel eyebrow="ANALYSIS PIPELINE · SIMULATION" title="HOW PAYRAKSHA THINKS" bodyClassName="p-4">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className="hud-panel px-3 py-2 text-center min-w-[80px]">
                  <div className="text-lg" aria-hidden="true">{step.emoji}</div>
                  <div className="hud-label mt-1">{step.label}</div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">{step.desc}</div>
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
                      strokeWidth="1"
                      strokeDasharray="6 6"
                      className={shouldReduceMotion ? '' : 'animate-dash-flow'}
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </HudPanel>
      </section>

      {/* ─── 3. FLAGSHIP CASE ────────────────────────────────────────────── */}
      <section className="mb-12">
        <HudPanel eyebrow="FLAGSHIP CASE · SIMULATION" title="QR001 · ELECTRICITY BILL SCAM" bodyClassName="p-4">
          <p className="text-sm text-slate-400 mb-4">QR001 · Electricity bill · ₹1,999 via WhatsApp (demo)</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <RiskScoreCard report={flagship} />
            <PaymentTwin report={flagship} compact />
          </div>
        </HudPanel>
      </section>

      {/* ─── 4. CAPABILITIES ─────────────────────────────────────────────── */}
      <section className="mb-12">
        <HudPanel eyebrow="CAPABILITIES · SIMULATION" title="DEFENSE MODULES" bodyClassName="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CAPABILITY_TILES.map((cap) => (
              <div
                key={cap.to}
                className="hud-panel px-3 py-3 flex flex-col items-center text-center gap-1"
              >
                <cap.icon className="w-5 h-5 text-cyan-300 mb-1" aria-hidden="true" />
                <p className="hud-title text-[11px]">{cap.title}</p>
                <p className="font-mono text-[10px] text-slate-500">{cap.desc}</p>
              </div>
            ))}
          </div>
        </HudPanel>
      </section>

      {/* ─── 5. SAFETY BAND ──────────────────────────────────────────────── */}
      <section className="mb-12 py-6 border border-red-500/20 bg-red-500/5 rounded-sm text-center">
        <p className="font-mono text-xs font-bold text-red-400 uppercase tracking-[0.28em]">
          NEVER REQUESTS: UPI PIN · OTP · PASSWORD · CVV · FULL CARD NUMBER
        </p>
        <p className="font-mono text-[10px] text-slate-500 mt-2 uppercase tracking-[0.16em]">
          SIMULATED HACKATHON DATA · {scenarios.length} SCENARIOS · {FACTOR_KEYS.length} RISK FACTORS · 0 REAL PAYMENTS
        </p>
      </section>

      {/* ─── Closing copy ────────────────────────────────────────────────── */}
      <section className="pb-24 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-slate-400 text-lg">
            Most fraud detection asks:{' '}
            <span className="font-bold text-slate-200">Was this transaction fraudulent?</span>
          </p>
          <p className="text-slate-400 pt-4 text-lg">
            We ask:{' '}
            <span className="font-bold text-slate-200">
              Does this payment situation make sense BEFORE you pay?
            </span>
          </p>
          <div className="pt-6 flex flex-col items-center gap-2 font-mono font-bold tracking-widest text-2xl">
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
