// STUB: the services task finishes this. Incident reports are DEMO documents, never official cybercrime reports.
import type { IncidentReportDoc, RiskReport } from '../types';
import { fmtINR } from '../engine';

export const DEMO_REPORT_TITLE = 'DEMO REPORT — NOT AN OFFICIAL CYBERCRIME REPORT';

export function buildIncidentReport(report: RiskReport, opts: { generatedAt?: Date | string } = {}): IncidentReportDoc {
  const at = opts.generatedAt ?? new Date();
  const p = report.payment;
  return {
    title: DEMO_REPORT_TITLE,
    reportId: report.id,
    generatedAt: typeof at === 'string' ? at : at.toISOString(),
    score: report.score,
    level: report.level,
    levelLabel: report.levelLabel,
    patternName: report.patternName,
    payment: {
      recipient: p.recipient ?? 'Not identified',
      amount: p.amount != null ? fmtINR(p.amount) : 'Not identified',
      merchant: p.merchant ?? 'Not identified',
      source: p.sourceLabel,
    },
    signals: report.explanation.reasons,
    dna: report.dna.map((d) => ({ label: d.label, percent: d.percent })),
    attackChain: report.attackChain.filter((n) => n.active).map((n) => `${n.label}: ${n.detail}`),
    recommendation: report.recommendation.title,
    safeActions: ['Do not pay until the recipient is verified through an official channel.'],
    disclaimer: report.explanation.disclaimer,
    notice: report.notice,
  };
}

export function incidentReportToText(doc: IncidentReportDoc): string {
  return [doc.title, `Report ID: ${doc.reportId}`, `Risk: ${doc.score} / 100 (${doc.levelLabel})`].join('\n');
}

export function downloadIncidentReport(doc: IncidentReportDoc, format: 'txt' | 'json' = 'txt'): void {
  const body = format === 'json' ? JSON.stringify(doc, null, 2) : incidentReportToText(doc);
  const url = URL.createObjectURL(new Blob([body], { type: format === 'json' ? 'application/json' : 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `payraksha-demo-report-${doc.reportId}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
