// Merchant Payments: light payment dashboard with a street map of the bank's merchant network, static merchant QRs
// (the customer enters the amount in RakshaPay), and the Bank AI Audit service + opt-out. DEMO / SIMULATION.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, BadgeCheck, Bot, Database, ExternalLink, IndianRupee, MapPin, QrCode, ShieldAlert, ShieldCheck, Smartphone, Store } from 'lucide-react';
import { VendorLogo } from '../components/vendor/VendorLogo';
import { VendorMap } from '../components/vendor/VendorMap';
import { bank, inr, scoreColor, VERDICT_TONE, type BankSettings, type BankVendor, type FullAudit, type VendorDetail } from '../services/bank';
import { setLinkTarget } from '../services/link';
import { generateQrSvg, svgToDataUrl } from '../services/qr';

type Filter = 'all' | 'enterprise' | 'small' | 'flagged';
const flagged = (v: BankVendor) => !v.verified || (v.latestAudit?.score ?? 0) >= 55;
const compact = (n: number) => n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : inr(n);

function RiskPill({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-slate-400">Not audited</span>;
  const c = scoreColor(score);
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: `${c}18`, color: c }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{score}/100</span>;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-12px_rgba(15,23,42,.12)] ${className}`}>{children}</section>;
}

export default function VendorPayments() {
  const [vendors, setVendors] = useState<BankVendor[]>([]);
  const [dbName, setDbName] = useState('');
  const [sel, setSel] = useState<string | null>('flipkart');
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
    bank.vendor(sel, 0).then(async (d) => { setDetail(d); setQr(svgToDataUrl(await generateQrSvg(d.qrText))); }).catch(() => setDetail(null));
  }, [sel, audits.length]);

  const shown = vendors.filter((v) => filter === 'all' ? true : filter === 'enterprise' ? v.size === 'enterprise'
    : filter === 'small' ? v.size !== 'enterprise' && v.verified : flagged(v));

  const kpi = useMemo(() => ({
    volume: vendors.reduce((s, v) => s + (v.stats?.volume ?? 0), 0),
    payments: vendors.reduce((s, v) => s + (v.stats?.txCount ?? 0), 0),
    verified: vendors.filter((v) => v.verified).length,
    flagged: vendors.filter(flagged).length,
  }), [vendors]);

  async function present() {
    if (!detail) return;
    await setLinkTarget(detail.qrText, `${detail.name} · merchant QR`);
    setPresented(true);
  }

  async function toggleAudit() {
    if (!settings) return;
    if (settings.aiAuditEnabled) { setAck(false); setWarnOpen(true); return; }
    setSettings(await bank.setAudit(true, false, 'Banking app'));
  }

  const large = settings?.largeAmount ?? 10000;

  return (
    <div className="-mx-2 rounded-[28px] bg-[#f4f6fb] p-4 text-slate-800 sm:-mx-0 sm:p-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/30"><Store className="h-5 w-5" /></div>
        <div className="mr-auto min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Merchant Payments</h1>
          <p className="text-sm text-slate-500">Bank merchant network, payment QRs and AI audit. The customer enters the amount on RakshaPay.</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold tracking-wide text-amber-800">DEMO · SIMULATION</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          <Database className="h-3.5 w-3.5 text-indigo-500" /> {dbName === 'postgres' ? 'PostgreSQL (Docker)' : dbName ? 'SQLite fallback' : '…'}
        </span>
        <a href={auditorUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
          <Bot className="h-3.5 w-3.5" /> AI Auditor portal <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: 'Merchant volume', v: compact(kpi.volume), icon: IndianRupee, tone: 'bg-indigo-50 text-indigo-600' },
          { k: 'Payments processed', v: kpi.payments.toLocaleString('en-IN'), icon: Activity, tone: 'bg-sky-50 text-sky-600' },
          { k: 'Verified merchants', v: `${kpi.verified} / ${vendors.length}`, icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-600' },
          { k: 'Flagged merchants', v: kpi.flagged, icon: ShieldAlert, tone: 'bg-rose-50 text-rose-600' },
        ].map(({ k, v, icon: I, tone }) => (
          <Card key={k} className="!p-4">
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><I className="h-5 w-5" /></span>
              <div className="min-w-0"><div className="text-xs font-medium text-slate-500">{k}</div><div className="text-xl font-bold tabular-nums text-slate-900">{v}</div></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Map */}
        <Card className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><MapPin className="h-4 w-4 text-indigo-500" /> Merchant network · India</h2>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {(['all', 'enterprise', 'small', 'flagged'] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  {f === 'enterprise' ? 'Big brands' : f === 'small' ? 'Small vendors' : f}
                </button>
              ))}
            </div>
          </div>
          <VendorMap vendors={shown} selectedId={sel} pulseId={pulse} onSelect={setSel} />
          <p className="mt-2 text-[11px] text-slate-400">Brand names and marks are shown for a hackathon demo only: not affiliated. All merchants, payments and audits are SIMULATED.</p>
        </Card>

        {/* Merchant panel */}
        <Card className="min-w-0">
          {detail ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <VendorLogo v={detail} size={60} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-slate-900">{detail.name}</h2>
                  <p className="text-sm text-slate-500">{detail.category} · {detail.city}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {detail.verified
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" /> Verified merchant</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700"><ShieldAlert className="h-3.5 w-3.5" /> KYC {detail.kycStatus}</span>}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{detail.vendorAgeDays} days on network</span>
                  </div>
                </div>
                <RiskPill score={detail.latestAudit?.score} />
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 text-center">
                {[['Payments', (detail.stats?.txCount ?? 0).toLocaleString('en-IN')], ['Avg ticket', inr(detail.stats?.avgTicket ?? 0)], ['Dispute rate', `${detail.stats?.disputeRatePct ?? 0}%`]].map(([k, v]) => (
                  <div key={k} className="p-2.5"><div className="text-[11px] font-medium text-slate-500">{k}</div><div className="font-semibold tabular-nums text-slate-900">{v}</div></div>
                ))}
              </div>

              <div className="grid items-center gap-4 sm:grid-cols-[170px_1fr] xl:grid-cols-1 2xl:grid-cols-[170px_1fr]">
                <div className="mx-auto w-full max-w-[200px] rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
                  {qr ? <img src={qr} alt={`Demo merchant QR for ${detail.name}`} className="w-full" /> : <div className="aspect-square" />}
                  <div className="mt-1 text-center text-[10px] font-bold tracking-wide text-slate-600">DEMO QR · NOT A REAL PAYMENT</div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-900">
                    <div className="flex items-center gap-2 font-semibold"><Smartphone className="h-4 w-4" /> Amount is entered on the phone</div>
                    <p className="mt-1 text-indigo-800/80">Payments of {inr(large)} or more get a live bank AI audit; smaller ones show the last audit's score.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 text-slate-600">
                    AI audit fee for you: <b className="text-slate-900">{inr(detail.feeQuote.fee)}</b> <span className="text-slate-400">({detail.feeQuote.tier} · {detail.myHistory.count} past payments)</span>
                    <div className="mt-0.5 text-[11px] font-medium text-amber-700">SIMULATED FEE: never charged</div>
                  </div>
                  <button onClick={present}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500">
                    <Smartphone className="h-4 w-4" /> {presented ? 'Sent: tap "Scan what the console shows"' : 'Send QR to linked phone'}
                  </button>
                </div>
              </div>
            </div>
          ) : <div className="grid h-64 place-items-center text-slate-400"><QrCode className="h-8 w-8" /></div>}
        </Card>
      </div>

      {/* Merchants table */}
      <Card className="mt-5 min-w-0 !p-0">
        <div className="flex items-center justify-between px-5 pt-4"><h2 className="font-semibold text-slate-900">Merchants</h2><span className="text-xs text-slate-400">{shown.length} shown</span></div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm" aria-label="Merchants">
            <thead><tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
              <th className="px-5 py-2.5">Merchant</th><th className="px-3">City</th><th className="px-3 text-right">Payments</th><th className="px-3 text-right">Volume</th><th className="px-3 text-right">Disputes</th><th className="px-3">AI risk</th><th className="px-5">Status</th>
            </tr></thead>
            <tbody>
              {shown.map((v) => (
                <tr key={v.id} onClick={() => setSel(v.id)} className={`cursor-pointer border-b border-slate-50 transition hover:bg-slate-50 ${v.id === sel ? 'bg-indigo-50/60' : ''}`}>
                  <td className="px-5 py-2.5"><div className="flex items-center gap-3"><VendorLogo v={v} size={34} /><div><div className="font-medium text-slate-900">{v.name}</div><div className="text-xs text-slate-500">{v.category}</div></div></div></td>
                  <td className="px-3 text-slate-600">{v.city}</td>
                  <td className="px-3 text-right tabular-nums">{(v.stats?.txCount ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-3 text-right tabular-nums">{compact(v.stats?.volume ?? 0)}</td>
                  <td className="px-3 text-right tabular-nums">{v.stats?.disputeRatePct ?? 0}%</td>
                  <td className="px-3"><RiskPill score={v.latestAudit?.score} /></td>
                  <td className="px-5">{v.verified
                    ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Verified</span>
                    : <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">KYC {v.kycStatus}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        {/* Service settings */}
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                {settings?.aiAuditEnabled ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <ShieldAlert className="h-4 w-4 text-amber-600" />} Bank AI Audit service
              </h2>
              <p className="text-sm text-slate-500">{settings?.aiAuditEnabled ? 'On: merchant payments are audited before you pay.' : 'Off: you accepted responsibility for merchant payments.'}</p>
            </div>
            <button role="switch" aria-checked={!!settings?.aiAuditEnabled} aria-label="Bank AI Audit service" onClick={toggleAudit}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${settings?.aiAuditEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${settings?.aiAuditEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead><tr className="text-left text-xs font-medium text-slate-500"><th className="pb-2">Your history with a merchant</th><th className="pb-2 text-right">Fixed fee / audit</th></tr></thead>
            <tbody>
              {settings?.feeTiers.map((t) => (
                <tr key={t.tier} className="border-t border-slate-100"><td className="py-2 capitalize text-slate-700">{t.tier} <span className="text-slate-400">({t.minPayments === 0 ? 'no payments' : `${t.minPayments}+ payments`})</span></td><td className="py-2 text-right font-semibold text-slate-900">{inr(t.fee)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-slate-400">Covers AI processing / API cost. SIMULATED: nothing is charged. Payments under {inr(large)} reuse the last audit.</p>
        </Card>

        {/* Recent audits */}
        <Card className="min-w-0 !p-0">
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Bot className="h-4 w-4 text-indigo-500" /> Recent payment audits</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live</span>
          </div>
          {audits.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No audits yet. Send a merchant QR to the phone and enter {inr(large)} or more in RakshaPay.</p>}
          <ul className="mt-2 divide-y divide-slate-100" aria-label="Recent payment audits">
            <AnimatePresence initial={false}>
              {audits.slice(0, 6).map((a) => (
                <motion.li key={a.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-5 py-3">
                  {a.vendor && <VendorLogo v={a.vendor} size={34} />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{a.vendor?.name} · <span className="tabular-nums">{inr(a.amount)}</span> <span className="font-normal text-slate-400">· {a.device}</span></div>
                    <div className="truncate text-xs text-slate-500">{a.status === 'running' ? 'AI auditor is reasoning over the bank database…' : a.headline}</div>
                  </div>
                  {a.status === 'running'
                    ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" aria-label="Auditing" />
                    : <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${scoreColor(a.score)}18`, color: scoreColor(a.score) }}>
                        {a.score} · {a.verdict ? VERDICT_TONE[a.verdict].label : ''}
                      </span>}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      </div>

      <AnimatePresence>
        {warnOpen && (
          <motion.div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="alertdialog" aria-modal="true" aria-labelledby="optout-title" initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-800 shadow-2xl">
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber-100"><AlertTriangle className="h-6 w-6 text-amber-600" /></div>
              <h3 id="optout-title" className="text-lg font-bold text-slate-900">Warning from your bank</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{settings?.warning}</p>
              <label className="mt-4 flex items-start gap-2.5 text-sm text-slate-700">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-600" />
                I understand the bank will not take accountability or the risk, and I am responsible.
              </label>
              <div className="mt-5 flex gap-2">
                <button onClick={() => setWarnOpen(false)} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white">Keep protection on</button>
                <button disabled={!ack} onClick={async () => { setSettings(await bank.setAudit(false, true, 'Banking app')); setWarnOpen(false); }}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-40">Turn off anyway</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
