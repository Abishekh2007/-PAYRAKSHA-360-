import React, { useMemo } from 'react';
import { PageShell } from '../components/layout';
import { useDemoStore } from '../store/demoStore';
import { runScenarioLocal, fmtINR } from '../engine';
import { Button, GlassCard, SimulationBadge } from '../components/ui';
import { Users, ShieldAlert, CheckCircle, XCircle, Smartphone } from 'lucide-react';

export default function TrustedContact() {
  const { trustedAlert, sendTrustedAlert, resolveTrustedAlert } = useDemoStore();
  const defaultReport = useMemo(() => runScenarioLocal('customer_care_scam'), []);

  const report = trustedAlert ? trustedAlert.report : defaultReport;
  const p = report.payment;
  const contactName = trustedAlert?.contactName ?? 'Trusted Contact';

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
      icon={<Users className="w-8 h-8" />}
      actions={<SimulationBadge />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Phone Pane */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-slate-400" />
            Your phone (demo)
          </h2>
          <GlassCard className="flex flex-col gap-4 min-h-[300px]">
            {!trustedAlert && (
              <div className="flex flex-col items-start gap-4">
                <p className="text-slate-300">
                  You are about to pay {fmtINR(p.amount ?? 0)} to {p.recipient}.
                </p>
                <Button onClick={handleSend} icon={<ShieldAlert className="w-4 h-4" />}>
                  SEND DEMO ALERT
                </Button>
              </div>
            )}

            {trustedAlert && (
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-3">
                  {trustedAlert.status === 'pending' && <span className="animate-pulse w-3 h-3 bg-brand-400 rounded-full" />}
                  {trustedAlert.status === 'advised_not_to_pay' && <XCircle className="w-6 h-6 text-risk-high" />}
                  {trustedAlert.status === 'marked_safe' && <CheckCircle className="w-6 h-6 text-risk-low" />}
                  <span className="text-lg font-medium">{statusText()}</span>
                </div>

                {trustedAlert.status !== 'pending' && (
                  <Button variant="outline" onClick={handleSend}>
                    SEND AGAIN
                  </Button>
                )}
              </div>
            )}

            <div className="mt-auto pt-8 flex flex-col gap-2 text-sm text-slate-400">
              <p>No financial credentials are shared.</p>
              <p>Simulation: no message is sent to a real person.</p>
            </div>
          </GlassCard>
        </div>

        {/* Trusted Contact Phone Pane */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-slate-400" />
            Trusted contact's phone (simulation)
          </h2>

          <div className="relative mx-auto w-[300px] h-[550px] bg-slate-900 border-[10px] border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-10" />

            <div className="p-4 pt-10 h-full overflow-y-auto bg-slate-950">
              {trustedAlert && (
                <div className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700 animate-in fade-in slide-in-from-top-4">
                  <div className="bg-risk-high/20 p-4 border-b border-risk-high/20">
                    <h3 className="font-bold text-risk-high flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      PAYRAKSHA SAFETY ALERT
                    </h3>
                  </div>

                  <div className="p-4 flex flex-col gap-4 text-sm">
                    <p className="text-slate-200">
                      Your family member is about to pay {fmtINR(p.amount ?? 0)} to {p.recipient}.
                    </p>

                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                      <p className="font-bold mb-1">
                        Risk: {report.score}/100 · {report.levelLabel}
                      </p>
                      <p className="text-slate-400 mt-1">
                        Pattern: {report.patternName}
                      </p>
                    </div>

                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {report.explanation.reasons.slice(0, 3).map((r, i) => (
                        <li key={i} className="leading-snug">{r}</li>
                      ))}
                    </ul>

                    {trustedAlert.status === 'pending' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <Button
                          variant="danger"
                          size="sm"
                          fullWidth
                          onClick={() => resolveTrustedAlert('advised_not_to_pay')}
                        >
                          ADVISE USER NOT TO PAY
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          onClick={() => resolveTrustedAlert('marked_safe')}
                        >
                          MARK SAFE
                        </Button>
                      </div>
                    )}

                    {trustedAlert.status !== 'pending' && (
                      <div className="text-center p-2 rounded bg-slate-900 text-slate-400 mt-2">
                        Response sent.
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!trustedAlert && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  Screen off
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
