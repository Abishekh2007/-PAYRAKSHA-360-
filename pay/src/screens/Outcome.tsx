import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePayStore } from '../store/payStore';
import { formatInr, maskVpa, isDemoVpa } from '../lib/payView';
import { ShieldAlert, AlertTriangle, MessageCircle, CheckCircle2, Info, ArrowLeft } from 'lucide-react';
import type { PayRecord } from '../store/payStore';

export default function Outcome() {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { records } = usePayStore();

  const record = records.find(r => r.id === recordId);

  if (!record) {
    return (
      <div className="flex flex-col h-full bg-gp-surface text-gp-ink p-6 items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-risk-high mb-4" />
        <h1 className="text-xl font-medium mb-6">We couldn't find that check</h1>
        <button className="pill-primary" onClick={() => navigate('/')}>Home</button>
      </div>
    );
  }

  const renderHero = (r: PayRecord) => {
    switch (r.decision) {
      case 'cancelled':
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-risk-high/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-risk-high" />
            </div>
            <h1 className="text-2xl font-medium mb-2">Payment cancelled</h1>
            <p className="text-gp-ink-2">Good call. You stopped a potentially risky payment.</p>
          </div>
        );
      case 'verify':
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-risk-caution/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-risk-caution" />
            </div>
            <h1 className="text-2xl font-medium mb-4">Verify before you pay</h1>
            <div className="text-left bg-white rounded-2xl p-4 shadow-sm border border-gp-surface-2 text-sm text-gp-ink-2 space-y-3">
              <div className="flex gap-2"><span>•</span> Call the business on a number you already know</div>
              <div className="flex gap-2"><span>•</span> Check the official app or website</div>
              <div className="flex gap-2"><span>•</span> Never share OTP / PIN / passwords</div>
              <div className="flex gap-2"><span>•</span> Ask someone you trust</div>
            </div>
          </div>
        );
      case 'trusted':
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gp-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gp-blue" />
            </div>
            <h1 className="text-2xl font-medium mb-2">Trusted contact alerted (demo)</h1>
            <p className="text-gp-ink-2">SIMULATION · no message was actually sent</p>
          </div>
        );
      case 'paid_demo':
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-risk-low/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-risk-low" />
            </div>
            <h1 className="text-2xl font-medium mb-2">Demo payment complete</h1>
            {r.amount !== null && (
              <div className="text-[44px] leading-tight font-medium tracking-tight mt-2">{formatInr(r.amount)}</div>
            )}
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gp-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-gp-ink-3" />
            </div>
            <h1 className="text-2xl font-medium mb-2">Check saved</h1>
          </div>
        );
    }
  };

  const tonePillBg = {
    LOW: 'bg-risk-low-soft text-risk-low-ink',
    CAUTION: 'bg-risk-caution-soft text-risk-caution-ink',
    HIGH_CAUTION: 'bg-risk-elevated-soft text-risk-elevated-ink',
    HIGH: 'bg-risk-high-soft text-risk-high-ink',
  };

  const displayVpa = record.recipient ? (isDemoVpa(record.recipient) ? record.recipient : maskVpa(record.recipient)) : null;
  const time = new Date(record.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col min-h-full bg-gp-surface text-gp-ink pb-32">
      <div className="px-4 py-3 flex items-center bg-transparent z-10 sticky top-0">
        <button aria-label="Back" className="p-2 -ml-2 rounded-full hover:bg-black/5" onClick={() => navigate('/')}>
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="px-6 flex-1 flex flex-col max-w-[400px] mx-auto w-full">
        {renderHero(record)}

        <div className="bg-risk-elevated-soft text-risk-elevated-ink text-sm font-medium text-center p-3 rounded-xl mb-6 mx-auto">
          SIMULATION · No money moved · No bank was contacted
        </div>

        <div className="card p-5 space-y-4 text-sm">
          <div className="flex justify-between items-start">
            <div className="text-gp-ink-3">Payee</div>
            <div className="text-right font-medium max-w-[60%]">
              <div>{record.payeeName}</div>
              {displayVpa && <div className="text-xs text-gp-ink-3 font-normal truncate mt-1">{displayVpa}</div>}
            </div>
          </div>

          {record.amount !== null && (
            <div className="flex justify-between items-center border-t border-gp-line pt-3">
              <div className="text-gp-ink-3">Amount</div>
              <div className="font-medium">{formatInr(record.amount)}</div>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-gp-line pt-3">
            <div className="text-gp-ink-3">Risk Level</div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${tonePillBg[record.level]}`}>
                {record.levelLabel}
              </span>
              <span className="font-medium text-gp-ink-2">RISK {record.score}</span>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-gp-line pt-3">
            <div className="text-gp-ink-3">Time</div>
            <div className="font-medium text-gp-ink-2">{time}</div>
          </div>

          <div className="flex justify-between items-center border-t border-gp-line pt-3">
            <div className="text-gp-ink-3">Status</div>
            <div className="font-medium text-gp-ink-2">
              {record.eventId ? 'Mirrored on the console' : 'Checked on this phone'}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gp-surface shadow-sheet p-4 pb-safe z-30">
        <div className="flex flex-col gap-3 max-w-[400px] mx-auto w-full">
          <button className="pill-primary" onClick={() => navigate('/')}>Done</button>
          <button className="pill-outline" onClick={() => navigate('/activity')}>View activity</button>
        </div>
      </div>
    </div>
  );
}
