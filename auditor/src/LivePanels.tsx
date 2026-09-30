// Bank-internal live view of one AI audit: model name, live reasoning as it streams, the raw model output and the prompt.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Braces, Cpu, Radio, ScrollText, Sparkles } from 'lucide-react';
import { bank, type AuditLive, type FullAudit } from '../../src/services/bank';

/** Polls the live view: every second while the audit runs, then once more when it is done. */
export function useLive(a: FullAudit | undefined) {
  const [live, setLive] = useState<AuditLive | null>(null);
  useEffect(() => {
    if (!a) return;
    let stop = false;
    const load = () => bank.live(a.id).then((l) => { if (!stop) setLive(l); }).catch(() => {});
    setLive(null);
    load();
    const t = a.status === 'running' ? window.setInterval(load, 1000) : undefined;
    return () => { stop = true; if (t) window.clearInterval(t); };
  }, [a?.id, a?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  return live;
}

/** Reasoning steps that have fully arrived in the streamed JSON so far (the model answers in JSON). */
export function partialSteps(text: string) {
  const out: { title: string; detail: string; impact: string }[] = [];
  const re = /"title"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"detail"\s*:\s*"((?:[^"\\]|\\.)*)"(?:[^}]*?"impact"\s*:\s*"(\w+)")?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ title: m[1].replace(/\\"/g, '"'), detail: m[2].replace(/\\"/g, '"'), impact: m[3] || 'neutral' });
  return out;
}

const STATUS_LABEL: Record<string, string> = {
  streaming: 'Streaming from model…', done: 'Completed', fallback: 'Model unreachable: simulated fallback', simulated: 'Simulated auditor (AI off)',
};
const impactColour = (i: string) => (i === 'raises' ? '#f97316' : i === 'lowers' ? '#10b981' : '#94a3b8');
const DARK_PRE = { background: '#0f172a', color: '#e2e8f0' };

export function ModelBar({ live, a }: { live: AuditLive | null; a: FullAudit }) {
  const st = live?.status ?? (a.status === 'running' ? 'streaming' : 'done');
  return (
    <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3 text-xs">
      <Cpu className="h-4 w-4 text-indigo-600" />
      <span className="text-slate-500">Model</span>
      <span className="font-semibold text-slate-900">{live?.model ?? a.model ?? '…'}</span>
      {live?.servedModel && live.servedModel !== live.model && <span className="text-slate-500">served as {live.servedModel}</span>}
      <span className={`rounded-full px-2 py-0.5 font-semibold ${st === 'streaming' ? 'bg-indigo-50 text-indigo-700' : st === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        {st === 'streaming' && <Radio className="mr-1 inline h-3 w-3 animate-pulse" />}{STATUS_LABEL[st] ?? st}
      </span>
      {live?.available && <span className="text-slate-500">{live.chunks} chunks · {((live.elapsedMs ?? 0) / 1000).toFixed(1)} s{live.usage?.total_tokens ? ` · ${live.usage.total_tokens} tokens` : ''}</span>}
      {live?.endpoint && <span className="ml-auto truncate font-code text-[11px] text-slate-400">{live.endpoint}</span>}
    </div>
  );
}

export function LiveReasoning({ a, live }: { a: FullAudit; live: AuditLive | null }) {
  const text = live?.text ?? '';
  const streaming = live?.status === 'streaming' || a.status === 'running';
  const steps = !streaming && a.reasoning?.length ? a.reasoning : partialSteps(text);
  return (
    <div className="space-y-4">
      <ModelBar live={live} a={a} />
      {live && !live.available && <p className="glass rounded-2xl p-4 text-sm text-slate-500">The live stream for this audit is no longer in memory (the server restarted). The final report is in the Audit report tab.</p>}
      {live?.error && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{live.error}</p>}
      <section className="glass rounded-3xl p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><Sparkles className="h-4 w-4 text-indigo-600" /> Reasoning steps {streaming ? 'arriving live' : 'from the model'}</h3>
        {steps.length === 0 && <p className="text-sm text-slate-500">{streaming ? 'Waiting for the first reasoning step…' : 'No reasoning steps returned.'}</p>}
        <ol className="space-y-3">
          <AnimatePresence initial={false}>
            {steps.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold" style={{ background: impactColour(s.impact), color: '#fff' }}>{i + 1}</span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{s.title} <span className="ml-1 text-[11px] font-medium" style={{ color: impactColour(s.impact) }}>{s.impact} risk</span></div>
                  <p className="mt-0.5 text-sm text-slate-600">{s.detail}</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </section>
      {(live?.thinking ?? '').length > 0 && (
        <section className="glass rounded-3xl p-6">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><Bot className="h-4 w-4 text-indigo-600" /> Model thinking (streamed)</h3>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 font-code text-[12px] leading-relaxed text-slate-700">{live!.thinking}{streaming && <span className="animate-pulse">▍</span>}</pre>
        </section>
      )}
      <section className="glass rounded-3xl p-6">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><Radio className="h-4 w-4 text-indigo-600" /> Live output stream</h3>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-2xl p-4 font-code text-[12px] leading-relaxed" style={{ background: '#0f172a', color: '#a7f3d0' }}>
          {text || (streaming ? 'Connecting to the model…' : '—')}{streaming && <span className="animate-pulse">▍</span>}
        </pre>
      </section>
    </div>
  );
}

export function RawOutput({ a, live }: { a: FullAudit; live: AuditLive | null }) {
  const [copied, setCopied] = useState(false);
  const raw = live?.text ?? '';
  const usage = live?.usage ? Object.entries(live.usage).filter(([, v]) => typeof v === 'number').map(([k, v]) => `${k.replace('_tokens', '')} ${v}`).join(' · ') : '—';
  const rows: [string, string][] = [
    ['Model', String(live?.model ?? a.model ?? '—')], ['Served model', String(live?.servedModel ?? '—')],
    ['Source', a.source === 'ai' ? 'AI model (OmniRoute)' : 'Simulated auditor'], ['Latency', a.latency_ms ? `${(a.latency_ms / 1000).toFixed(1)} s` : '—'],
    ['Finish reason', String(live?.finishReason ?? '—')], ['Tokens', usage],
  ];
  return (
    <div className="space-y-4">
      <ModelBar live={live} a={a} />
      <section className="glass rounded-3xl p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><Cpu className="h-4 w-4 text-indigo-600" /> Model call</h3>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-900">{v}</dd></div>
          ))}
        </dl>
      </section>
      <section className="glass rounded-3xl p-6">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Braces className="h-4 w-4 text-indigo-600" /> Raw model output</h3>
          <button className="ml-auto rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
            onClick={() => { navigator.clipboard?.writeText(raw).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-all rounded-2xl p-4 font-code text-[12px] leading-relaxed" style={DARK_PRE}>
          {raw || (live?.available === false ? 'Not in memory (server restarted).' : live?.error ? `No model output. ${live.error}` : '…')}
        </pre>
      </section>
      {live?.messages && (
        <section className="glass rounded-3xl p-6">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><ScrollText className="h-4 w-4 text-indigo-600" /> Prompt sent to the model</h3>
          {live.messages.map((m, i) => (
            <details key={i} className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 p-3" open={m.role === 'user'}>
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">{m.role}</summary>
              <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-all font-code text-[11.5px] text-slate-700">{m.content}</pre>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
