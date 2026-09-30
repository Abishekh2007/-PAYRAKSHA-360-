import { useState } from 'react';
import type { ActionId, EngineSource, MlInsight, RiskReport } from '../../types';
import { EngineBadge } from '../ui/EngineBadge';
import { ExplanationPanel } from './ExplanationPanel';
import { MlInsightCard } from './MlInsightCard';
import { PaymentPreview } from './PaymentPreview';
import { RecommendationPanel } from './RecommendationPanel';
import { RiskScoreCard } from './RiskScoreCard';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDemoStore } from '../../store/demoStore';

export interface RiskResultViewProps {
  report: RiskReport;
  source?: EngineSource;
  latencyMs?: number | null;
  ml?: MlInsight | null;
  /** Default true. */
  showPayment?: boolean;
  onAction?: (id: ActionId) => void;
  className?: string;
}

export function RiskResultView({
  report,
  source,
  latencyMs = null,
  ml = null,
  showPayment = true,
  onAction,
  className = ''
}: RiskResultViewProps) {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [inlineNote, setInlineNote] = useState<string | null>(null);

  const handleAction = (id: ActionId) => {
    if (onAction) {
      onAction(id);
      return;
    }

    setInlineNote(null);
    switch (id) {
      case 'analysis':
        navigate('/explain');
        break;
      case 'trusted':
        useDemoStore.getState().sendTrustedAlert(report);
        navigate('/trusted');
        break;
      case 'verify':
        setInlineNote('Verify through the official app or website of the organisation. Never use links or phone numbers from the message. (Simulation: nothing was sent.)');
        break;
      case 'cancel':
        setInlineNote('Payment cancelled (simulation). No money moved.');
        break;
      case 'continue':
        setInlineNote('CONTINUE (SIMULATION): this demo never makes a real payment.');
        break;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05, duration: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      data-testid="risk-result"
      data-score={report.score}
      data-level={report.level}
      className={`grid gap-4 lg:grid-cols-12 ${className}`}
    >
      {/* Left column: score + recommendation */}
      <div className="flex flex-col gap-4 lg:col-span-5">
        {showPayment && (
          <motion.div variants={item}>
            <PaymentPreview payment={report.payment} />
          </motion.div>
        )}
        <motion.div variants={item}>
          <RiskScoreCard report={report} />
        </motion.div>
        {source && (
          <motion.div variants={item} className="text-center lg:text-left">
            <EngineBadge source={source} latencyMs={latencyMs} />
          </motion.div>
        )}
        <motion.div variants={item}>
          <MlInsightCard ml={ml} />
        </motion.div>
      </div>

      {/* Right column: explanation + recommendation */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <motion.div variants={item}>
          <ExplanationPanel report={report} />
        </motion.div>
        <motion.div variants={item}>
          <div className="flex flex-col gap-3">
            <RecommendationPanel recommendation={report.recommendation} level={report.level} onAction={handleAction} />

            {inlineNote && (
              <div role="status" className="p-3 hud-panel text-sm text-slate-300 border border-cyan-400/15">
                {inlineNote}
              </div>
            )}
          </div>
        </motion.div>

        {report.notice && (
          <motion.div variants={item}>
            <div className="hud-eyebrow text-center lg:text-left">
              {report.notice}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
