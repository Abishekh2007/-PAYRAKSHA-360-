import React, { useMemo } from 'react';
import { PageShell } from '../components/layout';
import { useCurrentReport } from '../store/demoStore';
import { buildIncidentReport, DEMO_REPORT_TITLE, downloadIncidentReport } from '../services/report';
import { Button, SimulationBadge } from '../components/ui';
import { FileText, Download, Printer, AlertTriangle } from 'lucide-react';
import { HudPanel, StatusPill, socToneForLevel } from '../components/soc';

export default function IncidentReport() {
  const { report } = useCurrentReport();
  const doc = useMemo(() => buildIncidentReport(report), [report.id]);
  const tone = socToneForLevel(report.level);

  const handleTxt = () => downloadIncidentReport(doc, 'txt');
  const handleJson = () => downloadIncidentReport(doc, 'json');
  const handlePrint = () => {
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
  };

  return (
    <PageShell
      title="Incident Report"
      eyebrow="RESPONSE"
      width="wide"
      icon={<FileText className="w-8 h-8" />}
      actions={
        <>
          <SimulationBadge />
          <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleTxt}>
            EXPORT DEMO REPORT
          </Button>
          <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleJson}>
            EXPORT JSON
          </Button>
          <Button variant="outline" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            PRINT
          </Button>
        </>
      }
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        <HudPanel
          eyebrow="CASE FILE · DEMO"
          title={`INCIDENT ID: ${doc.reportId}`}
          right={
            <StatusPill tone={tone}>
              {doc.levelLabel}
            </StatusPill>
          }
          className="print:border-none print:shadow-none"
        >
          <div className="hud-panel glass-light text-slate-900 rounded-xl overflow-hidden p-8 sm:p-12 print:p-0 print:border-none">
            {/* Header */}
            <div className="border-b-4 border-slate-900 pb-6 mb-8 flex flex-col gap-4 items-center text-center">
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center justify-center gap-3">
                <AlertTriangle className="w-8 h-8 text-risk-high" />
                {DEMO_REPORT_TITLE}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-mono text-slate-600">
                <span className="bg-slate-100 px-2 py-1 rounded">ID: {doc.reportId}</span>
                <span>•</span>
                <span>Generated: {new Date(doc.generatedAt).toLocaleString()}</span>
              </div>
              <SimulationBadge className="mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {/* Left Col */}
              <div className="flex flex-col gap-8">
                <section>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 border-b-2 border-slate-200 pb-1">Risk Assessment</h3>
                  <div className="flex items-end gap-3 mb-2">
                    <span className="text-4xl font-black leading-none">{doc.score}</span>
                    <span className="text-lg font-bold text-slate-700 leading-none pb-1">/ 100</span>
                  </div>
                  <div className="text-lg font-bold text-risk-high">{doc.levelLabel}</div>
                  <div className="text-slate-700 mt-2">Pattern detected: <strong>{doc.patternName}</strong></div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 border-b-2 border-slate-200 pb-1">Payment Details</h3>
                  <table className="w-full text-sm text-left">
                    <tbody>
                      <tr className="border-b border-slate-100"><th className="py-2 pr-4 font-semibold text-slate-600 whitespace-nowrap">Recipient</th><td className="py-2 text-slate-900 break-all">{doc.payment.recipient}</td></tr>
                      <tr className="border-b border-slate-100"><th className="py-2 pr-4 font-semibold text-slate-600 whitespace-nowrap">Amount</th><td className="py-2 font-mono text-slate-900 font-semibold">{doc.payment.amount}</td></tr>
                      <tr className="border-b border-slate-100"><th className="py-2 pr-4 font-semibold text-slate-600 whitespace-nowrap">Merchant</th><td className="py-2 text-slate-900">{doc.payment.merchant}</td></tr>
                      <tr><th className="py-2 pr-4 font-semibold text-slate-600 whitespace-nowrap">Source</th><td className="py-2 text-slate-900">{doc.payment.source}</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 border-b-2 border-slate-200 pb-1">Warning Signals</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-slate-800">
                    {doc.signals.map((s, i) => (
                      <li key={i} className="leading-snug">{s}</li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Right Col */}
              <div className="flex flex-col gap-8">
                <section>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 border-b-2 border-slate-200 pb-1">Attack Chain</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-slate-800">
                    {doc.attackChain.map((step, i) => (
                      <li key={i} className="leading-snug">{step}</li>
                    ))}
                  </ol>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 border-b-2 border-slate-200 pb-1">Scam DNA Breakdown</h3>
                  <div className="space-y-3">
                    {doc.dna.map((d, i) => (
                      <div key={i} className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between text-slate-700">
                          <span>{d.label}</span>
                          <span className="font-mono font-bold text-slate-900">{d.percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-800" style={{ width: `${d.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t-4 border-slate-900 flex flex-col gap-6">
              <section className="bg-slate-100 p-6 rounded-lg text-slate-900">
                <h3 className="text-lg font-black uppercase tracking-tight mb-2">Recommendation</h3>
                <p className="font-bold text-risk-high text-xl mb-4">{doc.recommendation}</p>

                <h4 className="font-bold mb-2">Safe Actions:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  {doc.safeActions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>

              <div className="text-xs text-slate-500 text-center leading-relaxed max-w-2xl mx-auto space-y-2">
                <p>{doc.disclaimer}</p>
                <p>{doc.notice}</p>
              </div>
            </div>
          </div>
        </HudPanel>

        <div className="bg-cyan-400/10 border border-cyan-400/30 p-6 rounded-xl text-center text-slate-300 print:hidden text-sm">
          <p>
            To report a real incident, use official channels (in India: helpline 1930 or cybercrime.gov.in). This demo does not file or send any report.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
