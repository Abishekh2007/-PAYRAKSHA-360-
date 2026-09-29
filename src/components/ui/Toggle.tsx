import { motion } from 'framer-motion';

export interface ToggleProps { checked: boolean; onChange: (next: boolean) => void; label: string; description?: string; disabled?: boolean; className?: string }

export function Toggle({ checked, onChange, label, description, disabled = false, className = '' }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-4 w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg p-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'} ${className}`.trim()}
    >
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-slate-200">{label}</span>
        {description && <span className="text-sm text-slate-400">{description}</span>}
      </div>
      <div className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${checked ? 'bg-brand-500' : 'bg-slate-600'}`}>
        <motion.span
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0"
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}