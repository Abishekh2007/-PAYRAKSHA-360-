import type { ActionId, Recommendation, RiskLevelId } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button, type ButtonVariant } from '../ui/Button';

export interface RecommendationPanelProps {
  recommendation: Recommendation;
  level: RiskLevelId;
  onAction?: (id: ActionId) => void;
  className?: string
}

export function RecommendationPanel({ recommendation, level, onAction, className = '' }: RecommendationPanelProps) {
  const isHigh = level === 'HIGH';
  const prefix = (isHigh && !recommendation.title.startsWith('🛑')) ? '🛑 ' : '';

  const getVariantForAction = (id: ActionId): ButtonVariant => {
    switch (id) {
      case 'verify': return 'primary';
      case 'cancel': return 'outline';
      case 'trusted': return 'safe';
      case 'analysis': return 'ghost';
      case 'continue': return 'safe';
      default: return 'primary';
    }
  };

  return (
    <GlassCard data-level={level} className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">RECOMMENDED ACTION</p>
      <h3 className="text-xl font-display font-bold mb-2 text-slate-200">
        {prefix}{recommendation.title}
      </h3>
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
    </GlassCard>
  );
}
