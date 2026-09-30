import React, { useState } from 'react';
import { PageShell } from '../components/layout';
import { Button, Badge } from '../components/ui';
import { ContributionsChart } from '../components/risk';
import { HudPanel, StatusPill } from '../components/soc';
import { useCurrentReport } from '../store/demoStore';
import { FLAGSHIP_SCENARIO_ID, scenarioToInput } from '../engine';
import { Terminal, Copy, Check } from 'lucide-react';

function StageCard({ num, title, toggleData, children }: { num: number; title: string; toggleData: unknown; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <HudPanel
      title={
        <span className="flex items-center gap-3">
          <span className="font-mono text-cyan-500/50">{num}</span>
          {title}
        </span>
      }
      right={
        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
          {`{ } JSON`}
        </Button>
      }
      tone="cyan"
    >
      {children && <div className={open ? "mb-4" : ""}>{children}</div>}
      {open && (
        <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/20 p-4 font-code text-xs text-slate-300">
          {JSON.stringify(toggleData, null, 2)}
        </pre>
      )}
    </HudPanel>
  );
}

export default function TechnicalView() {
  const { report, record, isDefault } = useCurrentReport();
  const input = isDefault ? scenarioToInput(FLAGSHIP_SCENARIO_ID) : record?.input;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {}
  };

  const signalExtractionData = {
    textSignals: report.analyses.text.signals,
    textCues: report.analyses.text.cues,
    urlChecks: report.analyses.url?.checks,
    qrFields: report.analyses.qr?.fields,
  };

  const scoreData = {
    score: report.score,
    clamped: report.clamped,
    level: report.level,
    levelLabel: report.levelLabel,
  };

  const patternData = {
    patternName: report.patternName,
    patterns: report.patterns,
    dna: report.dna,
  };

  return (
    <PageShell
      title="Technical View"
      eyebrow="SYSTEM"
      width="wide"
      icon={<Terminal className="h-8 w-8" />}
      subtitle="The raw processing pipeline for this payment."
      actions={
        <div className="flex items-center gap-2" data-testid="technical-view-actions">
          {copied ? <Badge tone="low" icon={<Check className="h-4 w-4" />}>Copied.</Badge> : null}
          <Button variant="outline" size="sm" icon={<Copy className="h-4 w-4" />} onClick={handleCopy}>
            COPY REPORT JSON
          </Button>
        </div>
      }
    >
      <HudPanel tone="cyan" className="mb-6">
        <div className="flex flex-col gap-2 font-mono text-xs text-slate-300 md:flex-row md:items-center">
          <span className="flex items-center gap-2">
            <span className="text-cyan-400">ENGINE:</span> {report.engine.name} v{report.engine.version}
          </span>
          <span className="hidden text-cyan-400/30 md:inline">|</span>
          <span className="flex items-center gap-2">
            <span className="text-cyan-400">RUNTIME:</span> {report.engine.runtime}
          </span>
          {record && (
            <>
              <span className="hidden text-cyan-400/30 md:inline">|</span>
              <span className="flex items-center gap-2">
                <span className="text-cyan-400">SOURCE:</span> {record.source}
              </span>
              {record.latencyMs != null && (
                <>
                  <span className="hidden text-cyan-400/30 md:inline">|</span>
                  <span className="flex items-center gap-2">
                    <span className="text-cyan-400">LATENCY:</span> {Math.round(record.latencyMs)} ms
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </HudPanel>

      <div className="space-y-4">
        <StageCard num={1} title="Input" toggleData={input} />

        <StageCard num={2} title="Signal extraction" toggleData={signalExtractionData} />

        <StageCard num={3} title="Payment context" toggleData={report.payment} />

        <StageCard num={4} title="Features" toggleData={{ features: report.features, featureDetails: report.featureDetails }} />

        <StageCard num={5} title="Contributions" toggleData={report.contributions}>
          <ContributionsChart contributions={report.contributions} score={report.score} clamped={report.clamped} />
        </StageCard>

        <StageCard num={6} title="Score & level" toggleData={scoreData}>
          <div className="flex items-center gap-4">
            <div data-testid="risk-score-card" data-score={report.score} className="font-mono text-2xl font-bold tracking-tight text-white">
              Score: {report.score} / 100
            </div>
            <StatusPill tone={report.level === 'HIGH' ? 'red' : report.level === 'HIGH_CAUTION' ? 'orange' : report.level === 'CAUTION' ? 'amber' : 'green'}>
              {report.levelLabel}
            </StatusPill>
          </div>
        </StageCard>

        <StageCard num={7} title="Pattern & DNA" toggleData={patternData} />

        <StageCard num={8} title="Attack chain" toggleData={report.attackChain} />

        <StageCard num={9} title="Recommendation" toggleData={report.recommendation} />
      </div>
    </PageShell>
  );
}
