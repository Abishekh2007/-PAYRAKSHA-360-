import { motion, useReducedMotion } from 'framer-motion';
import type { AttackChainNode } from '../../types';
import type { Severity } from '../../types';
import { SOC_TONES, type SocTone } from '../soc';

export interface AttackChainViewProps {
  nodes: AttackChainNode[];
  animate?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'responsive';
  className?: string;
}

function severityTone(severity: Severity | string | undefined): SocTone {
  switch (severity) {
    case 'high': return 'red';
    case 'medium': return 'amber';
    case 'low': return 'cyan';
    default: return 'slate';
  }
}

export function AttackChainView({ nodes, animate = true, orientation = 'responsive', className = '' }: AttackChainViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15,
      }
    }
  };

  const itemVariants = {
    hidden: shouldAnimate ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  let layoutClass = 'flex flex-col';
  if (orientation === 'horizontal') layoutClass = 'flex flex-row flex-wrap';
  else if (orientation === 'responsive') layoutClass = 'flex flex-col lg:flex-row';

  return (
    <motion.ol
      data-testid="attack-chain"
      data-orientation={orientation}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`relative ${layoutClass} gap-4 ${className}`}
    >
      {nodes.map((n, index) => {
        const isLast = index === nodes.length - 1;
        const nodeSeverity = (n as any).severity as Severity | undefined;
        const tone = n.active ? severityTone(nodeSeverity) : 'slate';
        const toneClasses = SOC_TONES[tone];
        const activeNode = n.active;
        const nextActive = nodes[index + 1]?.active;

        return (
          <motion.li
            key={n.id}
            data-active={String(n.active)}
            variants={itemVariants}
            className={`relative flex-1 flex flex-col p-3 border rounded-sm backdrop-blur-sm ${
              activeNode
                ? `${toneClasses.border} ${toneClasses.bg} text-slate-200`
                : 'border-slate-700/30 bg-slate-900/20 text-slate-500 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg" aria-hidden="true">{n.icon}</span>
              <span className={`font-mono text-xs font-semibold uppercase tracking-wider ${activeNode ? toneClasses.text : 'text-slate-500'}`}>
                {n.label}
              </span>
              {activeNode && (
                <span
                  className={`ml-auto h-1.5 w-1.5 rounded-full shrink-0 ${toneClasses.dot} ${shouldAnimate ? 'animate-ping' : ''}`}
                  aria-hidden="true"
                />
              )}
            </div>

            <p className="text-xs mt-1 mb-2 text-slate-400 leading-relaxed">
              {n.detail}
            </p>

            {!n.active && (
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-600 mt-auto pt-2 border-t border-slate-800">
                Not observed
              </span>
            )}

            {n.active && n.id === 'payment' && (
              <div className="mt-auto pt-2 border-t border-red-500/30 text-red-400 font-bold flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
                <span>🛑</span> PAYRAKSHA pauses here
              </div>
            )}

            {/* → connector */}
            {!isLast && (
              <div
                className={`absolute pointer-events-none z-10 ${
                  orientation === 'horizontal'
                    ? 'top-1/2 -right-4 w-4 h-px -translate-y-1/2'
                    : orientation === 'vertical'
                    ? 'left-1/2 -bottom-4 h-4 w-px -translate-x-1/2'
                    : 'left-1/2 -bottom-4 h-4 w-px -translate-x-1/2 lg:top-1/2 lg:-right-4 lg:left-auto lg:bottom-auto lg:w-4 lg:h-px lg:-translate-y-1/2 lg:translate-x-0'
                } ${activeNode && nextActive ? 'bg-orange-400' : 'bg-slate-700'}`}
                aria-hidden="true"
              />
            )}
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
