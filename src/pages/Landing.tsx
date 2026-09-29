import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { QrCode, MessageSquare, Link as LinkIcon, HandCoins, Dna, GitBranch, Lightbulb, FlaskConical, UserCheck, Accessibility, ShieldAlert, Shield } from 'lucide-react';
import { SimulationBadge, GlassCard, Button, ButtonLink } from '../components/ui';
import { RiskScoreCard } from '../components/risk';
import { HeroScene } from '../components/three';
import { FLAGSHIP_SCENARIO_ID, runScenarioLocal, FACTOR_KEYS, scenarios } from '../engine';

export default function Landing() {
  const shouldReduceMotion = useReducedMotion();
  const report = runScenarioLocal(FLAGSHIP_SCENARIO_ID);

  const modules = [
    { to: '/qr', icon: QrCode, text: 'QR Scanner' },
    { to: '/message', icon: MessageSquare, text: 'Message Analysis' },
    { to: '/url', icon: LinkIcon, text: 'URL Checks' },
    { to: '/payment', icon: HandCoins, text: 'Payment Context' },
    { to: '/dna', icon: Dna, text: 'Scam DNA' },
    { to: '/attack-chain', icon: GitBranch, text: 'Attack Chain' },
    { to: '/what-if', icon: Lightbulb, text: 'What-If Scenarios' },
    { to: '/lab', icon: FlaskConical, text: 'Scam Lab' },
    { to: '/trusted', icon: UserCheck, text: 'Trusted Contacts' },
    { to: '/elder', icon: Accessibility, text: 'Elder Mode' },
    { to: '/threat-intel', icon: ShieldAlert, text: 'Threat Intelligence' },
    { to: '/privacy', icon: Shield, text: 'Privacy Controls' },
  ];

  const animateProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };
  const animateFadeProp = shouldReduceMotion ? {} : {
    initial: { opacity: 0 },
    animate: { opacity: 1 }
  };

  return (
    <div className="landing-page max-w-[360px] md:max-w-none mx-auto md:w-full overflow-x-hidden">
      <section className="hero flex flex-col md:flex-row gap-8 py-16 px-4 md:px-8">
        <div className="flex-1">
          <motion.h1
            {...animateProps}
            className="text-4xl md:text-6xl font-display font-bold mb-4"
          >
            PAYRAKSHA 360
          </motion.h1>
          <motion.p className="text-xl mb-2" {...animateFadeProp} transition={{ delay: 0.1 }}>
            Think Before You Pay.
          </motion.p>
          <motion.p className="text-lg text-neutral-400 mb-6" {...animateFadeProp} transition={{ delay: 0.2 }}>
            An Explainable AI Pre-Payment Scam Defense System
          </motion.p>

          <motion.div className="flex flex-col gap-4 mb-8" {...animateFadeProp} transition={{ delay: 0.3 }}>
            <blockquote className="font-display font-semibold text-2xl md:text-4xl text-white">
              <p>Don't detect fraud after the loss.</p>
              <p className="text-brand-400 mt-2">Understand the risk before the payment.</p>
            </blockquote>
            <p className="text-neutral-400 max-w-2xl mt-4">
              An explainable, privacy-conscious pre-payment safety layer that analyzes suspicious signals surrounding digital payments before money is sent.
            </p>
            <p className="text-sm tracking-[0.2em] text-neutral-500 uppercase mt-4">Pause. Understand. Pay Safely.</p>
          </motion.div>

          <motion.div className="flex flex-col gap-4" {...animateFadeProp} transition={{ delay: 0.4 }}>
            <div className="flex flex-wrap gap-4">
              <ButtonLink to="/simulation" variant="danger">🚨 TRY LIVE DEMO</ButtonLink>
              <ButtonLink to="/qr" icon={<QrCode />} variant="primary">SCAN QR</ButtonLink>
              <ButtonLink to="/technology" variant="outline">EXPLORE TECHNOLOGY</ButtonLink>
            </div>
            <div className="flex flex-wrap gap-4">
              <ButtonLink to="/judge" variant="primary" size="sm">🏆 JUDGE MODE</ButtonLink>
              <ButtonLink to="/message" icon={<MessageSquare />} variant="primary" size="sm">ANALYZE MESSAGE</ButtonLink>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 min-h-[300px]">
          <HeroScene />
        </div>
      </section>

      <section className="px-4 md:px-8 mb-16">
        <GlassCard>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <p className="text-sm text-neutral-400 mb-2">QR001 · Electricity bill · ₹1,999 via WhatsApp (demo)</p>
              <RiskScoreCard report={report} />
            </div>
            <div>
              <ButtonLink to="/qr?demo=QR001" variant="outline">See it in QR Shield</ButtonLink>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="px-4 md:px-8 mb-16 overflow-x-auto">
        <motion.div
          className="flex gap-4 min-w-max text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {['Signals', 'Contextual Risk Engine', 'Scam Pattern', 'Explainable Score', 'Scam DNA', 'Attack Chain', 'Safe Action'].map((step, i) => (
            <motion.div
              key={step}
              className="flex items-center"
              variants={shouldReduceMotion ? {} : {
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 }
              }}
            >
              <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center whitespace-nowrap">
                {step}
              </div>
              {i < 6 && <span className="mx-4 text-neutral-600">→</span>}
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="px-4 md:px-8 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modules.map(mod => (
            <Link key={mod.to} to={mod.to} className="block group">
              <GlassCard className="h-full flex flex-col items-center justify-center text-center p-6 hover:bg-neutral-800 transition-colors">
                <mod.icon className="w-8 h-8 mb-4 opacity-70 group-hover:opacity-100 transition-all" />
                <span className="text-sm font-medium">{mod.text}</span>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-8 mb-16">
        <div className="flex justify-center flex-wrap gap-8 py-8 bg-neutral-900/50 rounded-xl">
          <div className="text-center">
            <p className="text-4xl font-mono font-bold text-brand-400">{scenarios.length}</p>
            <p className="text-sm text-neutral-400 mt-2">Demo Scenarios</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-mono font-bold text-brand-400">{FACTOR_KEYS.length}</p>
            <p className="text-sm text-neutral-400 mt-2">Risk Factors</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-mono font-bold text-brand-400">0 real payments</p>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8 mb-16 text-center">
        <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
          <SimulationBadge />
          <span className="text-sm text-neutral-300">
            No real payments. No UPI PIN, OTP or password requests. No bank connections.
          </span>
        </div>
      </section>

      <section className="px-4 md:px-8 pb-32 text-center">
        <div className="max-w-2xl mx-auto space-y-6 text-xl md:text-2xl font-display">
          <p className="text-neutral-400">Most fraud detection asks: <span className="font-bold text-neutral-200">Was this transaction fraudulent?</span></p>
          <p className="text-neutral-400 pt-8">We ask: <span className="font-bold text-neutral-200">Does this payment situation make sense BEFORE you pay?</span></p>
          <div className="pt-8 flex flex-col items-center gap-2 text-3xl md:text-4xl font-bold tracking-wider">
            <span className="text-brand-400">PAUSE.</span>
            <span className="text-brand-400">UNDERSTAND.</span>
            <span className="text-brand-400">VERIFY.</span>
            <span className="text-green-500">PAY SAFELY.</span>
          </div>
        </div>
      </section>
    </div>
  );
}