import type { IncidentReportDoc, RiskReport } from '../types';
import { fmtINR } from '../engine';

export const DEMO_REPORT_TITLE = 'DEMO REPORT — NOT AN OFFICIAL CYBERCRIME REPORT';

export function buildIncidentReport(report: RiskReport, opts: { generatedAt?: Date | string } = {}): IncidentReportDoc {
  const at = opts.generatedAt ?? new Date();
  const p = report.payment;

  let safeActions: string[] = [];
  if (report.level === 'HIGH' || report.level === 'HIGH_CAUTION') {
    safeActions = [
      'Do not pay until the recipient is verified through an official channel.',
      'Open the official app or website yourself. Do not use links, QR codes or phone numbers from the message.',
      'Ask a trusted person before paying.',
      'Never share your UPI PIN, OTP, password or CVV. PAYRAKSHA never asks for them.',
      'If money was already sent, contact your bank immediately and use the official cybercrime helpline 1930 / cybercrime.gov.in (real-world guidance; this demo files nothing).'
    ];
  } else if (report.level === 'CAUTION') {
    safeActions = [
      'Do not pay until the recipient is verified through an official channel.',
      'Open the official app or website yourself. Do not use links, QR codes or phone numbers from the message.',
      'Never share your UPI PIN, OTP, password or CVV. PAYRAKSHA never asks for them.'
    ];
  } else if (report.level === 'LOW') {
    safeActions = [
      'No strong warning signals were found. Still confirm the recipient name before paying.',
      'Never share your UPI PIN, OTP, password or CVV.'
    ];
  }

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
    safeActions,
    disclaimer: report.explanation.disclaimer,
    notice: report.notice,
  };
}

export function incidentReportToText(doc: IncidentReportDoc): string {
  const lines = [
    doc.title,
    doc.notice,
    `Report ID: ${doc.reportId}`,
    `Generated: ${doc.generatedAt}`,
    `Risk score: ${doc.score} / 100 (${doc.levelLabel})`,
    `Pattern: ${doc.patternName}`,
    '',
    'PAYMENT (DEMO DATA)',
    `Recipient: ${doc.payment.recipient}`,
    `Amount: ${doc.payment.amount}`,
    `Merchant: ${doc.payment.merchant}`,
    `Source: ${doc.payment.source}`,
    '',
    'WARNING SIGNALS',
    ...(doc.signals.length ? doc.signals.map(s => `- ${s}`) : ['- None']),
    '',
    'SCAM DNA',
    ...(doc.dna.length ? doc.dna.map(d => `- ${d.label}: ${d.percent}%`) : ['- None']),
    '',
    'ATTACK CHAIN',
    ...(doc.attackChain.length ? doc.attackChain.map((c, i) => `${i + 1}. ${c}`) : ['- None']),
    '',
    `RECOMMENDATION: ${doc.recommendation}`,
    '',
    'SAFE ACTIONS',
    ...(doc.safeActions.length ? doc.safeActions.map(a => `- ${a}`) : ['- None']),
    '',
    `DISCLAIMER: ${doc.disclaimer}`
  ];
  return lines.join('\n');
}

export function downloadIncidentReport(doc: IncidentReportDoc, format: 'txt' | 'json' = 'txt'): void {
  const body = format === 'json' ? JSON.stringify(doc, null, 2) : incidentReportToText(doc);
  const url = URL.createObjectURL(new Blob([body], { type: format === 'json' ? 'application/json' : 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `payraksha-demo-report-${doc.reportId}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
