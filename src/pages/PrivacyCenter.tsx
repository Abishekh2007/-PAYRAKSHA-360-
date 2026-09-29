import React, { useState } from 'react';
import { PageShell } from '../components/layout';
import { GlassCard, Button, SimulationBadge } from '../components/ui';
import { useDemoStore } from '../store/demoStore';
import { ShieldCheck, Trash2, ArrowRight } from 'lucide-react';

export default function PrivacyCenter() {
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    resetDemo();
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <PageShell
      title="Privacy Center"
      icon={<ShieldCheck className="h-8 w-8" />}
      subtitle="How PAYRAKSHA 360 handles your data in this demo."
      actions={<SimulationBadge />}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard variant="strong" className="border-risk-high/40 bg-risk-high/10">
          <h2 className="mb-4 font-display text-xl font-bold text-white">NEVER REQUEST:</h2>
          <ul className="space-y-2 text-slate-300">
            <li>❌ UPI PIN</li>
            <li>❌ OTP</li>
            <li>❌ Password</li>
            <li>❌ CVV</li>
            <li>❌ Full card number</li>
          </ul>
          <p className="mt-4 font-medium text-risk-high">No financial credentials are shared.</p>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 font-display text-xl font-bold text-white">What PAYRAKSHA looks at</h2>
          <ul className="list-inside list-disc space-y-2 text-slate-300">
            <li>message text you paste</li>
            <li>link text (never opened)</li>
            <li>QR contents</li>
            <li>payment context (recipient id, amount, source)</li>
          </ul>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 font-display text-xl font-bold text-white">What it never does</h2>
          <ul className="list-inside list-disc space-y-2 text-slate-300">
            <li>no payments</li>
            <li>no bank connections</li>
            <li>no contacting people</li>
            <li>no storage beyond this browser session</li>
          </ul>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 font-display text-xl font-bold text-white">Where analysis runs</h2>
          <p className="text-slate-300">
            the demo FastAPI engine or your own browser; results are kept in memory for this session only
          </p>
        </GlassCard>
      </div>

      <GlassCard className="mt-6 text-center">
        <h2 className="mb-6 font-display text-xl font-bold text-white">Data Flow</h2>
        <div className="flex flex-col items-center justify-center gap-4 text-slate-300 md:flex-row md:gap-6">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">Your input</div>
          <ArrowRight className="rotate-90 text-brand-400 md:rotate-0" />
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">Risk engine</div>
          <ArrowRight className="rotate-90 text-brand-400 md:rotate-0" />
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">Explanation</div>
          <ArrowRight className="rotate-90 text-brand-400 md:rotate-0" />
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 font-bold text-white">You decide</div>
        </div>
      </GlassCard>

      <div className="mt-8 flex flex-col items-center gap-4">
        <Button onClick={handleClear} variant="danger" icon={<Trash2 className="h-5 w-5" />}>
          CLEAR SESSION DATA
        </Button>
        {cleared && <p role="status" className="text-risk-low">Session data cleared.</p>}
      </div>
    </PageShell>
  );
}
