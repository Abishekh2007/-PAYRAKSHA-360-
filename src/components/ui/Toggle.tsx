import { motion } from 'framer-motion';

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, description, disabled = false, className = '' }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-4 w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded-xl p-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'} ${className}`.trim()}
    >
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-slate-200">{label}</span>
        {description && <span className="text-xs text-slate-400">{description}</span>}
      </div>
      <div
        className={`relative inline-flex h-5 w-10 shrink-0 rounded-sm border transition-colors duration-200 ${
          checked
            ? 'border-cyan-400/70 bg-cyan-400/25 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
            : 'border-slate-600 bg-slate-800/80'
        }`}
      >
        <motion.span
          className={`absolute top-[3px] inline-block h-3.5 w-3.5 rounded-[2px] ${checked ? 'bg-cyan-300' : 'bg-slate-400'}`}
          initial={false}
          animate={{ x: checked ? 20 : 3 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}
