import type { ActionId, Recommendation, RiskLevelId } from '../../types';
import { HudPanel, socToneForLevel } from '../soc';
import { Button, type ButtonVariant } from '../ui/Button';

export interface RecommendationPanelProps {
  recommendation: Recommendation;
  level: RiskLevelId;
  onAction?: (id: ActionId) => void;
  className?: string
}

export function RecommendationPanel({ recommendation, level, onAction, className = '' }: RecommendationPanelProps) {
  const isHigh = level === 'HIGH';
  const tone = socToneForLevel(level);

  const getVariantForAction = (id: ActionId): ButtonVariant => {
    switch (id) {
      case 'verify': return 'primary';
      case 'cancel': return 'danger';
      case 'trusted': return 'safe';
      case 'analysis': return 'ghost';
      case 'continue': return 'safe';
      default: return 'primary';
    }
  };

  return (
    <HudPanel
      as="div"
      data-level={level}
      tone={tone}
      eyebrow="RECOMMENDED ACTION"
      title={recommendation.title}
      className={className}
      bodyClassName="p-4"
    >
      {isHigh && (
        <div
          data-testid="dont-pay-heading"
          className="mb-4 text-center font-mono font-bold text-2xl uppercase tracking-widest text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        >
          DON&apos;T PAY YET
        </div>
      )}

      <p className="text-slate-300 mb-6 leading-relaxed text-sm">
        {recommendation.message}
      </p>

      <div className="space-y-3 flex flex-col">
        {recommendation.actions.map((a) => (
          <Button
            key={a.id}
            variant={getVariantForAction(a.id)}
            onClick={() => onAction?.(a.id)}
            fullWidth
            aria-label={a.label}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </HudPanel>
  );
}
