import { motion, useReducedMotion } from 'framer-motion';
import type { AttackChainNode } from '../../types';

export interface AttackChainViewProps {
  nodes: AttackChainNode[];
  animate?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'responsive';
  className?: string;
}

export function AttackChainView({ nodes, animate = true, orientation = 'responsive', className = '' }: AttackChainViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.25,
      }
    }
  };

  const itemVariants = {
    hidden: shouldAnimate ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  let layoutClass = 'flex flex-col';
  if (orientation === 'horizontal') layoutClass = 'flex flex-row';
  else if (orientation === 'responsive') layoutClass = 'flex flex-col lg:flex-row';

  return (
    <motion.ol
      data-testid="attack-chain"
      data-orientation={orientation}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`relative ${layoutClass} gap-6 ${className}`}
    >
      {nodes.map((n, index) => {
        const isLast = index === nodes.length - 1;
        const activeStyles = n.active
          ? 'bg-gradient-to-br from-risk-elevated/20 to-risk-high/20 border-risk-high/40 shadow-glow-high text-red-50'
          : 'bg-slate-900/40 border-slate-700/50 text-slate-400 opacity-70';

        return (
          <motion.li
            key={n.id}
            data-active={String(n.active)}
            variants={itemVariants}
            className={`relative flex-1 flex flex-col p-4 border rounded-xl backdrop-blur-sm ${activeStyles}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl" aria-hidden="true">{n.icon}</span>
              <span className="font-semibold">{n.label}</span>
            </div>

            <p className="text-sm mt-1 mb-2">
              {n.detail}
            </p>

            {!n.active && (
              <span className="text-xs uppercase font-medium tracking-wider text-slate-500 mt-auto pt-2 border-t border-slate-700">
                Not observed
              </span>
            )}

            {n.active && n.id === 'payment' && (
              <div className="mt-auto pt-2 border-t border-risk-high/30 text-risk-high font-bold flex items-center gap-1.5 text-xs">
                <span>🛑</span> PAYRAKSHA pauses here
              </div>
            )}

            {!isLast && (
              <div
                className={`absolute pointer-events-none ${n.active && nodes[index + 1]?.active ? 'bg-risk-elevated shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-slate-700'} ${
                  orientation === 'horizontal' ? 'top-1/2 -right-6 w-6 h-[3px] -translate-y-1/2' :
                  orientation === 'vertical' ? 'left-1/2 -bottom-6 h-6 w-[3px] -translate-x-1/2' :
                  'left-1/2 -bottom-6 h-6 w-[3px] -translate-x-1/2 lg:top-1/2 lg:-right-6 lg:left-auto lg:bottom-auto lg:w-6 lg:h-[3px] lg:-translate-y-1/2 lg:translate-x-0'
                }`}
                aria-hidden="true"
              />
            )}
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
