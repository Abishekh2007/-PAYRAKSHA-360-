import React, { useState, useEffect, useRef } from 'react';
import { PageShell } from '../components/layout';
import { Button, ErrorNotice, GlassCard, SimulationBadge, SectionHeader } from '../components/ui';
import { RiskResultView, ContributionsChart, ScamDnaChart } from '../components/risk';
import { GuardianRobot } from '../components/three';
import { analyzeRisk } from '../services/api';
import { controlScenarios, scenarioToInput, SOURCE_OPTIONS, URGENCY_OPTIONS, BEHAVIOUR_OPTIONS } from '../engine';
import { useDemoStore } from '../store/demoStore';
import type { AnalyzeResponse, AnalyzeInput, BehaviourKey, SourceId, UrgencyLevel } from '../types';
import { useReducedMotion } from 'framer-motion';

export default function PaymentAnalyzer() {
  const [inputData, setInputData] = useState<AnalyzeInput>({ payment: {}, behaviour: {} });
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(-1);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const recordAnalysis = useDemoStore((state) => state.recordAnalysis);

  const presets = controlScenarios();

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const applyPreset = (id: string) => {
    const scenarioInput = scenarioToInput(id);
    setInputData({
       ...scenarioInput,
       payment: { ...scenarioInput.payment },
       behaviour: { ...scenarioInput.behaviour }
    });
    setError('');
    setResult(null);
  };

  const cleanInput = (input: AnalyzeInput): AnalyzeInput => {
    const cleaned: AnalyzeInput = { ...input, payment: { ...input.payment }, behaviour: { ...input.behaviour } };
    if (cleaned.payment?.recipient === '') delete cleaned.payment.recipient;
    if (cleaned.payment?.merchant === '') delete cleaned.payment.merchant;
    if (cleaned.message === '') delete cleaned.message;
    if (cleaned.url === '') delete cleaned.url;
    return cleaned;
  };

  const handleAnalyze = async () => {
    if (inputData.payment?.amount !== undefined && inputData.payment.amount <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setIsAnimating(true);
    setAnimationStep(-1);
    setResult(null);

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const delay = shouldReduceMotion ? 0 : 300;

    // Start animation sequence
    const animPromise = new Promise<void>((resolve) => {
      if (shouldReduceMotion) {
        setAnimationStep(4);
        resolve();
        return;
      }

      timeoutsRef.current.push(setTimeout(() => setAnimationStep(0), delay * 1));
      timeoutsRef.current.push(setTimeout(() => setAnimationStep(1), delay * 2));
      timeoutsRef.current.push(setTimeout(() => setAnimationStep(2), delay * 3));
      timeoutsRef.current.push(setTimeout(() => setAnimationStep(3), delay * 4));
      timeoutsRef.current.push(setTimeout(() => {
        setAnimationStep(4);
        resolve();
      }, delay * 4));
    });

    if (!shouldReduceMotion) {
      timeoutsRef.current.push(setTimeout(() => setAnimationStep(0), 0));
    }

    const animWait = shouldReduceMotion
      ? Promise.resolve()
      : new Promise<void>(res => timeoutsRef.current.push(setTimeout(res, 1200)));

    try {
      const cleanedInput = cleanInput(inputData);
      const [response] = await Promise.all([
        analyzeRisk(cleanedInput),
        animWait
      ]);
      setResult(response);
      recordAnalysis({
        label: 'Payment risk analysis',
        input: cleanedInput,
        report: response.report,
        source: response.source,
        ml: response.ml,
        latencyMs: response.latencyMs,
      });
    } catch (err) {
      setError('Analysis failed.');
    } finally {
      setIsAnalyzing(false);
      setIsAnimating(false);
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

  const inputClasses = "w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400/60";

  const renderRadios = (legend: string, value: boolean | null | undefined, onChange: (val: boolean) => void, name: string) => (
    <fieldset className="flex items-center justify-between py-1">
      <legend className="text-sm text-gray-300 float-left mr-4">{legend}</legend>
      <div className="flex gap-4 float-right">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === true}
            onChange={() => onChange(true)}
            className="accent-brand-400"
          />
          <span className="text-sm text-gray-300">YES</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === false}
            onChange={() => onChange(false)}
            className="accent-brand-400"
          />
          <span className="text-sm text-gray-300">NO</span>
        </label>
      </div>
    </fieldset>
  );

  const animationSteps = [
    'Checking recipient',
    'Reading payment source',
    'Weighing urgency and amount',
    'Combining signals'
  ];

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
                    onChange={(e) => updatePayment({ recipient: e.target.value === '' ? undefined : e.target.value })}
                    className={inputClasses}
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
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="merchant" className="block text-sm mb-1 text-gray-300">Merchant / Claimed Organization</label>
                <input
                  id="merchant"
                  type="text"
                  value={inputData.payment?.merchant || ''}
                  onChange={(e) => updatePayment({ merchant: e.target.value === '' ? undefined : e.target.value })}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                   <label htmlFor="source" className="block text-sm mb-1 text-gray-300">Source</label>
                   <select
                     id="source"
                     value={inputData.payment?.source || 'unknown'}
                     onChange={(e) => updatePayment({ source: e.target.value as SourceId })}
                     className={inputClasses}
                   >
                     {SOURCE_OPTIONS.map((opt) => (
                       <option key={opt.id} value={opt.id} className="bg-slate-900">{opt.label}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label htmlFor="urgency" className="block text-sm mb-1 text-gray-300">Urgency</label>
                   <select
                     id="urgency"
                     value={inputData.payment?.urgency || 'none'}
                     onChange={(e) => updatePayment({ urgency: e.target.value as UrgencyLevel })}
                     className={inputClasses}
                   >
                     {URGENCY_OPTIONS.map((opt) => (
                       <option key={opt} value={opt} className="bg-slate-900">{opt.toUpperCase()}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label htmlFor="previous-payments" className="block text-sm mb-1 text-gray-300">Previous payments to this recipient</label>
                   <input
                     id="previous-payments"
                     type="number"
                     min={0}
                     step={1}
                     inputMode="numeric"
                     value={inputData.payment?.previousPayments === undefined ? '' : inputData.payment.previousPayments}
                     onChange={(e) => {
                       const val = e.target.value;
                       updatePayment({ previousPayments: val === '' ? undefined : Number(val) });
                     }}
                     className={inputClasses}
                   />
                 </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-slate-500 mb-2">Leave blank to let PAYRAKSHA infer it.</p>
                <div className="space-y-1">
                  {renderRadios('Recipient verified', inputData.payment?.recipientVerified, (v) => updatePayment({ recipientVerified: v }), 'recipientVerified')}
                  {renderRadios('Message contains payment request', inputData.payment?.hasPaymentRequest, (v) => updatePayment({ hasPaymentRequest: v }), 'hasPaymentRequest')}
                  {renderRadios('Amount unusual', inputData.payment?.amountUnusual, (v) => updatePayment({ amountUnusual: v }), 'amountUnusual')}
                </div>
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
                        className="rounded accent-brand-400"
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
                      onChange={(e) => setInputData({ ...inputData, message: e.target.value === '' ? undefined : e.target.value })}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label htmlFor="url-input" className="block text-xs mb-1 text-gray-400">URL Context</label>
                    <input
                      id="url-input"
                      type="text"
                      value={inputData.url || ''}
                      onChange={(e) => setInputData({ ...inputData, url: e.target.value === '' ? undefined : e.target.value })}
                      className={inputClasses}
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
                ANALYZE PAYMENT
              </Button>

            </form>
          </GlassCard>
        </div>

        <div>
           <div className="h-48 mb-6 relative">
             <GuardianRobot mood={mood} />
           </div>

           {(isAnimating || result) && (
              <GlassCard>
                {isAnimating ? (
                  <div className="py-4">
                    <h3 className="text-lg font-bold mb-4">Calculating contextual risk…</h3>
                    <div className="space-y-3">
                      {animationSteps.map((step, idx) => (
                        <div key={idx} className={`flex items-center gap-3 transition-opacity duration-300 ${animationStep >= idx ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-5 h-5 flex items-center justify-center">
                            {animationStep > idx || shouldReduceMotion ? (
                              <span className="text-green-500 font-bold">✓</span>
                            ) : (
                              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>
                          <span className={`text-sm ${animationStep > idx ? 'text-gray-300' : 'text-gray-100'}`}>{step}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-400 transition-all duration-300 ease-linear"
                        style={{ width: `${Math.max(0, Math.min(100, (animationStep + 1) * 25))}%` }}
                      />
                    </div>
                  </div>
                ) : result ? (
                  <>
                    <SimulationBadge />
                    <h3 className="text-lg font-bold mb-4 mt-2 border-b border-gray-700 pb-2">CONTEXTUAL RISK</h3>

                    <RiskResultView
                      report={result.report}
                      source={result.source}
                      latencyMs={result.latencyMs}
                      ml={result.ml}
                      showPayment={true}
                      className="mb-6"
                    />

                    {result.report.contributions && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold mb-2 text-gray-300 uppercase tracking-wider">RISK FACTORS</h4>
                        <ul aria-label="Risk factors" className="space-y-2">
                          {[...result.report.contributions]
                            .filter(c => c.points > 0)
                            .sort((a, b) => b.points - a.points)
                            .map((c, i) => (
                              <li key={i} className="flex flex-col text-sm text-gray-300">
                                <div className="flex w-full items-baseline">
                                  <span>{c.label}</span>
                                  <span className="text-red-400 font-bold ml-1">+{c.points}</span>
                                </div>
                                {c.detail && <span className="text-xs text-gray-500 mt-0.5">{c.detail}</span>}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

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
                  </>
                ) : null}
              </GlassCard>
           )}
        </div>
      </div>
    </PageShell>
  );
}
