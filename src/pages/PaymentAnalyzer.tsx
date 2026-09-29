import React, { useState } from 'react';
import { PageShell } from '../components/layout';
import { Button, ErrorNotice, GlassCard, SimulationBadge, SectionHeader } from '../components/ui';
import { RiskResultView, ContributionsChart, ScamDnaChart } from '../components/risk';
import { GuardianRobot } from '../components/three';
import { analyzeRisk } from '../services/api';
import { controlScenarios, scenarioToInput, SOURCE_OPTIONS, URGENCY_OPTIONS, BEHAVIOUR_OPTIONS } from '../engine';
import { useDemoStore } from '../store/demoStore';
import type { AnalyzeResponse, AnalyzeInput, BehaviourKey, SourceId, UrgencyLevel } from '../types';

export default function PaymentAnalyzer() {
  const [inputData, setInputData] = useState<AnalyzeInput>({ payment: {}, behaviour: {} });
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const recordAnalysis = useDemoStore((state) => state.recordAnalysis);

  const presets = controlScenarios();

  const applyPreset = (id: string) => {
    const scenarioInput = scenarioToInput(id);
    setInputData({
       ...scenarioInput,
       payment: { ...scenarioInput.payment },
       behaviour: { ...scenarioInput.behaviour }
    });
    setError('');
  };

  const handleAnalyze = async () => {
    if (inputData.payment?.amount !== undefined && inputData.payment.amount <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await analyzeRisk(inputData);
      setResult(response);
      recordAnalysis({
        label: 'Payment risk analysis',
        input: inputData,
        report: response.report,
        source: response.source,
        ml: response.ml,
        latencyMs: response.latencyMs,
      });
    } catch (err) {
      setError('Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updatePayment = (updates: Partial<AnalyzeInput['payment']>) => {
    setInputData((prev) => ({
      ...prev,
      payment: { ...prev.payment, ...updates }
    }));
  };

  const updateBehaviour = (updates: Partial<AnalyzeInput['behaviour']>) => {
    setInputData((prev) => ({
      ...prev,
      behaviour: { ...prev.behaviour, ...updates }
    }));
  };

  const mood = isAnalyzing ? 'thinking' : result ? (result.report.level === 'LOW' ? 'safe' : 'alert') : 'idle';

  return (
    <PageShell
      eyebrow="Analyzer"
      title="Payment Risk Analyzer"
      subtitle="Analyze a full payment context"
      icon={<span aria-hidden="true">💸</span>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <GlassCard className="mb-6">
            <SectionHeader title="Presets" />
            <div className="flex flex-wrap gap-2 mt-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset.id)}
                >
                  {preset.shortLabel}
                </Button>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Payment Context" />
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recipient" className="block text-sm mb-1 text-gray-300">Recipient ID</label>
                  <input
                    id="recipient"
                    type="text"
                    placeholder="unknown@demo"
                    value={inputData.payment?.recipient || ''}
                    onChange={(e) => updatePayment({ recipient: e.target.value })}
                    className="w-full p-2 border rounded text-black bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Demo IDs end in @demo</p>
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm mb-1 text-gray-300">Amount (₹)</label>
                  <input
                    id="amount"
                    type="number"
                    value={inputData.payment?.amount === undefined ? '' : inputData.payment.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      updatePayment({ amount: val === '' ? undefined : Number(val) });
                    }}
                    className="w-full p-2 border rounded text-black bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="merchant" className="block text-sm mb-1 text-gray-300">Merchant / Claimed Organization</label>
                <input
                  id="merchant"
                  type="text"
                  value={inputData.payment?.merchant || ''}
                  onChange={(e) => updatePayment({ merchant: e.target.value })}
                  className="w-full p-2 border rounded text-black bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label htmlFor="source" className="block text-sm mb-1 text-gray-300">Source</label>
                   <select
                     id="source"
                     value={inputData.payment?.source || 'unknown'}
                     onChange={(e) => updatePayment({ source: e.target.value as SourceId })}
                     className="w-full p-2 border rounded text-black bg-white"
                   >
                     {SOURCE_OPTIONS.map((opt) => (
                       <option key={opt.id} value={opt.id}>{opt.label}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label htmlFor="urgency" className="block text-sm mb-1 text-gray-300">Urgency</label>
                   <select
                     id="urgency"
                     value={inputData.payment?.urgency || 'none'}
                     onChange={(e) => updatePayment({ urgency: e.target.value as UrgencyLevel })}
                     className="w-full p-2 border rounded text-black bg-white"
                   >
                     {URGENCY_OPTIONS.map((opt) => (
                       <option key={opt} value={opt}>{opt}</option>
                     ))}
                   </select>
                 </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-700">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!!inputData.payment?.recipientVerified}
                    onChange={(e) => updatePayment({ recipientVerified: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">Recipient verified in the official app</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(inputData.payment?.previousPayments ?? 0) > 0}
                    onChange={(e) => updatePayment({ previousPayments: e.target.checked ? 1 : 0 })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">Paid this recipient before</span>
                </label>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <p className="text-sm font-semibold mb-2 text-gray-200">Behavioral Signals</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BEHAVIOUR_OPTIONS.map((opt) => (
                    <label key={opt.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!inputData.behaviour?.[opt.id]}
                        onChange={(e) => updateBehaviour({ [opt.id]: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <p className="text-sm font-semibold mb-2 text-gray-200">Additional Context (Optional)</p>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="msg" className="block text-xs mb-1 text-gray-400">Message Text</label>
                    <textarea
                      id="msg"
                      rows={2}
                      value={inputData.message || ''}
                      onChange={(e) => setInputData({ ...inputData, message: e.target.value })}
                      className="w-full p-2 border rounded text-black bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="url-input" className="block text-xs mb-1 text-gray-400">URL Context</label>
                    <input
                      id="url-input"
                      type="text"
                      value={inputData.url || ''}
                      onChange={(e) => setInputData({ ...inputData, url: e.target.value })}
                      className="w-full p-2 border rounded text-black bg-white"
                    />
                  </div>
                </div>
              </div>

              {error && <ErrorNotice message={error} className="mt-4" />}

              <Button
                onClick={handleAnalyze}
                loading={isAnalyzing}
                fullWidth
                className="mt-4"
              >
                ANALYZE PAYMENT RISK
              </Button>

            </form>
          </GlassCard>
        </div>

        <div>
           <div className="h-48 mb-6 relative">
             <GuardianRobot mood={mood} />
           </div>

           {result && (
              <GlassCard>
                <SimulationBadge />
                <h3 className="text-lg font-bold mb-4 mt-2 border-b border-gray-700 pb-2">Analysis Result</h3>

                <RiskResultView
                  report={result.report}
                  source={result.source}
                  latencyMs={result.latencyMs}
                  ml={result.ml}
                  showPayment={true}
                  className="mb-6"
                />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-gray-300">Scam DNA</h4>
                    <ScamDnaChart dna={result.report.dna} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-gray-300">Risk Contributions</h4>
                    <ContributionsChart contributions={result.report.contributions} clamped={result.report.clamped} score={result.report.score} />
                  </div>
                </div>
              </GlassCard>
           )}
        </div>
      </div>
    </PageShell>
  );
}
