import type { PaymentContext } from '../../types';
import { fmtINR } from '../../engine';
import { GlassCard } from '../ui/GlassCard';
import { SimulationBadge } from '../ui/SimulationBadge';

export interface PaymentPreviewProps {
  payment: PaymentContext;
  title?: string;
  className?: string
}

export function PaymentPreview({ payment, title = 'PAYMENT PREVIEW', className = '' }: PaymentPreviewProps) {
  // Hack to access undocumented fields based on the contract
  const p = payment as any;
  const hasInDirectory = p.inDirectory === true;

  let recipientStatus = 'Not verified';
  if (payment.recipientVerified) {
    recipientStatus = '✓ Verified demo recipient';
  } else if (payment.previousPayments === 0 && !hasInDirectory) {
    recipientStatus = 'Unknown / first-time recipient';
  }

  return (
    <GlassCard className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-slate-200">{title}</h3>
        <SimulationBadge />
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between border-b border-white/10 pb-2">
          <dt className="text-slate-400">Recipient</dt>
          <dd className="font-semibold text-right text-slate-200">
            {p.recipientName ? `${payment.recipient} (${p.recipientName})` : (payment.recipient ?? 'Not identified')}
          </dd>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <dt className="text-slate-400">Amount</dt>
          <dd className="font-semibold text-right text-slate-200">{payment.amount != null ? fmtINR(payment.amount) : 'Not identified'}</dd>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <dt className="text-slate-400">Merchant</dt>
          <dd className="font-semibold text-right text-slate-200">{payment.merchant ?? 'Not identified'}</dd>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <dt className="text-slate-400">Source</dt>
          <dd className="font-semibold text-right text-slate-200">{payment.sourceLabel ?? 'Not identified'}</dd>
        </div>
        <div className="flex justify-between pt-1">
          <dt className="text-slate-400">Recipient status</dt>
          <dd className={`font-semibold text-right ${payment.recipientVerified ? 'text-green-400' : 'text-amber-400'}`}>
            {recipientStatus}
          </dd>
        </div>
      </dl>

      <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 text-center">
        Preview only. PAYRAKSHA never sends money.
      </div>
    </GlassCard>
  );
}
