import React, { useState } from 'react';
import { PageShell } from '../components/layout';
import { Button, SimulationBadge } from '../components/ui';
import { HudPanel } from '../components/soc';
import { useDemoStore } from '../store/demoStore';
import { Trash2 } from 'lucide-react';

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
      eyebrow="SYSTEM"
      width="wide"
      subtitle="How PAYRAKSHA 360 handles your data in this demo."
      actions={<SimulationBadge />}
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <HudPanel tone="red" title="NEVER REQUESTS" className="lg:col-span-4" data-testid="never-requests-panel">
          <ul className="space-y-3 text-sm text-white">
            <li>❌ UPI PIN</li>
            <li>❌ OTP</li>
            <li>❌ Password</li>
            <li>❌ CVV</li>
            <li>❌ Full card number</li>
          </ul>
          <p className="mt-6 hud-label text-red-500">No financial credentials are shared.</p>
        </HudPanel>

        <HudPanel tone="cyan" title="DATA HANDLING MATRIX" className="lg:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-cyan-400/15 text-cyan-300">
                  <th className="py-3 pr-4 font-normal">Data Item</th>
                  <th className="py-3 px-2 text-center font-normal">In Browser</th>
                  <th className="py-3 px-2 text-center font-normal">Local Demo API</th>
                  <th className="py-3 pl-2 text-center font-normal">Never Stored</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-400/10 text-slate-300">
                <tr>
                  <td className="py-3 pr-4">Message text you paste</td>
                  <td className="py-3 px-2 text-center text-green-400">✓</td>
                  <td className="py-3 px-2 text-center text-green-400">✓</td>
                  <td className="py-3 pl-2 text-center text-slate-600">—</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Link text (never opened)</td>
                  <td className="py-3 px-2 text-center text-green-400">✓</td>
                  <td className="py-3 px-2 text-center text-green-400">✓</td>
                  <td className="py-3 pl-2 text-center text-slate-600">—</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">QR contents</td>
                  <td className="py-3 px-2 text-center text-green-400">✓</td>
                  <td className="py-3 px-2 text-center text-green-400">✓</td>
                  <td className="py-3 pl-2 text-center text-slate-600">—</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Payment context (recipient id, amount, source)</td>
                  <td className="py-3 px-2 text-center text-green-400">✓</td>
                  <td className="py-3 px-2 text-center text-green-400">✓</td>
                  <td className="py-3 pl-2 text-center text-slate-600">—</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-slate-400">External network / Bank</td>
                  <td className="py-3 px-2 text-center text-slate-600">—</td>
                  <td className="py-3 px-2 text-center text-slate-600">—</td>
                  <td className="py-3 pl-2 text-center text-green-400">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </HudPanel>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <Button onClick={handleClear} variant="danger">
          CLEAR SESSION DATA
        </Button>
        {cleared && <p role="status" className="hud-label text-green-400">Session data cleared.</p>}
      </div>
    </PageShell>
  );
}
