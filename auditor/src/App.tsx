// PAYRAKSHA AI Auditor: the bank-internal, server-side view of every vendor audit: data used, reasoning, findings.
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Bot, Building2, UserRound, Database, FileSearch, Lock, Minus, ScrollText, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { bank, inr, scoreColor, VERDICT_TONE, type FullAudit } from '../../src/services/bank';
import { VendorLogo } from '../../src/components/vendor/VendorLogo';
import { LiveReasoning, RawOutput, useLive } from './LivePanels';

function fmt(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (Array.isArray(v)) return v.length ? v.join(' · ') : '—';
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString('en-IN') : v.toFixed(2);
  return String(v);
}
const label = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase();

function Gauge({ score }: { score: number | null }) {
  const col = scoreColor(score), r = 70, c = Math.PI * r;
  return (
    <svg viewBox="0 0 180 104" className="w-44">
      <path d="M20 94 A70 70 0 0 1 160 94" stroke="#e2e8f0" strokeWidth="14" fill="none" strokeLinecap="round" />
      <motion.path d="M20 94 A70 70 0 0 1 160 94" stroke={col} strokeWidth="14" fill="none" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * (score ?? 0)) / 100 }} transition={{ duration: 1 }} />
      <text x="90" y="84" textAnchor="middle" fontSize="34" fontWeight="700" fill="#0f172a">{score ?? '…'}</text>
      <text x="90" y="100" textAnchor="middle" fontSize="9" fill="#64748b" letterSpacing="2">RISK / 100</text>
    </svg>
  );
}

function Running({ a }: { a: FullAudit }) {
  const lines = ['Querying vendors, transactions, disputes…', 'Masking vendor identifiers (privacy)…', 'Sending aggregates to the AI auditor…', 'Model is reasoning step by step…'];
  const [i, setI] = useState(0);
  useEffect(() => { const t = window.setInterval(() => setI((x) => (x + 1) % lines.length), 1800); return () => window.clearInterval(t); }, []);
  return (
    <div className="glass rounded-3xl p-8 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50"><Bot className="h-8 w-8 animate-pulse text-indigo-600" /></div>
      <div className="text-lg font-semibold text-white">Auditing {a.vendor?.name} · {inr(a.amount)}</div>
      <AnimatePresence mode="wait"><motion.p key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-sm text-slate-400">{lines[i]}</motion.p></AnimatePresence>
    </div>
  );
}

function Report({ a }: { a: FullAudit }) {
  if (a.status !== 'done') return (<><Running a={a} /><DataUsed a={a} /></>);
  const tone = a.verdict ? VERDICT_TONE[a.verdict] : null, col = scoreColor(a.score);
  return (
    <div className="space-y-5">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass relative overflow-hidden rounded-3xl border-t-4 p-6" style={{ borderTopColor: col }}>
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(600px 200px at 10% 0%, ${col}22, transparent)` }} />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
          <Gauge score={a.score} />
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide" style={{ background: `${col}22`, color: col }}>
              {a.score != null && a.score >= 55 ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />} {tone?.label.toUpperCase()}
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-white">{a.headline}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{a.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
              <span className="rounded-full bg-white/5 px-2.5 py-1">{a.vendor?.name} · {a.vendor?.city}</span>
              <span className="rounded-full bg-white/5 px-2.5 py-1">{inr(a.amount)} · {a.kind === 'full' ? 'full AI audit' : 'quick check'}</span>
              <span className="rounded-full bg-white/5 px-2.5 py-1">{a.source === 'ai' ? '🤖 ' : ''}{a.model}{a.latency_ms ? ` · ${(a.latency_ms / 1000).toFixed(1)} s` : ''}</span>
              <span className="rounded-full bg-white/5 px-2.5 py-1">fee {inr(a.fee)} ({a.fee_tier}) · simulated</span>
              <span className="rounded-full bg-white/5 px-2.5 py-1">ref {a.transaction_ref}</span>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="glass rounded-3xl p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white"><Sparkles className="h-4 w-4 text-indigo-600" /> AI reasoning</h3>
        <ol className="relative space-y-4 border-l border-white/10 pl-6">
          {(a.reasoning || []).map((s, i) => {
            const Icon = s.impact === 'raises' ? ArrowUpRight : s.impact === 'lowers' ? ArrowDownRight : Minus;
            const c = s.impact === 'raises' ? '#f97316' : s.impact === 'lowers' ? '#10b981' : '#94a3b8';
            return (
              <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative">
                <span className="absolute -left-[35px] grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white ring-4 ring-white" style={{ background: c }}>{i + 1}</span>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-white">{s.title}</div>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${c}1f`, color: c }}><Icon className="h-3 w-3" /> {s.impact} risk</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{s.detail}</p>
                  {s.evidence.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {s.evidence.map((e) => <code key={e} className="rounded-lg bg-indigo-500/10 px-2 py-1 font-code text-[11px] text-indigo-700">{e}</code>)}
                    </div>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="glass rounded-3xl p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-white"><Building2 className="h-4 w-4 text-orange-500" /> Vendor issues</h3>
          {(a.vendorIssues || []).length ? <ul className="space-y-2">{a.vendorIssues!.map((x) => <li key={x} className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-orange-900">{x}</li>)}</ul>
            : <p className="text-sm text-slate-400">No vendor issues found.</p>}
        </section>
        <section className="glass rounded-3xl p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-white"><ShieldAlert className="h-4 w-4 text-red-500" /> Security issues</h3>
          {(a.securityIssues || []).length ? <ul className="space-y-2">{a.securityIssues!.map((x) => <li key={x} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-900">{x}</li>)}</ul>
            : <p className="text-sm text-slate-400">No security issues found.</p>}
        </section>
      </div>

      <section className="glass rounded-3xl p-5">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-white"><ScrollText className="h-4 w-4 text-cyan-300" /> Recommendation</h3>
        <p className="text-sm text-slate-200">{a.recommendation}</p>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {a.privacyNote} The customer only sees the score and key points.</p>
      </section>
      <DataUsed a={a} />
    </div>
  );
}

function DataUsed({ a }: { a: FullAudit }) {
  return (
    <section className="glass rounded-3xl p-6">
      <h3 className="mb-1 flex items-center gap-2 font-semibold text-white"><Database className="h-4 w-4 text-cyan-300" /> Data taken from the bank database</h3>
      <p className="mb-4 text-xs text-slate-400">Exactly what the AI auditor received. Vendor identifiers are masked; customers appear only as aggregates.</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(a.data_used || []).map((t) => (
          <div key={t.table} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
            <div className="mb-2 font-code text-[11px] uppercase tracking-wider text-cyan-300">{t.table}</div>
            <dl className="space-y-1">
              {Object.entries(t.fields).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 text-xs"><dt className="text-slate-400">{label(k)}</dt><dd className="text-right font-medium text-slate-100 break-all">{fmt(v)}</dd></div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomerCard({ a }: { a: FullAudit }) {
  const cu = a.customer;
  if (!cu) return null;
  const hist = a.data_used?.find((t) => t.table.startsWith('transactions (this customer'))?.fields ?? {};
  const rows: [string, string][] = [
    ['Customer', `${cu.name} (${cu.customerId})`], ['Account', cu.account], ['KYC', cu.kycLevel ?? '—'], ['Customer since', cu.customerSince ?? '—'],
    ['Demo balance', inr(cu.balanceDemo)], ['AI audit', cu.aiAuditEnabled ? 'on' : 'off (opted out)'], ['Device', a.device],
    ['All transactions', `${cu.transactions} · ${inr(cu.volume)} · ${cu.merchants} merchants`], ['Audits run', String(cu.audits)],
    ...Object.entries(hist).map(([k, v]) => [`With this vendor: ${label(k)}`, fmt(v)] as [string, string]),
  ];
  return (
    <section className="glass rounded-3xl p-5">
      <h3 className="mb-1 flex items-center gap-2 font-semibold text-slate-900"><UserRound className="h-4 w-4 text-indigo-600" /> Customer details</h3>
      <p className="mb-3 text-xs text-slate-500">Bank-internal only (simulated demo customer). Not sent to the AI model and not shown on the phone.</p>
      <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-slate-100 py-1"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-900">{v}</dd></div>)}
      </dl>
    </section>
  );
}

type Tab = 'report' | 'live' | 'raw';
function Detail({ a }: { a: FullAudit }) {
  const [tab, setTab] = useState<Tab>(a.status === 'running' ? 'live' : 'report');
  const live = useLive(a);
  useEffect(() => { setTab(a.status === 'running' ? 'live' : 'report'); }, [a.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const tabs: [Tab, string][] = [['report', 'Audit report'], ['live', a.status === 'running' ? 'Live reasoning ●' : 'Live reasoning'], ['raw', 'Model & raw output']];
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Audit views" className="inline-flex flex-wrap rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === id ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>{l}</button>
        ))}
      </div>
      {tab === 'report' ? <><Report a={a} /><CustomerCard a={a} /></> : tab === 'live' ? <LiveReasoning a={a} live={live} /> : <RawOutput a={a} live={live} />}
    </div>
  );
}

export default function App() {
  const [audits, setAudits] = useState<FullAudit[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [dbName, setDbName] = useState('');
  const [down, setDown] = useState(false);
  useEffect(() => {
    const load = () => bank.audits().then((r) => { setAudits(r.audits); setDbName(r.database); setDown(false); }).catch(() => setDown(true));
    load(); const t = window.setInterval(load, 2500); return () => window.clearInterval(t);
  }, []);
  const current = useMemo(() => audits.find((a) => a.id === sel) ?? audits[0], [audits, sel]);
  const stats = useMemo(() => {
    const done = audits.filter((a) => a.status === 'done');
    return { total: audits.length, flagged: done.filter((a) => (a.score ?? 0) >= 55).length, ai: done.filter((a) => a.source === 'ai').length,
      avg: done.length ? Math.round(done.reduce((s, a) => s + (a.score ?? 0), 0) / done.length) : 0 };
  }, [audits]);

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-800">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-3 px-4 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg"><FileSearch className="h-5 w-5 text-white" /></div>
          <div className="mr-auto">
            <div className="font-semibold text-white">PAYRAKSHA AI Auditor</div>
            <div className="text-[11px] tracking-wide text-slate-400">SERVER-SIDE · BANK INTERNAL · DEMO / SIMULATION</div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"><Database className="h-3.5 w-3.5 text-cyan-300" /> {dbName === 'postgres' ? 'PostgreSQL (Docker)' : dbName ? 'SQLite fallback' : '…'}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${down ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${down ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} /> {down ? 'API offline' : 'Live'}
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-[96rem] gap-5 px-4 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[['Audits', stats.total], ['Flagged', stats.flagged], ['By AI model', stats.ai], ['Avg risk', stats.avg]].map(([k, v]) => (
              <div key={k as string} className="glass rounded-2xl p-3"><div className="text-[11px] uppercase tracking-wide text-slate-400">{k}</div><div className="text-xl font-semibold text-white tabular-nums">{v}</div></div>
            ))}
          </div>
          <div className="glass rounded-3xl p-2">
            <div className="px-3 pb-1 pt-2 text-xs uppercase tracking-wide text-slate-400">Audit queue</div>
            {audits.length === 0 && <p className="p-3 text-sm text-slate-400">Waiting for a vendor payment scan from RakshaPay…</p>}
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto" aria-label="Audit queue">
              {audits.map((a) => (
                <li key={a.id}>
                  <button onClick={() => setSel(a.id)} className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition ${current?.id === a.id ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}>
                    {a.vendor && <VendorLogo v={a.vendor} size={36} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{a.vendor?.name}</span>
                      <span className="block text-[11px] text-slate-400">{inr(a.amount)} · {new Date(a.createdAt).toLocaleTimeString()}</span>
                    </span>
                    {a.status === 'running' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                      : <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(a.score) }}>{a.score}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <section className="min-w-0">
          {current ? <Detail a={current} /> : (
            <div className="glass grid min-h-[50vh] place-items-center rounded-3xl p-8 text-center">
              <div><Bot className="mx-auto h-10 w-10 text-indigo-600" /><p className="mt-3 text-slate-300">No audits yet. Scan a vendor QR above ₹10,000 on RakshaPay.</p></div>
            </div>
          )}
        </section>
      </main>
      <footer className="pb-6 text-center text-[11px] text-slate-500">DEMO / SIMULATION: no real payments, banks or vendors are audited. Brand names used for a hackathon demo only; not affiliated.</footer>
    </div>
  );
}
