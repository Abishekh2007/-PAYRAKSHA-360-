import React, { useState } from 'react';
import { PageShell } from '../components/layout';
import { GlassCard, Button, Badge } from '../components/ui';
import { ContributionsChart } from '../components/risk';
import { useCurrentReport } from '../store/demoStore';
import { FLAGSHIP_SCENARIO_ID, scenarioToInput } from '../engine';
import { Terminal, Copy, Check } from 'lucide-react';

function StageCard({ num, title, toggleData, children }: { num: number; title: string; toggleData: unknown; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-br-lg bg-slate-800 font-mono text-sm font-bold text-slate-400">
        {num}
      </div>
      <div className="ml-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">{title}</h2>
          <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
            {`{ } JSON`}
          </Button>
        </div>
        {children && <div className="mt-4">{children}</div>}
        {open && (
          <pre className="mt-4 max-h-96 overflow-auto rounded bg-slate-950 p-4 font-mono text-xs text-slate-300">
            {JSON.stringify(toggleData, null, 2)}
          </pre>
        )}
      </div>
    </GlassCard>
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
      icon={<Terminal className="h-8 w-8" />}
      subtitle="The raw processing pipeline for this payment."
      actions={
        <div className="flex items-center gap-2">
          {copied ? <Badge tone="low" icon={<Check className="h-4 w-4" />}>Copied.</Badge> : null}
          <Button variant="outline" size="sm" icon={<Copy className="h-4 w-4" />} onClick={handleCopy}>
            COPY REPORT JSON
          </Button>
        </div>
      }
    >
      <GlassCard variant="strong" className="mb-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span>
              <strong>Engine:</strong> {report.engine.name} v{report.engine.version}
            </span>
            <span>
              <strong>Runtime:</strong> {report.engine.runtime}
            </span>
            {record && (
              <>
                <span>
                  <strong>Source:</strong> {record.source}
                </span>
                {record.latencyMs != null && (
                  <span>
                    <strong>Latency:</strong> {Math.round(record.latencyMs)} ms
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="space-y-6">
        <StageCard num={1} title="Input" toggleData={input} />

        <StageCard num={2} title="Signal extraction" toggleData={signalExtractionData} />

        <StageCard num={3} title="Payment context" toggleData={report.payment} />

        <StageCard num={4} title="Features" toggleData={{ features: report.features, featureDetails: report.featureDetails }} />

        <StageCard num={5} title="Contributions" toggleData={report.contributions}>
          <ContributionsChart contributions={report.contributions} score={report.score} clamped={report.clamped} />
        </StageCard>

        <StageCard num={6} title="Score & level" toggleData={scoreData}>
          <div className="flex items-center gap-4">
            <div data-testid="risk-score-card" data-score={report.score} className="text-2xl font-bold text-white">
              Score: {report.score} / 100
            </div>
            <Badge tone={report.level === 'HIGH' ? 'high' : report.level === 'HIGH_CAUTION' ? 'high_caution' : report.level === 'CAUTION' ? 'caution' : 'low'}>
              {report.levelLabel}
            </Badge>
          </div>
        </StageCard>

        <StageCard num={7} title="Pattern & DNA" toggleData={patternData} />

        <StageCard num={8} title="Attack chain" toggleData={report.attackChain} />

        <StageCard num={9} title="Recommendation" toggleData={report.recommendation} />
      </div>
    </PageShell>
  );
}
