import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { getBackendHealth, analyzeRisk } from '../services/api';
import { useDemoStore } from '../store/demoStore';
import { analyzeLocal, scenarioToInput, getScenario } from '../engine';
import { levelTheme } from '../lib/risk';
import { PageShell } from '../components/layout';
import { SimulationBadge, Button, ButtonLink, ErrorNotice } from '../components/ui';
import {
  HudPanel,
  KpiTile,
  StatusPill,
  ScamRadar,
  simulatedFeed,
} from '../components/soc';
import type { SimEvent } from '../components/soc';

const STEP_MS = 450;

const EVENT_TEXTS = [
  'QR detected',
  'Payment metadata extracted',
  'Recipient analyzed',
  'Context evaluated',
  'Social-engineering signals detected',
  'Risk calculation complete',
] as const;

const EVENT_OFFSETS = [0, 1, 1, 2, 2, 3] as const;

type Phase = 'idle' | 'scanning' | 'done';

interface ScanResult {
  report: ReturnType<typeof analyzeLocal>;
  source: string;
  ml: unknown;
  latencyMs: number;
}

function formatTimestamp(start: Date, offsetSeconds: number): string {
  const d = new Date(start.getTime() + offsetSeconds * 1000);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

interface EventEntry {
  timestamp: string;
  text: string;
}

export default function LiveProtection() {
  const [healthText, setHealthText] = useState('Checking engine…');
  const [phase, setPhase] = useState<Phase>('idle');
  const [scanEvents, setScanEvents] = useState<EventEntry[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Radar state
  const [radarNow] = useState(() => Date.now());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [userSelectedContact, setUserSelectedContact] = useState(false);
  const radarIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const history = useDemoStore((s) => s.history);
  const recordAnalysis = useDemoStore((s) => s.recordAnalysis);
  const latestReport = history[0]?.report ?? null;

  const reducedMotion = useReducedMotion();
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scanIdRef = useRef(0);
  const mountedRef = useRef(true);

  const radarEvents = simulatedFeed({ now: radarNow });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
    };
  }, []);

  // Auto-cycle active contact
  useEffect(() => {
    if (reducedMotion || userSelectedContact || radarEvents.length === 0) return;

    let idx = 0;
    setActiveId(radarEvents[0].id);

    const id = setInterval(() => {
      idx = (idx + 1) % radarEvents.length;
      setActiveId(radarEvents[idx].id);
    }, 2500);
    radarIntervalRef.current = id;

    return () => {
      clearInterval(id);
      radarIntervalRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, userSelectedContact, radarNow]);

  useEffect(() => {
    let mounted = true;
    getBackendHealth()
      .then((health) => {
        if (!mounted) return;
        if (health?.status === 'ok') {
          setHealthText(`Python risk engine online (v${health.engine.version})`);
        } else {
          setHealthText('Backend offline: in-browser engine active');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setHealthText('Backend offline: in-browser engine active');
      });
    return () => {
      mounted = false;
    };
  }, []);

  function handleSelectContact(event: SimEvent) {
    setActiveId(event.id);
    setUserSelectedContact(true);
    if (radarIntervalRef.current !== null) {
      clearInterval(radarIntervalRef.current);
      radarIntervalRef.current = null;
    }
  }

  function startScan() {
    if (phase === 'scanning') return;

    // Clear previous timeouts
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];

    scanIdRef.current += 1;
    const currentScanId = scanIdRef.current;

    setPhase('scanning');
    setScanEvents([]);
    setResult(null);
    setError(null);

    const scanStart = new Date();
    const input = scenarioToInput('utility_scam');

    // Start analysis
    let analysisResult: ScanResult | null = null;
    let analysisError: Error | null = null;
    let analysisSettled = false;

    const promise = analyzeRisk(input);
    promise
      .then((res) => {
        if (scanIdRef.current !== currentScanId || !mountedRef.current) return;
        analysisResult = res as ScanResult;
        analysisSettled = true;
      })
      .catch((err: Error) => {
        if (scanIdRef.current !== currentScanId || !mountedRef.current) return;
        analysisError = err;
        analysisSettled = true;
      });

    if (reducedMotion) {
      // Reveal all events at once
      const allEvents = EVENT_TEXTS.map((text, i) => ({
        timestamp: formatTimestamp(scanStart, EVENT_OFFSETS[i]),
        text,
      }));
      setScanEvents(allEvents);

      // Wait for analysis then finish
      const check = setInterval(() => {
        if (!mountedRef.current || scanIdRef.current !== currentScanId) {
          clearInterval(check);
          return;
        }
        if (analysisSettled) {
          clearInterval(check);
          if (analysisError || !analysisResult) {
            setError('Scan failed. Try again.');
            setPhase('idle');
            return;
          }
          setResult(analysisResult);
          setPhase('done');
          recordAnalysis({
            label: 'Live scan (QR001 demo)',
            input,
            report: analysisResult.report,
            source: analysisResult.source as 'python-api' | 'browser',
            ml: analysisResult.ml as import('../types').MlInsight | null,
            latencyMs: analysisResult.latencyMs,
          });
        }
      }, 50);
    } else {
      // Reveal events one by one
      let lastEventIndex = -1;

      const revealNext = (index: number) => {
        if (!mountedRef.current || scanIdRef.current !== currentScanId) return;
        lastEventIndex = index;
        setScanEvents((prev) => [
          ...prev,
          {
            timestamp: formatTimestamp(scanStart, EVENT_OFFSETS[index]),
            text: EVENT_TEXTS[index],
          },
        ]);

        if (index < EVENT_TEXTS.length - 1) {
          const id = setTimeout(() => revealNext(index + 1), STEP_MS);
          timeoutIds.current.push(id);
        } else {
          // Last event shown; now wait for analysis
          const waitForAnalysis = () => {
            if (!mountedRef.current || scanIdRef.current !== currentScanId) return;
            if (analysisSettled) {
              if (analysisError || !analysisResult) {
                setError('Scan failed. Try again.');
                setPhase('idle');
                return;
              }
              setResult(analysisResult);
              setPhase('done');
              recordAnalysis({
                label: 'Live scan (QR001 demo)',
                input,
                report: analysisResult.report,
                source: analysisResult.source as 'python-api' | 'browser',
                ml: analysisResult.ml as import('../types').MlInsight | null,
                latencyMs: analysisResult.latencyMs,
              });
            } else {
              const id = setTimeout(waitForAnalysis, 50);
              timeoutIds.current.push(id);
            }
          };
          waitForAnalysis();
        }
      };

      const id = setTimeout(() => revealNext(0), STEP_MS);
      timeoutIds.current.push(id);
      void lastEventIndex;
    }
  }

  const score = result?.report.score ?? 0;
  const level = result?.report.level ?? 'LOW';
  const theme = levelTheme(level);
  const payment = result?.report.payment;
  const explanation = result?.report.explanation;

  const amountFormatted =
    payment?.amount != null
      ? payment.amount.toLocaleString('en-IN')
      : '—';

  const statusText =
    phase === 'idle'
      ? 'Protection Engine Ready'
      : phase === 'scanning'
      ? 'Scanning…'
      : 'Scan complete';

  // KPI strip
  const heldCount = radarEvents.filter((e) => e.status === 'HELD').length;
  const checkCount = radarEvents.filter((e) => e.status === 'CHECK').length;
  const lowCount = radarEvents.filter((e) => e.status === 'LOW').length;

  // Active event dossier
  const activeEvent = radarEvents.find((e) => e.id === activeId) ?? radarEvents[0] ?? null;

  const inputCards = [
    { label: 'SCAN QR', path: '/qr', emoji: '📷', desc: 'Scan or upload a QR code' },
    { label: 'PASTE MESSAGE', path: '/message', emoji: '💬', desc: 'Paste a suspicious message' },
    { label: 'CHECK URL', path: '/url', emoji: '🌐', desc: 'Verify a suspicious link' },
    { label: 'ANALYZE PAYMENT', path: '/payment', emoji: '💰', desc: 'Check payment details' },
  ];

  return (
    <PageShell
      eyebrow="MONITOR"
      title="LIVE PAYMENT SAFETY"
      subtitle="Scan, paste or check before you pay — simulation only."
      width="wide"
    >
      <SimulationBadge />

      {/* Status pill */}
      <div role="status" className="flex items-center gap-3 mb-4">
        <StatusPill tone={phase === 'idle' ? 'green' : phase === 'scanning' ? 'amber' : 'cyan'} pulse={phase === 'scanning'}>
          {statusText}
        </StatusPill>
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.14em]">{healthText}</span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiTile label="Contacts on radar" value={radarEvents.length} tone="cyan" hint="SIMULATED" />
        <KpiTile label="Held for review" value={heldCount} tone="red" hint="SIMULATED" />
        <KpiTile label="Check before paying" value={checkCount} tone="amber" hint="SIMULATED" />
        <KpiTile label="Low risk" value={lowCount} tone="green" hint="SIMULATED" />
      </div>

      {/* Radar + Dossier row */}
      <div className="grid gap-4 lg:grid-cols-12 mb-6">
        <HudPanel
          eyebrow="THREAT RADAR · SIMULATION"
          title="Incoming contacts"
          className="lg:col-span-7"
          bodyClassName="p-3"
        >
          <ScamRadar
            events={radarEvents}
            activeId={activeId ?? (radarEvents[0]?.id ?? null)}
            onSelect={handleSelectContact}
          />
        </HudPanel>

        <HudPanel
          eyebrow="CONTACT DOSSIER"
          title={activeEvent?.title ?? 'No contact selected'}
          className="lg:col-span-5"
          bodyClassName="p-4"
          data-testid="contact-dossier"
        >
          {activeEvent ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="hud-label">{activeEvent.channel}</span>
                <StatusPill tone={activeEvent.level === 'HIGH' ? 'red' : activeEvent.level === 'HIGH_CAUTION' ? 'orange' : activeEvent.level === 'CAUTION' ? 'amber' : 'green'}>
                  {activeEvent.level.replace('_', ' ')}
                </StatusPill>
              </div>
              <div>
                <p className="hud-label mb-0.5">Handle</p>
                <p className="font-mono text-[11px] text-cyan-300">{activeEvent.handle}</p>
              </div>
              {activeEvent.amount !== null && (
                <div>
                  <p className="hud-label mb-0.5">Amount</p>
                  <p className="font-mono text-[11px] text-slate-200">₹{activeEvent.amount.toLocaleString('en-IN')} <span className="text-slate-500">(DEMO)</span></p>
                </div>
              )}
              <div>
                <p className="hud-label mb-0.5">Risk Score</p>
                <p className="font-mono text-[13px] font-semibold text-red-400">
                  RISK {activeEvent.score}
                </p>
              </div>
              <div>
                <p className="hud-label mb-0.5">Status</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-300">
                  {activeEvent.status === 'HELD' ? 'HELD FOR REVIEW' : activeEvent.status === 'CHECK' ? 'CHECK BEFORE PAYING' : 'LOW RISK'}
                </p>
              </div>
              {activeEvent.report.patternName && (
                <div>
                  <p className="hud-label mb-0.5">Pattern</p>
                  <p className="font-mono text-[10px] text-slate-300">{activeEvent.report.patternName}</p>
                </div>
              )}
              {activeEvent.report.dna
                .filter((strand) => strand.severity !== 'none')
                .slice(0, 4)
                .map((strand) => (
                  <p key={strand.key} className="font-mono text-[10px] text-amber-300/80">
                    ▸ {strand.label}
                  </p>
                ))}
              <p className="font-mono text-[9px] text-cyan-400/40 uppercase tracking-[0.18em] mt-1">SIMULATION</p>
            </div>
          ) : (
            <p className="font-mono text-[10px] text-slate-500 uppercase">No contact selected</p>
          )}
        </HudPanel>
      </div>

      {/* Input cards */}
      <HudPanel
        eyebrow="INPUT CHANNELS · SIMULATION"
        title="Check before you pay"
        className="mb-6"
        bodyClassName="p-4"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {inputCards.map((card) => (
            <ButtonLink
              key={card.label}
              to={card.path}
              variant="outline"
              className="flex flex-col items-center gap-2 py-4 text-center"
            >
              <span className="text-2xl">{card.emoji}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{card.label}</span>
              <span className="text-[10px] text-slate-400 normal-case font-sans">{card.desc}</span>
            </ButtonLink>
          ))}
        </div>
      </HudPanel>

      {/* Live scan console */}
      <HudPanel
        eyebrow="LIVE SCANNER · SIMULATION"
        title="Scanner Console"
        className="mb-6"
        bodyClassName="p-4"
        right={
          <StatusPill tone={phase === 'scanning' ? 'amber' : 'cyan'} pulse={phase === 'scanning'}>
            {phase === 'scanning' ? 'SCANNING' : phase === 'done' ? 'DONE' : 'READY'}
          </StatusPill>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Scan button */}
          <Button
            variant="danger"
            size="lg"
            fullWidth
            className="min-h-14 shadow-glow-high text-lg font-bold"
            onClick={startScan}
            disabled={phase === 'scanning'}
            aria-busy={phase === 'scanning'}
          >
            START LIVE SCAN
          </Button>
          {error && <ErrorNotice message={error} />}

          {/* Event log */}
          {scanEvents.length > 0 && (
            <div
              role="log"
              aria-label="Live event stream"
              aria-live="polite"
              className="bg-black/60 border border-cyan-400/10 rounded-sm p-3 font-mono text-[11px]"
            >
              <ol>
                {scanEvents.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2 py-0.5">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-400">{ev.timestamp} — {ev.text}</span>
                  </li>
                ))}
                {phase === 'scanning' && !reducedMotion && (
                  <li className="flex items-start gap-2 py-0.5">
                    <span className="text-cyan-400 animate-blink">▋</span>
                  </li>
                )}
              </ol>
            </div>
          )}

          {/* Result */}
          {result && phase === 'done' && (
            <div
              data-testid="risk-result"
              data-score={result.report.score}
              className="flex flex-col gap-4 border border-dashed border-cyan-400/20 rounded-sm p-4"
            >
              <div className="flex items-center gap-2">
                <span className="hud-label">RISK SCORE</span>
                <span className={`font-mono text-lg font-semibold ${theme.hex ? '' : ''}`} style={{ color: theme.hex }}>
                  {result.report.score} / 100
                </span>
                <span
                  role="meter"
                  aria-label="Risk score"
                  aria-valuenow={result.report.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="sr-only"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {result.report.levelLabel && (
                  <StatusPill
                    tone={level === 'HIGH' ? 'red' : level === 'HIGH_CAUTION' ? 'orange' : level === 'CAUTION' ? 'amber' : 'green'}
                  >
                    {result.report.levelLabel}
                  </StatusPill>
                )}
              </div>

              {payment && (
                <div className="flex flex-col gap-1">
                  {payment.recipient && (
                    <p className="font-mono text-[11px] text-slate-300">
                      <span className="hud-label mr-2">To:</span>{payment.recipient}
                    </p>
                  )}
                  {payment.amount != null && (
                    <p className="font-mono text-[11px] text-slate-300">
                      <span className="hud-label mr-2">Amount:</span>₹{amountFormatted}
                    </p>
                  )}
                </div>
              )}

              {explanation && (
                <p className="text-sm text-slate-300">{explanation.summary}</p>
              )}

              <ButtonLink
                to="/explain"
                variant="outline"
              >
                VIEW FULL ANALYSIS
              </ButtonLink>
            </div>
          )}
        </div>
      </HudPanel>

      {/* Recent analyses / history */}
      <section className="mb-6">
        <h3 className="hud-title mb-4">Recent analyses (this session)</h3>
        {history.length === 0 ? (
          <div className="hud-panel p-4">
            <p className="text-sm text-slate-400">
              No analyses yet. Try a demo QR.{' '}
              <Link to="/qr?demo=QR001" className="text-cyan-400 underline">
                Try demo QR
              </Link>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((record) => (
              <div key={record.id} className="hud-panel px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] font-semibold text-slate-200">{record.label}</p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {new Date(record.at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] font-semibold text-cyan-300">{record.report.score}</span>
                  <span className="text-sm text-slate-400">{record.report.levelLabel}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Protection layers (matching existing hidden sections) */}
      <section className="mb-6 hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'QR shield', path: '/qr' },
            { id: 'Message shield', path: '/message' },
            { id: 'URL shield', path: '/url' },
          ].map((layer) => (
            <div key={layer.id} className="hud-panel flex flex-col items-start gap-2 p-4">
              <span className="font-semibold text-slate-200">{layer.id}</span>
              <Link to={layer.path} className="text-sm text-cyan-400 underline">
                Active (demo)
              </Link>
            </div>
          ))}
        </div>
      </section>

      <ButtonLink
        to="/simulation"
        variant="danger"
        fullWidth
        className="text-center text-lg py-4 font-bold"
      >
        🚨 RUN LIVE SCAM SIMULATION
      </ButtonLink>
    </PageShell>
  );
}
