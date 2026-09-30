import type { CSSProperties, ElementType, ReactNode } from 'react';
import { SOC_TONES, type SocTone } from './tones';

export interface HudPanelProps {
  /** Small caps line above the title, e.g. "MONITOR · SIMULATION". */
  eyebrow?: ReactNode;
  title?: ReactNode;
  /** Right side of the header (pills, buttons). */
  right?: ReactNode;
  /** Accent colour for the panel. Default cyan. */
  tone?: SocTone;
  as?: ElementType;
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
  'data-testid'?: string;
  'aria-label'?: string;
}

/** Frosted glass card with a clean header: eyebrow, title and optional right-side actions. */
export function HudPanel({
  eyebrow,
  title,
  right,
  tone = 'cyan',
  as: Tag = 'section',
  titleAs: TitleTag = 'h2',
  className = '',
  bodyClassName = 'p-4',
  children,
  'data-testid': testId,
  'aria-label': ariaLabel,
}: HudPanelProps) {
  const style = { '--hud-accent': SOC_TONES[tone].hex } as CSSProperties;
  const hasHeader = Boolean(eyebrow || title || right);
  return (
    <Tag className={`hud-panel ${className}`} style={style} data-testid={testId} aria-label={ariaLabel}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            {eyebrow && <p className="hud-eyebrow">{eyebrow}</p>}
            {title && <TitleTag className="hud-title mt-1 break-words">{title}</TitleTag>}
          </div>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </Tag>
  );
}
