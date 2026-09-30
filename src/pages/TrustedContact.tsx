import React, { useMemo } from 'react';
import { PageShell } from '../components/layout';
import { useDemoStore } from '../store/demoStore';
import { runScenarioLocal, fmtINR } from '../engine';
import { Button, SimulationBadge } from '../components/ui';
import { Users, ShieldAlert, Smartphone } from 'lucide-react';
import { HudPanel, StatusPill, socToneForLevel } from '../components/soc';

export default function TrustedContact() {
  const { trustedAlert, sendTrustedAlert, resolveTrustedAlert } = useDemoStore();
  const defaultReport = useMemo(() => runScenarioLocal('customer_care_scam'), []);

  const report = trustedAlert ? trustedAlert.report : defaultReport;
  const p = report.payment;

  const handleSend = () => {
    sendTrustedAlert(report, trustedAlert?.contactName);
  };

  const statusText = () => {
    if (!trustedAlert) return null;
    if (trustedAlert.status === 'pending') {
      return `Waiting for ${trustedAlert.contactName}…`;
    }
    if (trustedAlert.status === 'advised_not_to_pay') {
      return `${trustedAlert.contactName} advised you not to pay.`;
    }
    if (trustedAlert.status === 'marked_safe') {
      return `${trustedAlert.contactName} marked this payment as safe. Still verify before paying.`;
    }
  };

  return (
    <PageShell
      title="Trusted Contact"
      eyebrow="RESPONSE"
      width="wide"
      icon={<Users className="w-8 h-8" />}
      actions={<SimulationBadge />}
    >
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left Col */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <HudPanel title="RESPONSE PROTOCOL">
            <div className="flex flex-col">
              <div className="hud-rule px-2 py-3 text-sm mono">1 PAUSE</div>
              <div className="hud-rule px-2 py-3 text-sm mono">2 VERIFY</div>
              <div className="hud-rule px-2 py-3 text-sm mono text-cyan-300 font-bold">3 ASK TRUSTED CONTACT</div>
              <div className="px-2 py-3 py-2 text-sm mono">4 REPORT</div>
            </div>
          </HudPanel>
          <HudPanel title="YOUR DEVICE (DEMO)">
            <div className="flex flex-col gap-4">
              {!trustedAlert && (
                <div className="flex flex-col items-start gap-4">
                  <p className="text-sm text-slate-300">
                    You are about to pay {fmtINR(p.amount ?? 0)} to {p.recipient}.
                  </p>
                  <Button onClick={handleSend} icon={<ShieldAlert className="w-4 h-4" />}>
                    SEND DEMO ALERT
                  </Button>
                </div>
              )}

              {trustedAlert && (
                <div className="flex flex-col items-start gap-4">
                  <div className="text-sm font-medium text-slate-300">{statusText()}</div>

                  {trustedAlert.status !== 'pending' && (
                    <Button variant="outline" onClick={handleSend}>
                      SEND AGAIN
                    </Button>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500">
                <p>No financial credentials are shared.</p>
                <p>Simulation: no message is sent to a real person.</p>
              </div>
            </div>
          </HudPanel>
        </div>

        {/* Right Col */}
        <div className="lg:col-span-8">
          <HudPanel
            eyebrow="ALERT RELAY · SIMULATED — NOTHING IS SENT TO A REAL PERSON"
            title="TRUSTED CONTACT ALERT"
            right={
              trustedAlert ? (
                <StatusPill
                  tone={trustedAlert.status === 'pending' ? 'amber' : trustedAlert.status === 'marked_safe' ? 'green' : 'red'}
                  pulse={trustedAlert.status === 'pending'}
                >
                  {trustedAlert.status.replace(/_/g, ' ')}
                </StatusPill>
              ) : (
                <StatusPill tone="cyan">IDLE</StatusPill>
              )
            }
          >
            <div className="min-h-[400px]">
              {trustedAlert ? (
                <div className="border border-cyan-400/15 bg-slate-900/50 flex flex-col gap-4 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-dashed border-cyan-400/15 p-4 bg-risk-high/10" style={{'--hud-accent': '#ef4444'} as any}>
                    <ShieldAlert className="w-4 h-4 text-risk-high" />
                    <h3 className="font-mono text-[13px] font-bold text-risk-high uppercase tracking-widest">
                      PAYRAKSHA SAFETY ALERT
                    </h3>
                  </div>

                  <div className="px-4 text-sm text-slate-300">
                    Your family member is about to pay {fmtINR(p.amount ?? 0)} to {p.recipient}.
                  </div>

                  <div className="mx-4 bg-slate-900/80 p-3 border border-slate-700/50 rounded">
                    <p className="hud-label text-risk-high mb-1 font-bold">
                      RISK {report.score}/100 · {report.levelLabel}
                    </p>
                    <p className="hud-label text-slate-400">
                      Pattern: {report.patternName}
                    </p>
                  </div>

                  <ul className="px-4 list-disc list-inside text-sm text-slate-300 space-y-1 mb-4">
                    {report.explanation.reasons.slice(0, 3).map((r, i) => (
                      <li key={i} className="leading-snug">{r}</li>
                    ))}
                  </ul>

                  {trustedAlert.status === 'pending' ? (
                    <div className="px-4 pb-4 flex flex-col sm:flex-row gap-4">
                      <Button
                        variant="danger"
                        onClick={() => resolveTrustedAlert('advised_not_to_pay')}
                      >
                        ADVISE USER NOT TO PAY
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => resolveTrustedAlert('marked_safe')}
                      >
                        MARK SAFE
                      </Button>
                    </div>
                  ) : (
                    <div className="px-4 pb-4 text-sm text-slate-500 uppercase tracking-widest font-mono">
                      Response sent.
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm mono uppercase tracking-widest min-h-[300px]">
                  WAITING FOR ALERT INITIATION
                </div>
              )}
            </div>
          </HudPanel>
        </div>
      </div>
    </PageShell>
  );
}
