import type { PaymentContext } from '../../types';
import { fmtINR } from '../../engine';
import { HudPanel, StatusPill } from '../soc';

export interface PaymentPreviewProps {
  payment: PaymentContext;
  title?: string;
  className?: string
}

export function PaymentPreview({ payment, title = 'PAYMENT PREVIEW', className = '' }: PaymentPreviewProps) {
  const p = payment as any;
  const hasInDirectory = p.inDirectory === true;

  let recipientStatus = 'Not verified';
  if (payment.recipientVerified) {
    recipientStatus = '✓ Verified demo recipient';
  } else if (payment.previousPayments === 0 && !hasInDirectory) {
    recipientStatus = 'Unknown / first-time recipient';
  }

  return (
    <HudPanel
      as="div"
      tone="cyan"
      eyebrow="PAYMENT PREVIEW · DEMO"
      title={title}
      right={<StatusPill tone="amber">DEMO</StatusPill>}
      className={className}
      bodyClassName="p-4"
    >
      <dl className="space-y-2">
        <div className="flex justify-between items-center border-b border-cyan-400/10 pb-2">
          <dt className="hud-label text-slate-400">Recipient</dt>
          <dd className="font-mono text-sm text-right text-slate-200 ml-2">
            {p.recipientName ? `${payment.recipient} (${p.recipientName})` : (payment.recipient ?? 'Not identified')}
          </dd>
        </div>
        <div className="flex justify-between items-center border-b border-cyan-400/10 pb-2">
          <dt className="hud-label text-slate-400">Amount</dt>
          <dd className="font-mono text-sm font-bold text-right text-slate-100 ml-2">
            {payment.amount != null ? fmtINR(payment.amount) : 'Not identified'}
          </dd>
        </div>
        <div className="flex justify-between items-center border-b border-cyan-400/10 pb-2">
          <dt className="hud-label text-slate-400">Merchant</dt>
          <dd className="font-mono text-sm text-right text-slate-200 ml-2">{payment.merchant ?? 'Not identified'}</dd>
        </div>
        <div className="flex justify-between items-center border-b border-cyan-400/10 pb-2">
          <dt className="hud-label text-slate-400">Source</dt>
          <dd className="font-mono text-sm text-right text-slate-200 ml-2">{payment.sourceLabel ?? 'Not identified'}</dd>
        </div>
        <div className="flex justify-between items-center pt-1">
          <dt className="hud-label text-slate-400">Recipient status</dt>
          <dd className={`font-mono text-sm text-right ml-2 ${payment.recipientVerified ? 'text-green-400' : 'text-amber-400'}`}>
            {recipientStatus}
          </dd>
        </div>
      </dl>

      <div className="mt-4 pt-3 border-t border-cyan-400/10 hud-eyebrow text-center">
        Preview only. PAYRAKSHA never sends money.
      </div>
    </HudPanel>
  );
}
