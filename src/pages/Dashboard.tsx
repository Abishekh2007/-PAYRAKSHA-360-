import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { Button, SimulationBadge } from '../components/ui';
import {
  HudPanel,
  KpiTile,
  ThreatLevel,
  StatusPill,
  PaymentTwin,
  NextMoveCard,
  simulatedFeed,
  SIM_CHANNELS,
  STATUS_LABEL,
  socToneForLevel,
  SOC_TONES,
  istTime,
} from '../components/soc';
import { useDemoStore } from '../store/demoStore';
import { getScenario, FLAGSHIP_SCENARIO_ID } from '../engine';
import type { SimEvent } from '../components/soc';
import type { RiskReport } from '../types';

function fmtRiskINR(amount: number | null | undefined): string {
  if (amount == null) return '';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function Dashboard() {
  const history = useDemoStore((s) => s.history);
  const current = useDemoStore((s) => s.current);
  const navigate = useNavigate();

  const [nowMs] = useState(() => Date.now());
  const feed = simulatedFeed({ now: nowMs });

  // Default selection: if there is a current analysis, select it; otherwise flag utility_scam
  const defaultId = current ? `analysis-current` : `sim-${FLAGSHIP_SCENARIO_ID}`;
  const [selectedId, setSelectedId] = useState<string>(defaultId);

  // Resolve selected report
  function resolveSelectedReport(): RiskReport | null {
    if (selectedId === 'analysis-current' && current) {
      return current.report;
    }
    const event = feed.find((e) => e.id === selectedId);
    return event ? event.report : (feed[0]?.report ?? null);
  }

  const selectedReport = resolveSelectedReport();
  const selectedEvent = feed.find((e) => e.id === selectedId);
  const selectedTitle =
    selectedId === 'analysis-current' && current
      ? current.label
      : selectedEvent?.title ?? getScenario(FLAGSHIP_SCENARIO_ID).title;

  // KPI counts
  const numAnalyses = history.length;
  const highCautionCount = history.filter(
    (r) => r.report.level === 'HIGH' || r.report.level === 'HIGH_CAUTION',
  ).length;
  const heldCount = feed.filter((e) => e.status === 'HELD').length;
  const checkCount = feed.filter((e) => e.status === 'CHECK').length;
  const lowCount = feed.filter((e) => e.status === 'LOW').length;

  // Channel mix
  const channelCounts = Object.fromEntries(SIM_CHANNELS.map((ch) => [ch, 0])) as Record<string, number>;
  for (const ev of feed) {
    channelCounts[ev.channel] = (channelCounts[ev.channel] ?? 0) + 1;
  }
  const maxChannel = Math.max(...Object.values(channelCounts), 1);

  function handleRowClick(id: string) {
    setSelectedId(id);
  }

  function handleAnalyzeInDetail() {
    if (!selectedReport) return;
    useDemoStore.getState().recordAnalysis({
      label: selectedTitle,
      input: selectedReport.input,
      report: selectedReport,
      source: 'browser',
    });
    navigate('/explain');
  }

  return (
    <PageShell
      eyebrow="MONITOR"
      title="Command Center"
      subtitle="Live view of simulated payment threats across every channel. Every event is DEMO data."
      width="wide"
      actions={<StatusPill tone="red" pulse>LIVE FEED · SIMULATED</StatusPill>}
    >
      <div className="flex flex-col gap-4">
        {/* ── KPI strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiTile label="Analyses" value={numAnalyses} tone="cyan" hint="THIS SESSION" />
          <KpiTile label="High / High Caution" value={highCautionCount} tone="red" hint="THIS SESSION" />
          <KpiTile
            label="Threats analyzed"
            value={42}
            tone="amber"
            hint="SIMULATED HACKATHON DATA"
          />
          <KpiTile label="Held for review" value={heldCount} tone="red" hint="SIMULATED FEED" />
          <KpiTile label="Check before paying" value={checkCount} tone="amber" hint="SIMULATED FEED" />
          <KpiTile label="Low risk" value={lowCount} tone="green" hint="SIMULATED FEED" />
        </div>

        {/* ── Twin + Threat panel ───────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Payment Twin */}
          <HudPanel
            eyebrow="DIGITAL TWIN · SIMULATION"
            title="Payment path"
            className="lg:col-span-8"
            bodyClassName="p-4"
          >
            <PaymentTwin report={selectedReport} />
          </HudPanel>

          {/* Threat Assessment */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <HudPanel
              eyebrow="THREAT ASSESSMENT"
              title={selectedTitle}
              tone={socToneForLevel(selectedReport?.level)}
              bodyClassName="p-4"
            >
              <div className="flex flex-col gap-3">
                <ThreatLevel
                  level={selectedReport?.level ?? null}
                  score={selectedReport?.score}
                  live={false}
                />

                {selectedReport && (
                  <>
                    <div className="border-t border-white/10" />
                    <div className="space-y-1">
                      <p className="hud-eyebrow">RECIPIENT</p>
                      <p className="font-mono text-xs text-slate-300">
                        {selectedReport.payment.recipient ?? 'unknown@demo'}{' '}
                        <span className="text-slate-500">DEMO</span>
                      </p>
                      {selectedReport.payment.amount != null && (
                        <p className="font-mono text-xs text-slate-300">
                          {fmtRiskINR(selectedReport.payment.amount)}
                        </p>
                      )}
                    </div>

                    {selectedReport.explanation.reasons.length > 0 && (
                      <>
                        <div className="border-t border-white/10" />
                        <ul className="space-y-1">
                          {selectedReport.explanation.reasons.slice(0, 3).map((reason, i) => (
                            <li key={i} className="flex gap-2 text-sm text-slate-300">
                              <span className="text-cyan-400 shrink-0">▸</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                )}

                <Button variant="primary" onClick={handleAnalyzeInDetail} fullWidth>
                  Analyze in detail
                </Button>
              </div>
            </HudPanel>

            <NextMoveCard report={selectedReport} />
          </div>
        </div>

        {/* ── Event feed ────────────────────────────────────────── */}
        <HudPanel
          eyebrow="SIMULATED EVENT FEED"
          title="All channels"
          right={<SimulationBadge />}
          bodyClassName="p-0"
        >
          <ol aria-label="Simulated event feed" className="divide-y divide-cyan-400/10">
            {/* Pinned current analysis row */}
            {current && (
              <li>
                <button
                  type="button"
                  aria-pressed={selectedId === 'analysis-current'}
                  onClick={() => handleRowClick('analysis-current')}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-cyan-400/5 ${
                    selectedId === 'analysis-current'
                      ? 'border-l-2 border-cyan-400 bg-cyan-400/10'
                      : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <span className="text-slate-500 shrink-0 font-mono">{istTime(current.at)} IST</span>
                    <span className="chip bg-cyan-400/10 border-cyan-400/30 text-cyan-300 text-[10px]">YOUR LAST ANALYSIS</span>
                    <span className="text-slate-300 truncate flex-1">{current.label}</span>
                    <span className="text-slate-500 shrink-0 font-mono">{current.report.payment.recipient ?? 'unknown@demo'}</span>
                    <span className={`font-semibold font-mono shrink-0 ${SOC_TONES[socToneForLevel(current.report.level)].text}`}>
                      RISK {current.report.score}
                    </span>
                    <StatusPill tone={socToneForLevel(current.report.level)}>
                      {STATUS_LABEL[current.report.level === 'HIGH' || current.report.level === 'HIGH_CAUTION'
                        ? 'HELD'
                        : current.report.level === 'CAUTION'
                        ? 'CHECK'
                        : 'LOW'
                      ]}
                    </StatusPill>
                  </div>
                </button>
              </li>
            )}

            {/* Feed events */}
            {feed.map((ev: SimEvent) => {
              const isSelected = selectedId === ev.id;
              const tone = socToneForLevel(ev.level);
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleRowClick(ev.id)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-cyan-400/5 ${
                      isSelected
                        ? 'border-l-2 border-cyan-400 bg-cyan-400/10'
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                      <span className="text-slate-500 shrink-0 font-mono">{ev.time} IST</span>
                      <span className="chip bg-slate-700/50 border-slate-600/40 text-slate-300 text-[10px] shrink-0">{ev.channel}</span>
                      <span className="text-slate-300 truncate flex-1">{ev.title}</span>
                      <span className="text-slate-500 shrink-0 truncate max-w-[120px] font-mono">{ev.handle}</span>
                      <span className={`font-semibold font-mono shrink-0 ${SOC_TONES[tone].text}`}>RISK {ev.score}</span>
                      <StatusPill tone={tone}>{STATUS_LABEL[ev.status]}</StatusPill>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </HudPanel>

        {/* ── Channel mix + Session history ─────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Channel Mix */}
          <HudPanel
            eyebrow="CHANNEL MIX"
            title="By channel"
            className="lg:col-span-5"
            bodyClassName="p-4"
            right={<span className="font-mono text-[10px] text-slate-500">SIMULATED HACKATHON DATA</span>}
          >
            <div className="flex flex-col gap-1.5">
              {SIM_CHANNELS.map((ch) => {
                const count = channelCounts[ch] ?? 0;
                const pct = Math.round((count / maxChannel) * 100);
                return (
                  <div key={ch} className="flex items-center gap-2">
                    <span className="hud-label w-20 shrink-0 text-right">{ch}</span>
                    <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400/40 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="hud-num text-xs text-slate-400 w-4 shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </HudPanel>

          {/* Session History */}
          <HudPanel
            eyebrow="SESSION HISTORY"
            title="Your analyses"
            className="lg:col-span-7"
            bodyClassName="p-4"
            right={<SimulationBadge />}
          >
            {history.length === 0 ? (
              <p className="hud-label text-center py-4 text-slate-600">
                NO ANALYSES YET — RUN A SHIELD SCAN
              </p>
            ) : (
              <ol className="flex flex-col gap-1">
                {history.map((record) => {
                  const tone = socToneForLevel(record.report.level);
                  return (
                    <li
                      key={record.id}
                      className="flex items-center gap-3 text-sm py-2 border-b border-white/5 last:border-0"
                    >
                      <span className="text-slate-500 shrink-0 font-mono">{istTime(record.at)} IST</span>
                      <span className="text-slate-300 truncate flex-1">{record.label}</span>
                      <span className={`font-semibold font-mono shrink-0 ${SOC_TONES[tone].text}`}>
                        RISK {record.report.score}
                      </span>
                      <StatusPill tone={tone}>{record.report.levelLabel}</StatusPill>
                    </li>
                  );
                })}
              </ol>
            )}
          </HudPanel>
        </div>
      </div>
    </PageShell>
  );
}
