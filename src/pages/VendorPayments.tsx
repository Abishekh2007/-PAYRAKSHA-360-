// Vendor Payments: India vendor map, vendor payment QRs for the phone, Bank AI Audit service + opt-out. DEMO / SIMULATION.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BadgeCheck, Bot, Database, ExternalLink, MapPin, QrCode, ShieldAlert, ShieldCheck, Smartphone, Store } from 'lucide-react';
import { PageShell } from '../components/layout';
import { IndiaMap } from '../components/vendor/IndiaMap';
import { bank, inr, scoreColor, VERDICT_TONE, type BankSettings, type BankVendor, type FullAudit, type VendorDetail } from '../services/bank';
import { setLinkTarget } from '../services/link';
import { generateQrSvg, svgToDataUrl } from '../services/qr';

const AMOUNTS = [499, 4999, 24999, 74999];
type Filter = 'all' | 'enterprise' | 'small' | 'flagged';

function Monogram({ v, size = 44 }: { v: { name: string; brandColor: string }; size?: number }) {
  return (
    <div className="grid place-items-center rounded-2xl font-bold text-white shadow-lg shrink-0"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${v.brandColor}, ${v.brandColor}aa)`, fontSize: size * 0.42 }}>
      {v.name[0]}
    </div>
  );
}

function ScoreRing({ score, size = 64 }: { score: number | null; size?: number }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r, col = scoreColor(score);
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#ffffff14" strokeWidth="6" fill="none" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * (score ?? 0)) / 100 }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} transition={{ duration: 0.9 }} />
      <text x="50%" y="54%" textAnchor="middle" fontSize={size * 0.3} fontWeight="700" fill="#fff">{score ?? '—'}</text>
    </svg>
  );
}

export default function VendorPayments() {
  const [vendors, setVendors] = useState<BankVendor[]>([]);
  const [dbName, setDbName] = useState('');
  const [sel, setSel] = useState<string | null>('flipkart');
  const [amount, setAmount] = useState(74999);
  const [detail, setDetail] = useState<VendorDetail | null>(null);
  const [qr, setQr] = useState('');
  const [presented, setPresented] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [settings, setSettings] = useState<BankSettings | null>(null);
  const [warnOpen, setWarnOpen] = useState(false);
  const [ack, setAck] = useState(false);
  const [audits, setAudits] = useState<FullAudit[]>([]);
  const [pulse, setPulse] = useState<string | null>(null);
  const [error, setError] = useState('');
  const lastAudit = useRef(0);

  const auditorUrl = useMemo(() => {
    const p = Number(window.location.port || 80);
    return `${window.location.protocol}//${window.location.hostname}:${p === 5173 ? 5175 : p + 2}`;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [v, a] = await Promise.all([bank.vendors(), bank.audits()]);
      setVendors(v.vendors); setDbName(v.database); setAudits(a.audits); setError('');
      const newest = a.audits[0];
      if (newest && newest.id !== lastAudit.current) {
        if (lastAudit.current) { setPulse(newest.vendor_id); window.setTimeout(() => setPulse(null), 6000); }
        lastAudit.current = newest.id;
      }
    } catch { setError('Bank API unreachable: start the backend (npm run backend).'); }
  }, []);

  useEffect(() => { refresh(); bank.settings().then(setSettings).catch(() => {}); const t = window.setInterval(refresh, 3000); return () => window.clearInterval(t); }, [refresh]);

  useEffect(() => {
    if (!sel) return;
    setPresented(false);
    bank.vendor(sel, amount).then(async (d) => { setDetail(d); setQr(svgToDataUrl(await generateQrSvg(d.qrText))); }).catch(() => setDetail(null));
  }, [sel, amount, audits.length]);

  const shown = vendors.filter((v) => filter === 'all' ? true : filter === 'enterprise' ? v.size === 'enterprise'
    : filter === 'small' ? v.size !== 'enterprise' && v.verified : !v.verified || (v.latestAudit?.score ?? 0) >= 55);

  async function present() {
    if (!detail) return;
    await setLinkTarget(detail.qrText, `${detail.name} · ${inr(amount)}`);
    setPresented(true);
  }

  async function toggleAudit() {
    if (!settings) return;
    if (settings.aiAuditEnabled) { setAck(false); setWarnOpen(true); return; }
    setSettings(await bank.setAudit(true, false, 'Banking app'));
  }

  const large = amount >= (settings?.largeAmount ?? 10000);

  return (
    <PageShell eyebrow="Vendor payments · DEMO" title="Vendor QR Payments & Bank AI Audit" width="wide"
      subtitle="Pick a merchant on the map, show its payment QR, scan it with RakshaPay. Large payments get a live AI audit by the bank; small ones reuse the last audit. SIMULATION: no money moves."
      icon={<Store className="h-6 w-6" />}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            <Database className="h-3.5 w-3.5 text-cyan-300" /> {dbName === 'postgres' ? 'PostgreSQL (Docker)' : dbName ? 'SQLite fallback' : '…'}
          </span>
          <a href={auditorUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            <Bot className="h-3.5 w-3.5" /> AI Auditor portal <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      }>
      {error && <p role="alert" className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</p>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Map */}
        <section className="glass rounded-3xl p-4 sm:p-5 min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold text-white"><MapPin className="h-4 w-4 text-cyan-300" /> Merchant network · India</h2>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'enterprise', 'small', 'flagged'] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs capitalize transition ${filter === f ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                  {f === 'enterprise' ? 'Big brands' : f === 'small' ? 'Small vendors' : f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_210px]">
            <IndiaMap vendors={shown} selectedId={sel} pulseId={pulse} onSelect={setSel} />
            <ul className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1" aria-label="Vendors">
              {shown.map((v) => (
                <li key={v.id}>
                  <button onClick={() => setSel(v.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${v.id === sel ? 'bg-white/10 ring-1 ring-indigo-400/50' : 'hover:bg-white/5'}`}>
                    <Monogram v={v} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{v.name}</span>
                      <span className="block truncate text-[11px] text-slate-400">{v.city}</span>
                    </span>
                    {v.latestAudit && <span className="rounded-full px-1.5 text-[11px] font-bold" style={{ color: scoreColor(v.latestAudit.score) }}>{v.latestAudit.score}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Brand names are used for a hackathon demo only: not affiliated, all merchants, payments and audits are SIMULATED.</p>
        </section>

        {/* Vendor panel */}
        <section className="glass rounded-3xl p-5 min-w-0">
          {detail ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Monogram v={detail} size={52} />
                <div className="min-w-0 flex-1">
                  <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-white">
                    {detail.name}
                    {detail.verified
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300"><BadgeCheck className="h-3.5 w-3.5" /> Verified merchant</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300"><ShieldAlert className="h-3.5 w-3.5" /> KYC {detail.kycStatus}</span>}
                  </h2>
                  <p className="text-sm text-slate-400">{detail.category} · {detail.city} · on the bank network {detail.vendorAgeDays} days</p>
                </div>
                {detail.latestAudit && <ScoreRing score={detail.latestAudit.score} size={58} />}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[['Payments', detail.stats?.txCount ?? 0], ['Avg ticket', inr(detail.stats?.avgTicket ?? 0)], ['Disputes', `${detail.stats?.disputeRatePct ?? 0}%`]].map(([k, v]) => (
                  <div key={k as string} className="rounded-2xl bg-white/5 p-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">{k}</div>
                    <div className="mt-0.5 font-semibold text-white tabular-nums">{v}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Payment amount (demo)</div>
                <div className="flex flex-wrap gap-2">
                  {AMOUNTS.map((a) => (
                    <button key={a} onClick={() => setAmount(a)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${a === amount ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}>
                      {inr(a)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[180px_1fr] items-center">
                <div className="rounded-2xl bg-white p-2.5 shadow-xl">
                  {qr ? <img src={qr} alt={`Demo payment QR for ${detail.name}`} className="w-full" /> : <div className="aspect-square" />}
                  <div className="mt-1 text-center text-[10px] font-bold tracking-wide text-slate-700">DEMO QR · NOT A REAL PAYMENT</div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className={`rounded-2xl p-3 ${large ? 'bg-indigo-500/15 ring-1 ring-indigo-400/30' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-2 font-semibold text-white"><Bot className="h-4 w-4 text-indigo-300" /> {large ? 'Large payment: full AI audit' : 'Small payment: earlier audit reused'}</div>
                    <p className="mt-1 text-slate-300">{large ? 'The bank AI audits the merchant against the bank database before you pay.' : 'Only the score and key points of the last audit are shown; vendor details stay private.'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3 text-slate-300">
                    AI audit fee: <b className="text-white">{inr(detail.feeQuote.fee)}</b> <span className="text-slate-400">({detail.feeQuote.tier}, from your {detail.myHistory.count} past payments to this merchant; fixed once set)</span>
                    <div className="mt-0.5 text-[11px] text-amber-300/80">SIMULATED FEE: never charged</div>
                  </div>
                  <button onClick={present}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/25">
                    <Smartphone className="h-4 w-4" /> {presented ? 'Sent: tap "Scan what the console shows" on the phone' : 'Send QR to linked phone'}
                  </button>
                </div>
              </div>
            </div>
          ) : <div className="grid h-64 place-items-center text-slate-400"><QrCode className="h-8 w-8" /></div>}
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        {/* Service settings */}
        <section className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-white">
                {settings?.aiAuditEnabled ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <ShieldAlert className="h-4 w-4 text-amber-300" />} Bank AI Audit service
              </h2>
              <p className="text-sm text-slate-400">{settings?.aiAuditEnabled ? 'On: vendor payments are audited before you pay.' : 'Off: you accepted responsibility for vendor payments.'}</p>
            </div>
            <button role="switch" aria-checked={!!settings?.aiAuditEnabled} aria-label="Bank AI Audit service" onClick={toggleAudit}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${settings?.aiAuditEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${settings?.aiAuditEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-2">Your history with a merchant</th><th className="pb-2 text-right">Fixed fee / audit</th></tr></thead>
            <tbody>
              {settings?.feeTiers.map((t) => (
                <tr key={t.tier} className="border-t border-white/5"><td className="py-2 capitalize text-slate-200">{t.tier} <span className="text-slate-500">({t.minPayments === 0 ? 'no payments' : `${t.minPayments}+ payments`})</span></td><td className="py-2 text-right font-semibold text-white">{inr(t.fee)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-slate-500">Covers AI processing / API cost. SIMULATED: nothing is charged. Payments under {inr(settings?.largeAmount ?? 10000)} reuse the last audit free.</p>
        </section>

        {/* Live audits */}
        <section className="glass rounded-3xl p-5 min-w-0">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-white"><Bot className="h-4 w-4 text-indigo-300" /> Live bank audits</h2>
          {audits.length === 0 && <p className="text-sm text-slate-400">No audits yet. Scan a vendor QR over {inr(settings?.largeAmount ?? 10000)} with RakshaPay.</p>}
          <ul className="space-y-2" aria-label="Live bank audits">
            <AnimatePresence initial={false}>
              {audits.slice(0, 6).map((a) => (
                <motion.li key={a.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                  {a.vendor && <Monogram v={a.vendor} size={36} />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{a.vendor?.name} · {inr(a.amount)} <span className="text-slate-500">· {a.device}</span></div>
                    <div className="truncate text-xs text-slate-400">{a.status === 'running' ? 'AI auditor is reasoning over the bank database…' : a.headline}</div>
                  </div>
                  {a.status === 'running'
                    ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" aria-label="Auditing" />
                    : <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: `${scoreColor(a.score)}22`, color: scoreColor(a.score) }}>
                        {a.score} · {a.verdict ? VERDICT_TONE[a.verdict].label : ''}
                      </span>}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      </div>

      <AnimatePresence>
        {warnOpen && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="alertdialog" aria-modal="true" aria-labelledby="optout-title" initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/15"><AlertTriangle className="h-6 w-6 text-amber-300" /></div>
              <h3 id="optout-title" className="text-lg font-semibold text-white">Warning from your bank</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{settings?.warning}</p>
              <label className="mt-4 flex items-start gap-2.5 text-sm text-slate-200">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-500" />
                I understand the bank will not take accountability or the risk, and I am responsible.
              </label>
              <div className="mt-5 flex gap-2">
                <button onClick={() => setWarnOpen(false)} className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 font-semibold text-white">Keep protection on</button>
                <button disabled={!ack} onClick={async () => { setSettings(await bank.setAudit(false, true, 'Banking app')); setWarnOpen(false); }}
                  className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-200 disabled:opacity-40">Turn off anyway</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
