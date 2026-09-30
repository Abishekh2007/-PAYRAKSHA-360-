import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { Button } from '../components/ui';
import { PhoneMirror } from '../components/link/PhoneMirror';
import { useLinkFeed, fetchLinkInfo, setLinkTarget, resetLink } from '../services/link';
import type { LinkInfo } from '../types/link';
import { qrScenarios, fmtINR, analyzeLocal } from '../engine';
import { generateQrSvg, svgToDataUrl } from '../services/qr';
import { useDemoStore } from '../store/demoStore';
import { socToneForLevel, SOC_TONES } from '../components/soc';

export default function DeviceLink() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<LinkInfo | null>(null);
  const { events, devices, reachable, target } = useLinkFeed();
  const scenarios = useMemo(() => qrScenarios(), []);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = scenarios[scenarioIdx];
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [presenting, setPresenting] = useState(false);
  const [flashMsg, setFlashMsg] = useState<{ msg: string } | null>(null);
  const [manualPhoneUrl, setManualPhoneUrl] = useState<string>('');

  useEffect(() => {
    fetchLinkInfo().then(setInfo);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('payraksha.phoneUrl');
      if (stored) setManualPhoneUrl(stored);
    } catch {}
  }, []);

  useEffect(() => {
    if (scenario) {
      setLinkTarget(scenario.qrText, scenario.title);
      generateQrSvg(scenario.qrText).then(svg => setQrDataUrl(svgToDataUrl(svg)));
    }
  }, [scenario]);

  useEffect(() => {
    if (events.length > 0) {
      const e = events[0];
      if (e.input.qrText === scenario?.qrText) {
        setFlashMsg({ msg: `SCANNED BY ${e.device} · RISK ${e.score}` });
        const timer = setTimeout(() => setFlashMsg(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [events[0]?.id, events[0]?.seq, scenario?.qrText]);

  const handleSavePhoneUrl = () => {
    try {
      localStorage.setItem('payraksha.phoneUrl', manualPhoneUrl);
    } catch {}
  };

  const handleNextQr = () => setScenarioIdx(i => (i + 1) % scenarios.length);
  const handlePrevQr = () => setScenarioIdx(i => (i - 1 + scenarios.length) % scenarios.length);
  const handleResetLink = async () => { await resetLink(); };

  const phoneUrlBase = manualPhoneUrl || info?.phoneUrl || info?.payUrl || window.location.origin;
  const payPort = info?.payUrl ? new URL(info.payUrl).port : '7481';

  const [phoneQr, setPhoneQr] = useState<string>('');
  useEffect(() => {
    generateQrSvg(phoneUrlBase).then(svg => setPhoneQr(svgToDataUrl(svg)));
  }, [phoneUrlBase]);

  // Support ESC to close full screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPresenting(false); };
    if (presenting) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting]);

  return (
    <PageShell title="Device Link">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <div className="hud-eyebrow text-slate-400 mb-1">PHONE LINK · SIMULATION</div>
            <h1 className="text-3xl font-display text-white mb-2">Device Link</h1>
            <p className="text-sm text-slate-300">Scan a demo QR with RakshaPay on your phone — the check appears here live.</p>
            <p className="text-sm text-slate-400 mt-2">SIMULATION ONLY: nothing here moves money.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`chip ${reachable ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {reachable ? 'Link server online' : 'Link server offline'}
            </div>
            <Button variant="outline" size="sm" onClick={handleResetLink}>Reset link</Button>
          </div>
        </div>

        {!reachable && (
          <div className="p-5 glass border border-red-500/20 rounded-2xl mb-6 bg-red-500/5">
            <p className="text-sm text-red-200">The link server isn't reachable. Start PAYRAKSHA with the launcher (or <code className="font-code bg-black/20 px-1 rounded">npm run dev:all</code>) so the phone and the console share one backend.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="glass rounded-2xl p-6 border border-white/10 flex flex-col items-center">
              <div className="chip bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 self-start mb-4">DEMO QR</div>
              <div className="w-full relative mb-4">
                <div className="bg-white p-3 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center relative">
                  {qrDataUrl && <img src={qrDataUrl} alt={`Demo QR: ${scenario?.title}`} className="w-full h-full" />}
                  {flashMsg && (
                    <div role="status" className="absolute inset-0 bg-black/80 flex items-center justify-center text-center p-2 rounded-xl backdrop-blur-sm">
                      <span className="text-white font-display text-sm font-semibold">{flashMsg.msg}</span>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="hud-title text-center mb-6">{scenario?.title}</h3>
              <div className="flex items-center justify-between w-full">
                <Button variant="ghost" size="sm" onClick={handlePrevQr} aria-label="Previous QR">Prev</Button>
                <div className="flex gap-1.5">
                  {scenarios.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === scenarioIdx ? 'bg-cyan-400' : 'bg-white/20'}`} />
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={handleNextQr} aria-label="Next QR">Next</Button>
              </div>
              <div className="mt-4 w-full">
                <Button variant="outline" fullWidth onClick={() => setPresenting(true)}>Present</Button>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10">
              <h3 className="hud-title mb-4">Linked devices</h3>
              {devices.length === 0 ? (
                <p className="text-sm text-slate-400">No devices connected</p>
              ) : (
                <ul className="space-y-3">
                  {devices.map((d, i) => (
                    <li key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">{d.name}</span>
                      {d.online ? (
                        <span className="text-green-400 text-xs uppercase tracking-wider font-medium">Online</span>
                      ) : (
                        <span className="text-slate-500 text-xs text-right">Last seen {d.lastSeen}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <PhoneMirror event={events[0] ?? null} />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="glass rounded-2xl p-6 border border-white/10">
              <h3 className="hud-title mb-4">Open RakshaPay on your phone</h3>
              <div className="flex gap-4 mb-4 items-start">
                <div className="bg-white p-2 rounded-2xl flex-shrink-0 w-24 h-24">
                  {phoneQr && <img src={phoneQr} alt="Phone URL QR" className="w-full h-full" />}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    aria-label="RakshaPay address"
                    value={manualPhoneUrl}
                    onChange={(e) => setManualPhoneUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                  />
                  <Button variant="outline" size="sm" fullWidth onClick={handleSavePhoneUrl}>Save</Button>
                </div>
              </div>
              <ol className="text-sm text-slate-300 space-y-3 list-decimal list-inside pl-1">
                <li>On this computer run <code className="font-code bg-black/20 px-1 rounded">tailscale serve --bg {payPort}</code></li>
                <li>Open the https://….ts.net address on your phone (or scan this QR)</li>
                <li>Tap Scan what the console shows, or point the camera at the QR</li>
              </ol>
              <div className="mt-4 text-xs text-slate-400 space-y-2">
                <p>Note: The camera needs HTTPS — tailscale serve provides it. Stop sharing: <code className="font-code">tailscale serve --https=443 off</code>.</p>
                {info?.lan && <p>LAN mode: RakshaPay also answers on http://&lt;tailscale-ip&gt;:{payPort} (no camera).</p>}
              </div>
            </div>

            <div className="glass rounded-2xl border border-white/10 flex flex-col max-h-[500px]"
                 role="list" aria-label="Phone check feed">
              <div className="p-4 border-b border-white/5 bg-black/10">
                <h3 className="hud-title">Live feed</h3>
              </div>
              <div className="p-4 flex flex-col gap-4 overflow-y-auto w-full no-scrollbar">
                {events.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No phone checks yet.</p>
                ) : (
                  events.map(e => {
                    const tone = socToneForLevel(e.level);
                    const color = SOC_TONES[tone];
                    return (
                      <div key={`${e.id}-${e.seq}`} className="bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-medium text-slate-300">{e.device} · {e.source}</div>
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border font-medium ${color.border} ${color.bg} ${color.text}`}>
                            RISK {e.score}
                          </div>
                        </div>
                        <div className="text-sm text-white mt-1">
                          {e.recipient ?? 'Unknown'} <span className="text-slate-400">— {e.amount !== null ? fmtINR(e.amount) : '?'}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                          <div>
                            <div className={`text-xs ${color.text} font-medium`}>{e.levelLabel}</div>
                            <div className="text-xs text-slate-400">{e.decision}{e.simulation ? ' (demo)' : ''} · {new Date(e.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => {
                            useDemoStore.getState().recordAnalysis({
                              label: 'Phone · ' + e.device,
                              input: e.input,
                              report: analyzeLocal(e.input),
                              source: 'browser'
                            });
                            navigate('/explain');
                          }}>Open analysis</Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {presenting && (
        <div role="dialog" aria-label="Presenting demo QR" className="fixed inset-0 z-50 bg-navy-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-8">
          <Button variant="ghost" className="absolute top-6 right-6" onClick={() => setPresenting(false)}>Close</Button>
          <div className="max-w-2xl w-full aspect-square bg-white rounded-3xl p-8 relative flex items-center justify-center shadow-glass">
            {qrDataUrl && <img src={qrDataUrl} alt={`Demo QR: ${scenario?.title}`} className="w-full h-full object-contain" />}
            {flashMsg && (
              <div role="status" className="absolute inset-0 bg-black/80 flex items-center justify-center text-center p-4 rounded-3xl backdrop-blur-md">
                <span className="text-white font-display text-4xl font-semibold">{flashMsg.msg}</span>
              </div>
            )}
          </div>
          <div className="mt-8 text-center">
            <h2 className="text-3xl font-display text-white mb-2">{scenario?.title}</h2>
            <p className="text-slate-300">Point RakshaPay at this QR</p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
