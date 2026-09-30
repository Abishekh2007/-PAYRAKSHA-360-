import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import { usePayStore, newRecordId } from '../store/payStore';
import { scanCheck, sendDecision } from '../lib/link';
import { paymentView, withContext, formatInr, PayView } from '../lib/payView';
import type { RiskReport } from '../../../src/types';
import type { LinkDecision } from '../../../src/types/link';

import { CheckingSteps } from '../components/check/CheckingSteps';
import { ThreatCard } from '../components/check/ThreatCard';
import { ContextChips, ContextState } from '../components/check/ContextChips';
import { BottomSheet } from '../components/check/BottomSheet';
import { HoldButton } from '../components/check/HoldButton';

const MIN_CHECK_MS = import.meta.env.MODE === 'test' ? 0 : 900;

export default function Pay() {
  const navigate = useNavigate();
  const { draft, deviceName, addRecord, updateRecord, records } = usePayStore();

  const [loading, setLoading] = useState<'initial' | 'rechecking' | 'done'>('initial');
  const [recordId, setRecordId] = useState<string | null>(null);
  const [report, setReport] = useState<RiskReport | null>(null);

  const [context, setContext] = useState<ContextState>({
    onCall: false,
    screenShare: false,
    scanToReceive: false,
  });

  const [showPaySheet, setShowPaySheet] = useState(false);
  const [showHoldSheet, setShowHoldSheet] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!draft) return;

    const runInitialCheck = async () => {
      const startTime = Date.now();
      const input = withContext(draft.input, context);

      const result = await scanCheck(input, {
        device: deviceName,
        source: draft.source,
      });

      const elapsed = Date.now() - startTime;
      const remains = MIN_CHECK_MS - elapsed;
      if (remains > 0) {
        await new Promise((resolve) => setTimeout(resolve, remains));
      }

      if (!mounted.current) return;

      const view = paymentView(result.report);
      const id = newRecordId();

      addRecord({
        id,
        eventId: result.event?.id ?? null,
        at: new Date().toISOString(),
        source: draft.source,
        label: draft.label,
        input,
        score: result.report.score,
        level: result.report.level,
        levelLabel: result.report.levelLabel,
        patternName: result.report.patternName,
        recipient: result.report.payment.recipient ?? null,
        payeeName: view.payee.name,
        amount: result.report.payment.amount ?? null,
        mode: view.mode,
        decision: 'pending',
        decidedAt: null,
        engine: result.engine,
      });

      setRecordId(id);
      setReport(result.report);
      setLoading('done');
    };

    if (loading === 'initial') {
      void runInitialCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContextChange = async (key: keyof ContextState, value: boolean) => {
    if (!draft || !recordId) return;

    const newContext = { ...context, [key]: value };
    setContext(newContext);
    setLoading('rechecking');

    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const input = withContext(draft.input, newContext);
    const result = await scanCheck(input, {
      device: deviceName,
      source: draft.source,
      replaces: record.eventId ?? undefined,
    });

    if (!mounted.current) return;

    const view = paymentView(result.report);
    updateRecord(recordId, {
      eventId: result.event?.id ?? record.eventId,
      input,
      score: result.report.score,
      level: result.report.level,
      levelLabel: result.report.levelLabel,
      patternName: result.report.patternName,
      recipient: result.report.payment.recipient ?? null,
      payeeName: view.payee.name,
      amount: result.report.payment.amount ?? null,
      mode: view.mode,
      engine: result.engine,
    });

    setReport(result.report);
    setLoading('done');
  };

  const handleDecision = async (decision: Exclude<LinkDecision, 'pending'>) => {
    if (!recordId) return;
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    updateRecord(recordId, {
      decision,
      decidedAt: new Date().toISOString(),
    });

    if (record.eventId) {
      void sendDecision(record.eventId, decision);
    }

    navigate(`/done/${recordId}`);
  };

  if (!draft) {
    return (
      <div className="flex flex-col h-full bg-gp-surface text-gp-ink">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-lg mb-6">Nothing to check yet</p>
          <button className="pill-primary" onClick={() => navigate('/scan')}>
            Scan a QR code
          </button>
        </div>
      </div>
    );
  }

  if (loading === 'initial') {
    return (
      <div className="flex flex-col h-full bg-gp-surface text-gp-ink z-10 relative">
        <CheckingSteps />
      </div>
    );
  }

  if (!report) return null;
  const view = paymentView(report);

  const getToneAvatarBg = (tone: string) => {
    if (tone === 'green') return 'bg-risk-low text-white';
    if (tone === 'amber') return 'bg-risk-caution text-white';
    if (tone === 'orange') return 'bg-risk-elevated text-white';
    if (tone === 'red') return 'bg-risk-high text-white';
    return 'bg-gp-line text-gp-ink';
  };

  return (
    <div className="flex flex-col min-h-full bg-white text-gp-ink pb-40">
      <div className="px-4 py-3 flex items-center bg-white sticky top-0 z-20 shadow-sm">
        <button aria-label="Back" className="p-2 -ml-2 rounded-full hover:bg-gp-surface" onClick={() => navigate('/')}>
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="px-6 flex-1 flex flex-col max-w-[400px] mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col items-center text-center mt-4">
          <div className="relative mb-4">
            <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-3xl font-medium ${getToneAvatarBg(view.tone)}`}>
              {view.payee.initial}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
              <Shield className="w-5 h-5 text-gp-blue" />
            </div>
          </div>

          <h1 className="text-2xl font-medium mb-1">Paying {view.payee.name}</h1>
          <p className="text-sm text-gp-ink-3 mb-2">{view.payee.displayVpa || "No UPI ID in this QR"}</p>

          {view.payee.verified ? (
            <div className="flex items-center text-risk-low text-xs font-medium mb-6">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Verified demo merchant
            </div>
          ) : (
            <div className="text-gp-ink-3 text-xs font-medium mb-6">Not a verified payee</div>
          )}

          {view.amount !== null ? (
            <div className="text-[44px] leading-tight font-medium tracking-tight mb-2">
              {formatInr(view.amount)}
            </div>
          ) : (
            <div className="text-xl text-gp-ink-3 font-medium mb-2">Amount not set</div>
          )}
          {view.note && <div className="text-sm bg-gp-surface px-4 py-2 rounded-xl text-gp-ink-2 max-w-xs truncate">{view.note}</div>}
        </div>

        {/* Mode Notices */}
        {view.mode === 'analysis-only' && (
          <div className="card bg-gp-surface p-4 mt-6 text-center text-sm font-medium">
            RakshaPay DEMO can't pay real UPI IDs. This is a risk check only.
          </div>
        )}
        {view.mode === 'not-payment' && (
          <div className="card bg-gp-surface p-4 mt-6 text-center text-sm font-medium">
            This QR is not a payment
          </div>
        )}

        {/* Threat Card */}
        <ThreatCard
          score={view.score}
          levelShort={view.levelShort}
          tone={view.tone}
          headline={view.headline}
          reasons={view.reasons}
          patternName={report.patternName}
          report={report}
        />

        {/* Context Chips */}
        <ContextChips
          context={context}
          onChange={handleContextChange}
          disabled={loading === 'rechecking'}
        />
        {loading === 'rechecking' && (
          <div className="text-center text-sm text-gp-blue font-medium mt-4 animate-pulse">
            Re-checking...
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gp-surface shadow-sheet p-4 pb-safe z-30">
        <div className="flex flex-col gap-3 max-w-[400px] mx-auto w-full">
          {view.mode === 'analysis-only' || view.mode === 'not-payment' ? (
             <>
               <button className="pill-outline" onClick={() => handleDecision('verify')}>Verify payee</button>
               <button className="pill-danger" onClick={() => handleDecision('cancelled')}>Cancel</button>
             </>
          ) : (
            <>
              {view.primary === 'cancel' && (
                <>
                  <button className="pill-danger" onClick={() => handleDecision('cancelled')}>Cancel payment</button>
                  <button className="pill-outline" onClick={() => handleDecision('verify')}>Verify payee</button>
                  <button className="pill-text w-full py-3" onClick={() => handleDecision('trusted')}>Ask a trusted contact (demo)</button>
                  {view.holdToConfirm && view.mode === 'demo-pay' && (
                    <button className="pill-text text-sm w-full py-2" onClick={() => setShowHoldSheet(true)}>Pay anyway (demo)</button>
                  )}
                </>
              )}
              {view.primary === 'verify' && (
                <>
                  <button className="pill-primary" onClick={() => handleDecision('verify')}>Verify payee first</button>
                  {view.mode === 'demo-pay' && view.payLabel && (
                    <button className="pill-outline" onClick={() => setShowPaySheet(true)}>{view.payLabel}</button>
                  )}
                  <button className="pill-text w-full py-3" onClick={() => handleDecision('cancelled')}>Cancel</button>
                </>
              )}
              {view.primary === 'pay' && (
                <>
                  {view.payLabel && (
                    <button className="pill-primary" onClick={() => setShowPaySheet(true)}>{view.payLabel}</button>
                  )}
                  <button className="pill-text w-full py-3" onClick={() => handleDecision('verify')}>Verify payee</button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={showHoldSheet}
        onClose={() => setShowHoldSheet(false)}
        title="Pay anyway (demo)"
        aria-label="Pay anyway (demo)"
      >
        <div className="mb-6">
          <ul className="list-disc pl-5 text-sm text-gp-ink-2 space-y-1 mb-4">
            {view.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
        <HoldButton
          className="pill-danger w-full outline-none focus:ring-2 focus:ring-offset-2 focus:ring-risk-high"
          label="Hold to pay (demo)"
          onComplete={() => {
            setShowHoldSheet(false);
            void handleDecision('paid_demo');
          }}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={showPaySheet}
        onClose={() => setShowPaySheet(false)}
        title="Confirm demo payment"
        aria-label="Confirm demo payment"
      >
        <p className="text-sm text-gp-ink-2 mb-6">This is a SIMULATION. No money will move and no bank will be contacted.</p>
        <div className="flex flex-col gap-3">
          <button className="pill-primary" onClick={() => {
            setShowPaySheet(false);
            void handleDecision('paid_demo');
          }}>Confirm (demo)</button>
          <button className="pill-text w-full py-3" onClick={() => setShowPaySheet(false)}>Back</button>
        </div>
      </BottomSheet>
    </div>
  );
}
