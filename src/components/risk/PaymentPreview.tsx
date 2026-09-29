// STUB: replaced by the risk-core task. Shows recipient, amount (fmtINR), merchant and source, with a SimulationBadge.
import type { PaymentContext } from '../../types';
import { fmtINR } from '../../engine';

export interface PaymentPreviewProps { payment: PaymentContext; /** Default 'PAYMENT PREVIEW'. */ title?: string; className?: string }

export function PaymentPreview({ payment, title = 'PAYMENT PREVIEW', className = '' }: PaymentPreviewProps) {
  return (
    <div className={className}>
      <h3>{title}</h3>
      <dl>
        <dt>Recipient</dt><dd>{payment.recipient ?? 'Not identified'}</dd>
        <dt>Amount</dt><dd>{payment.amount != null ? fmtINR(payment.amount) : 'Not specified'}</dd>
        <dt>Merchant</dt><dd>{payment.merchant ?? 'Not identified'}</dd>
        <dt>Source</dt><dd>{payment.sourceLabel}</dd>
      </dl>
    </div>
  );
}
