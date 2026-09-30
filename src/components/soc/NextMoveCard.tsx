// The acceptance tests in test/acceptance/next-move.test.tsx are written from the comments below.
import type { CategoryId, RiskReport } from '../../types';
import { HudPanel } from './HudPanel';
import { StatusPill } from './StatusPill';

export interface NextMove {
  category: CategoryId;
  /** What this kind of scam is likely to try next. */
  move: string;
  /** What the user should do instead. */
  counter: string;
  /** Simulated likelihood, integer percent in [55, 90]. */
  likelihood: number;
  basis: string;
}

/**
 * Wording rules: never state fraud as certain (use "likely", "may"); never ask for a PIN, OTP, password or card number —
 * the counter-move reminds the user that genuine organisations never ask for them.
 */
export const NEXT_MOVES: Record<CategoryId, { move: string; counter: string }> = {
  utility: {
    move: "Likely to ask for an OTP or a screen-sharing app 'to stop the disconnection'.",
    counter: 'Electricity providers never need an OTP or screen sharing. Pay only in the official app or website.',
  },
  bank_kyc: {
    move: "Likely to send a link asking for your UPI PIN or OTP 'to complete KYC'.",
    counter: 'Banks never ask for your UPI PIN or OTP. Update KYC only in the official app or at a branch.',
  },
  customer_care: {
    move: "Likely to ask you to install a remote-access app or approve a collect request 'for your refund'.",
    counter: 'Refunds never need a PIN or a collect approval. Hang up and call the number on the official website.',
  },
  shopping: {
    move: "May push a 'last few minutes' countdown and ask for advance payment to a personal UPI ID.",
    counter: 'Buy only from stores you know. Do not pay a personal UPI ID from an advert.',
  },
  prize: {
    move: "Likely to ask for a 'processing' or 'tax' fee before releasing the prize.",
    counter: 'A genuine prize never needs a fee. Ignore the message and report it.',
  },
  job: {
    move: "Likely to ask for a 'registration' or 'training kit' fee, then more paid 'tasks'.",
    counter: 'Genuine employers never charge you to start work.',
  },
  investment: {
    move: "May show profit screenshots and ask for a bigger 'upgrade' deposit.",
    counter: 'Guaranteed returns are a warning sign. Check the adviser is registered before investing.',
  },
  refund: {
    move: "Likely to send a 'refund' request that actually takes money, asking for your UPI PIN.",
    counter: 'You never enter a PIN to receive money.',
  },
  parcel: {
    move: "Likely to ask for a small 'customs' fee through a link, then card or OTP details.",
    counter: "Check the courier's official app. Customs fees are never paid to a personal UPI ID.",
  },
  qr_receive: {
    move: "Likely to send a QR code and ask you to scan it and enter your PIN 'to receive money'.",
    counter: 'Scanning a QR and entering a PIN always sends money. You never scan to receive.',
  },
  personal: {
    move: 'May claim an emergency and ask for money to a new number.',
    counter: 'Call the person on the number you already know before paying.',
  },
  unknown: {
    move: 'May follow up with more calls or messages to rush the payment.',
    counter: 'Pause and verify through an official channel before paying anything.',
  },
};

/**
 * null when report is null / undefined or report.level === 'LOW'. Otherwise:
 *   category   = report.analyses.text.category when it is a key of NEXT_MOVES, else report.payment.category when it is, else 'unknown'
 *   move, counter = NEXT_MOVES[category]
 *   likelihood = Math.min(90, Math.max(55, Math.round(report.score * 0.85)))
 *   basis      = `${label} pattern · ${n} warning signals`, where label = report.analyses.text.categoryLabel when the category came
 *                from the text, else report.payment.categoryLabel, and n = the number of report.dna strands with severity !== 'none'
 */
export function predictNextMove(report: RiskReport | null | undefined): NextMove | null {
  if (!report) return null;
  if (report.level === 'LOW') return null;

  const textCategory = report.analyses.text.category as CategoryId;
  const paymentCategory = report.payment?.category as CategoryId | undefined;

  let category: CategoryId;
  let label: string;
  let fromText: boolean;

  if (textCategory && textCategory in NEXT_MOVES) {
    category = textCategory;
    label = report.analyses.text.categoryLabel;
    fromText = true;
  } else if (paymentCategory && paymentCategory in NEXT_MOVES) {
    category = paymentCategory;
    label = report.payment?.categoryLabel ?? paymentCategory;
    fromText = false;
  } else {
    category = 'unknown';
    label = 'Unknown';
    fromText = false;
  }

  void fromText;

  const { move, counter } = NEXT_MOVES[category];
  const likelihood = Math.min(90, Math.max(55, Math.round(report.score * 0.85)));
  const n = report.dna.filter((s) => s.severity !== 'none').length;
  const basis = `${label} pattern · ${n} warning signals`;

  return { category, move, counter, likelihood, basis };
}

export interface NextMoveCardProps {
  report: RiskReport | null;
  className?: string;
}

/**
 * Violet prediction card.
 */
export function NextMoveCard({ report, className = '' }: NextMoveCardProps) {
  const move = predictNextMove(report);

  return (
    <div data-testid="next-move" className={className}>
      <HudPanel
        tone="violet"
        eyebrow="PREDICTION · SIMULATION"
        title="SCAMMER'S LIKELY NEXT MOVE"
        right={<StatusPill tone="violet">SIMULATION</StatusPill>}
        bodyClassName="p-4"
      >
        {move ? (
          <div className="flex flex-col gap-4">
            {/* Move text */}
            <p className="text-base text-slate-100">{move.move}</p>

            {/* Counter-move */}
            <div className="border-l-2 border-green-400/40 bg-green-500/10 pl-3 py-2 rounded-sm">
              <p className="hud-label text-green-300 mb-1">COUNTER-MOVE</p>
              <p className="text-sm text-slate-200">{move.counter}</p>
            </div>

            {/* Likelihood */}
            <div className="flex items-baseline gap-3">
              <span
                data-testid="next-move-likelihood"
                className="hud-num hud-glow text-3xl font-bold text-violet-300"
              >
                {move.likelihood}%
              </span>
              <span className="hud-label text-slate-400">simulated likelihood</span>
            </div>

            {/* Basis */}
            <p className="hud-label text-slate-500">{move.basis}</p>

            {/* Disclaimer */}
            <p className="text-xs text-slate-500">
              Prediction from DEMO patterns — not a certainty.
            </p>
          </div>
        ) : (
          <p className="hud-label text-slate-500">NO NEXT MOVE PREDICTED</p>
        )}
      </HudPanel>
    </div>
  );
}
