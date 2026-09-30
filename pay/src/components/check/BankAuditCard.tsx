// Bank AI Audit card on the Pay screen: shown when the scanned QR is a bank-network vendor QR (vendorId=...). DEMO.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Landmark, Lock, ShieldAlert } from 'lucide-react';
import { bank, inr, scoreColor, vendorIdFromQr, type AuditResponse, type CustomerAudit } from '../../../../src/services/bank';

const STEPS = ['Reading merchant KYC record', 'Checking dispute history', 'Comparing with your past payments', 'AI auditor reasoning'];

export function BankAuditCard({ qrText, amount, device, transactionRef }: {
  qrText?: string | null; amount: number | null; device: string; transactionRef?: string | null;
}) {
  const vendorId = vendorIdFromQr(qrText);
  const [res, setRes] = useState<AuditResponse | null>(null);
  const [rep, setRep] = useState<CustomerAudit | null>(null);
  const [err, setErr] = useState(false);
  const [step, setStep] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!vendorId || !amount || started.current) return;
    started.current = true;
    bank.audit(vendorId, amount, device, transactionRef || undefined)
      .then((r) => { setRes(r); setRep(r.report); })
      .catch(() => setErr(true));
  }, [vendorId, amount, device, transactionRef]);

  useEffect(() => {
    if (!rep || rep.status !== 'running') return;
    const s = window.setInterval(() => setStep((x) => Math.min(x + 1, STEPS.length - 1)), 2500);
    const p = window.setInterval(() => { bank.report(rep.id).then(setRep).catch(() => {}); }, 2000);
    return () => { window.clearInterval(s); window.clearInterval(p); };
  }, [rep]);

  if (!vendorId) return null;
  if (err) return <div className="card mt-6 bg-gp-surface p-4 text-sm text-gp-ink-2">Bank AI audit unavailable right now (demo server offline).</div>;

  const header = (
    <div className="flex items-center gap-2 text-sm font-medium">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#d3e3fd] text-gp-blue"><Landmark className="h-4 w-4" /></span>
      <span className="flex-1">Bank AI audit</span>
      <span className="rounded-full bg-gp-surface px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gp-ink-3">DEMO</span>
    </div>
  );

  if (!res) return <div className="card mt-6 border border-gp-line p-4">{header}<p className="mt-3 text-sm text-gp-ink-3 animate-pulse">Contacting your bank…</p></div>;

  if (res.mode === 'off') {
    return (
      <div className="card mt-6 border border-amber-300 bg-amber-50 p-4" role="alert">
        {header}
        <p className="mt-3 flex gap-2 text-sm text-amber-900"><ShieldAlert className="h-5 w-5 shrink-0" /> AI audit is OFF. {res.warning}</p>
      </div>
    );
  }

  const done = rep?.status === 'done';
  const col = scoreColor(rep?.score);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card mt-6 border border-gp-line p-4" aria-label="Bank AI audit">
      {header}
      {!done ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gp-blue"><Bot className="h-4 w-4 animate-pulse" /> Auditing {res.vendor.name} for {inr(res.amount)}…</div>
          {STEPS.map((s, i) => (
            <div key={s} className={`flex items-center gap-2 text-xs ${i <= step ? 'text-gp-ink' : 'text-gp-ink-3'}`}>
              <span className={`h-2 w-2 rounded-full ${i < step ? 'bg-risk-low' : i === step ? 'bg-gp-blue animate-ping' : 'bg-gp-line'}`} /> {s}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex items-center gap-4">
            <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${col} ${(rep!.score ?? 0) * 3.6}deg, #e3e3e3 0)` }}>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-lg font-semibold" style={{ color: col }}>{rep!.score}</div>
            </div>
            <div className="min-w-0">
              <div className="font-medium" style={{ color: col }}>{rep!.verdictLabel}</div>
              <div className="text-sm text-gp-ink-2">{rep!.headline}</div>
            </div>
          </div>
          {rep!.keyPoints.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {rep!.keyPoints.map((p) => <li key={p} className="rounded-xl bg-gp-surface px-3 py-2 text-xs leading-relaxed text-gp-ink-2">{p}</li>)}
            </ul>
          )}
          {rep!.recommendation && <p className="mt-2 text-sm font-medium text-gp-ink">{rep!.recommendation}</p>}
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-gp-ink-3"><Lock className="mt-0.5 h-3 w-3 shrink-0" />
            {res.mode === 'summary' ? 'Small payment: showing the earlier bank audit (score and key points only). ' : ''}{rep!.privacy}</p>
        </div>
      )}
      {res.fee && (
        <div className="mt-3 flex items-center justify-between border-t border-gp-line pt-2 text-xs text-gp-ink-3">
          <span>AI audit fee ({res.fee.tier})</span>
          <span className="font-medium text-gp-ink">{inr(res.fee.fee)} · simulated, not charged</span>
        </div>
      )}
    </motion.div>
  );
}

/** Profile switch for the bank's AI audit service, with the bank's accountability warning. */
export function BankAuditToggle() {
  const [on, setOn] = useState<boolean | null>(null);
  const [warning, setWarning] = useState('');
  const [sheet, setSheet] = useState(false);
  const [ack, setAck] = useState(false);
  useEffect(() => { bank.settings().then((s) => { setOn(s.aiAuditEnabled); setWarning(s.warning); }).catch(() => {}); }, []);
  if (on === null) return null;
  return (
    <div className="card mt-4 border border-gp-line p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d3e3fd] text-gp-blue"><Landmark className="h-5 w-5" /></span>
        <div className="flex-1">
          <div className="font-medium">Bank AI audit for vendor payments</div>
          <div className="text-xs text-gp-ink-3">{on ? 'On: the bank checks merchants before you pay' : 'Off: you are responsible for vendor payments'}</div>
        </div>
        <button role="switch" aria-checked={on} aria-label="Bank AI audit" onClick={async () => {
          if (on) { setAck(false); setSheet(true); } else { const s = await bank.setAudit(true, false, 'RakshaPay'); setOn(s.aiAuditEnabled); }
        }} className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-gp-blue' : 'bg-gray-300'}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setSheet(false)}>
          <div role="alertdialog" aria-modal="true" aria-label="Warning from your bank" className="w-full max-w-[420px] rounded-t-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
            <div className="mb-2 flex items-center gap-2 text-lg font-medium text-amber-800"><ShieldAlert className="h-6 w-6" /> Warning from your bank</div>
            <p className="text-sm leading-relaxed text-gp-ink-2">{warning}</p>
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4" />
              I understand the bank will not take accountability or the risk.
            </label>
            <button className="mt-5 w-full rounded-full bg-gp-blue py-3 font-medium text-white" onClick={() => setSheet(false)}>Keep protection on</button>
            <button disabled={!ack} className="mt-2 w-full rounded-full py-3 text-sm font-medium text-red-700 disabled:opacity-40"
              onClick={async () => { const s = await bank.setAudit(false, true, 'RakshaPay'); setOn(s.aiAuditEnabled); setSheet(false); }}>Turn off anyway</button>
          </div>
        </div>
      )}
    </div>
  );
}
