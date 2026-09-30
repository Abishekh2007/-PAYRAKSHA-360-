// STUB: contract only (NEXT_MOVES is final, head-written content). Builder task `intel` implements the rest.
// The acceptance tests in test/acceptance/next-move.test.tsx are written from the comments below.
import type { CategoryId, RiskReport } from '../../types';

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
 * Examples (runScenarioLocal): 'utility_scam' (92) → category 'utility', likelihood 78, basis 'Utility / Electricity pattern · 8 warning signals';
 *   'customer_care_scam' (88) → category 'customer_care', likelihood 75; 'legit_utility' → null.
 */
export function predictNextMove(report: RiskReport | null | undefined): NextMove | null {
  void report;
  return null;
}

export interface NextMoveCardProps {
  report: RiskReport | null;
  className?: string;
}

/**
 * Violet prediction card.
 * Renders a wrapper with data-testid="next-move", heading text "SCAMMER'S LIKELY NEXT MOVE" and the text 'SIMULATION', and:
 *   - when predictNextMove(report) is not null: move, counter (under the text 'COUNTER-MOVE'), basis, and an element
 *     data-testid="next-move-likelihood" whose text contains `${likelihood}%`, next to the words 'simulated likelihood'
 *   - otherwise: the text 'NO NEXT MOVE PREDICTED' and no next-move-likelihood element
 */
export function NextMoveCard({ report, className = '' }: NextMoveCardProps) {
  return (
    <div data-testid="next-move-stub" className={className}>
      Next move (not built yet){report ? `: ${report.level}` : ''}
    </div>
  );
}
