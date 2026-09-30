// GPay-style "enter amount" step for a bank-network merchant QR that carries no amount. DEMO: no money moves.
import { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Bot, ShieldAlert } from 'lucide-react';
import { bank, inr, type VendorDetail } from '../../../../src/services/bank';
import { VendorLogo } from '../../../../src/components/vendor/VendorLogo';

const CHIPS = [499, 2499, 24999, 74999];
const MAX = 100000;

/** Adds `amount=<n>` to a PAYRAKSHA merchant QR payload. */
export function withAmount(qrText: string, amount: number): string {
  return /\nrecipient=[^\n]*/.test(qrText)
    ? qrText.replace(/(\nrecipient=[^\n]*)/, `$1\namount=${amount}`)
    : `${qrText}\namount=${amount}`;
}

export function VendorAmount({ vendorId, onBack, onDone }: { vendorId: string; onBack: () => void; onDone: (amount: number) => void }) {
  const [v, setV] = useState<VendorDetail | null>(null);
  const [raw, setRaw] = useState('');
  const amount = Number(raw || 0);
  useEffect(() => { bank.vendor(vendorId, 0).then(setV).catch(() => setV(null)); }, [vendorId]);
  const valid = amount >= 1 && amount <= MAX;
  const large = amount >= 10000;

  return (
    <div className="flex min-h-full flex-col bg-white text-gp-ink">
      <div className="flex items-center px-4 py-3">
        <button aria-label="Back" className="-ml-2 rounded-full p-2 hover:bg-gp-surface" onClick={onBack}><ArrowLeft className="h-6 w-6" /></button>
      </div>
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col items-center px-6 text-center">
        {v ? <VendorLogo v={v} size={76} /> : <div className="h-[76px] w-[76px] animate-pulse rounded-3xl bg-gp-surface" />}
        <h1 className="mt-4 text-2xl font-medium">Paying {v?.name ?? '…'}</h1>
        <p className="text-sm text-gp-ink-3">{v?.vpa}</p>
        {v && (v.verified
          ? <div className="mt-1 flex items-center gap-1 text-xs font-medium text-risk-low"><BadgeCheck className="h-4 w-4" /> Bank-verified merchant</div>
          : <div className="mt-1 flex items-center gap-1 text-xs font-medium text-risk-high"><ShieldAlert className="h-4 w-4" /> Merchant KYC {v.kycStatus}</div>)}

        <label className="mt-8 flex items-baseline justify-center text-[52px] font-medium leading-none tracking-tight">
          <span className="mr-1 text-gp-ink-3">₹</span>
          <input aria-label="Amount" inputMode="numeric" autoFocus placeholder="0" value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-[6ch] bg-transparent text-left outline-none placeholder:text-gp-line" style={{ width: `${Math.max(1, raw.length)}ch` }} />
        </label>
        {amount > MAX && <p className="mt-2 text-sm text-risk-high">Demo limit is {inr(MAX)}</p>}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {CHIPS.map((c) => (
            <button key={c} onClick={() => setRaw(String(c))}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${amount === c ? 'border-gp-blue bg-[#d3e3fd] text-gp-blue' : 'border-gp-line text-gp-ink-2'}`}>{inr(c)}</button>
          ))}
        </div>

        <div className={`mt-6 w-full rounded-2xl p-4 text-left text-sm ${large ? 'bg-[#d3e3fd] text-[#0b3d91]' : 'bg-gp-surface text-gp-ink-2'}`}>
          <div className="flex items-center gap-2 font-medium"><Bot className="h-4 w-4" /> {large ? 'Your bank will run a full AI audit' : 'Your bank shows its last audit'}</div>
          <p className="mt-1 text-xs opacity-80">{large ? 'Payments of ₹10,000 or more are checked by the bank AI auditor before you pay.' : 'Small payments show the latest audit score and key points only.'}
            {v && <> AI audit fee {inr(v.feeQuote.fee)} ({v.feeQuote.tier}), simulated, never charged.</>}</p>
        </div>
      </div>
      <div className="sticky bottom-0 bg-white p-4 pb-safe">
        <button disabled={!valid} onClick={() => onDone(amount)} className="pill-primary mx-auto block w-full max-w-[400px] disabled:opacity-40">
          {valid ? `Check ${inr(amount)} payment` : 'Enter an amount'}
        </button>
        <p className="mt-2 text-center text-[11px] text-gp-ink-3">DEMO · SIMULATION: no money moves, no UPI PIN is ever asked.</p>
      </div>
    </div>
  );
}
