import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { getBackendHealth, analyzeRisk } from '../services/api';
import { useDemoStore } from '../store/demoStore';
import { analyzeLocal, scenarioToInput } from '../engine';
import { levelTheme } from '../lib/risk';
import { PageShell } from '../components/layout';
import { GlassCard, SimulationBadge, Badge, Button, ButtonLink, ErrorNotice } from '../components/ui';
import { EngineCore, GuardianRobot } from '../components/three';

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
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useDemoStore((s) => s.history);
  const recordAnalysis = useDemoStore((s) => s.recordAnalysis);
  const latestReport = history[0]?.report ?? null;

  const reducedMotion = useReducedMotion();
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scanIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
    };
  }, []);

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

  const mood =
    phase === 'scanning'
      ? 'thinking'
      : (result?.report.level === 'HIGH' || result?.report.level === 'HIGH_CAUTION') ||
        (latestReport?.level === 'HIGH' || latestReport?.level === 'HIGH_CAUTION')
      ? 'alert'
      : latestReport?.level === 'LOW'
      ? 'safe'
      : 'idle';

  function startScan() {
    if (phase === 'scanning') return;

    // Clear previous timeouts
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];

    scanIdRef.current += 1;
    const currentScanId = scanIdRef.current;

    setPhase('scanning');
    setEvents([]);
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
      setEvents(allEvents);

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
        setEvents((prev) => [
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

  const statusDot =
    phase === 'idle'
      ? 'bg-green-500 animate-pulse'
      : phase === 'scanning'
      ? 'bg-amber-500'
      : 'bg-blue-500';

  return (
    <PageShell
      eyebrow="Live Protection"
      title="LIVE PAYMENT SAFETY"
      subtitle="Scan, paste or check before you pay — simulation only."
      icon={<span>🛡️</span>}
    >
      <SimulationBadge />

      {/* Status pill */}
      <div role="status" className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full inline-block ${statusDot}`} />
          <span className="font-semibold text-sm">{statusText}</span>
        </div>
        <p className="text-xs text-gray-400 ml-4">{healthText}</p>
      </div>

      {/* Main scan button + 3D visual */}
      <GlassCard className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-center relative">
          <div className="w-full md:w-48 h-48 relative flex-shrink-0">
            <div className="absolute inset-0">
              <EngineCore level={result?.report.level ?? latestReport?.level ?? null} />
            </div>
            <div className="absolute inset-0 z-10 pointer-events-none">
              <GuardianRobot mood={mood} />
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-4 w-full">
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
          </div>
        </div>
      </GlassCard>

      {/* Four input cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'SCAN QR', path: '/qr', emoji: '📷', desc: 'Scan or upload a QR code' },
          { label: 'PASTE MESSAGE', path: '/message', emoji: '✉️', desc: 'Check an SMS or WhatsApp text' },
          { label: 'CHECK URL', path: '/url', emoji: '🔗', desc: 'Check a link before opening it' },
          { label: 'ANALYZE PAYMENT', path: '/payment', emoji: '💳', desc: 'Check the full payment context' },
        ].map((card) => (
          <Link key={card.label} to={card.path} className="block">
            <GlassCard className="h-full flex flex-col gap-1 hover:border-blue-400/60 transition-colors cursor-pointer">
              <span className="text-2xl">{card.emoji}</span>
              <span className="font-bold text-sm">{card.label}</span>
              <span className="text-xs text-gray-400">{card.desc}</span>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Live event stream */}
      {(phase === 'scanning' || phase === 'done') && events.length > 0 && (
        <GlassCard className="mb-8">
          <h3 className="text-sm font-bold mb-3 text-gray-300">Live event stream</h3>
          <ol role="log" aria-label="Live event stream" aria-live="polite" className="space-y-1">
            {events.map((ev, i) => (
              <li key={i} className="font-mono text-sm flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">
                  {ev.timestamp} — {ev.text}
                </span>
              </li>
            ))}
          </ol>
        </GlassCard>
      )}

      {/* Result */}
      {phase === 'done' && result && (
        <section
          data-testid="risk-result"
          data-score={String(score)}
          data-level={level}
          aria-label="Live scan result"
          className="mb-8"
        >
          <GlassCard>
            <div className="text-xs font-bold text-gray-400 mb-4 tracking-widest">RISK SCORE</div>

            {/* Gradient meter */}
            <div className="mb-6">
              <div className="relative mb-2">
                <div
                  role="meter"
                  aria-label="Risk score"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={score}
                  className="h-4 rounded-full"
                  style={{
                    background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444)',
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-800 shadow"
                  style={{
                    left: `${score}%`,
                    transform: 'translateX(-50%) translateY(-50%)',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Score display */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl font-bold">{score} / 100</span>
              <span className={`text-xl font-bold ${theme.text}`}>
                {theme.emoji} {theme.short}
              </span>
            </div>

            {/* Explanation */}
            {explanation && (
              <div className="mb-4">
                <p className="text-base font-semibold mb-2">{explanation.headline}</p>
                {explanation.reasons.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {explanation.reasons.slice(0, 3).map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Payment context */}
            {payment && (
              <p className="text-xs text-gray-400 mb-6">
                Demo payment: ₹{amountFormatted} to {payment.recipient ?? '—'} via{' '}
                {payment.sourceLabel} (SIMULATION)
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <ButtonLink to="/explain" variant="primary">
                VIEW FULL ANALYSIS
              </ButtonLink>
              <ButtonLink to="/simulation" variant="danger">
                WATCH FULL ATTACK SIMULATION
              </ButtonLink>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Protection layers */}
      <section className="mb-8">
        <h3 className="text-lg font-bold mb-4">Protection layers</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { id: 'QR Shield', path: '/qr' },
            { id: 'Message Shield', path: '/message' },
            { id: 'URL Shield', path: '/url' },
            { id: 'Payment Risk', path: '/payment' },
            { id: 'Trusted Contact', path: '/trusted' },
            { id: 'Elder Mode', path: '/elder' },
          ].map((layer) => (
            <GlassCard key={layer.id} className="flex flex-col items-start gap-2">
              <span className="font-semibold">{layer.id}</span>
              <Link to={layer.path} className="text-sm text-blue-400 underline">
                Active (demo)
              </Link>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Recent analyses */}
      <section className="mb-8">
        <h3 className="text-lg font-bold mb-4">Recent analyses (this session)</h3>
        {history.length === 0 ? (
          <GlassCard>
            No analyses yet. Try a demo QR.{' '}
            <Link to="/qr?demo=QR001" className="text-blue-400 underline">
              Try demo QR
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {history.map((record, i) => (
              <GlassCard key={i} className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{record.label}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(record.at).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge>{record.report.score}</Badge>
                  <span className="text-sm">{record.report.levelLabel}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      <Link
        to="/simulation"
        className="btn-danger w-full text-center text-lg py-4 rounded-lg block font-bold"
      >
        🚨 RUN LIVE SCAM SIMULATION
      </Link>
    </PageShell>
  );
}
