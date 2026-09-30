import { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { scenarios } from '../../../../src/engine';
import { X } from 'lucide-react';

interface SampleSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (qrText: string, label: string) => void;
}

export function SampleSheet({ open, onClose, onSelect }: SampleSheetProps) {
  const shouldReduceMotion = useReducedMotion();
  const yOffset = shouldReduceMotion ? 0 : '100%';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="Demo QR samples"
            initial={{ y: yOffset }}
            animate={{ y: 0 }}
            exit={{ y: yOffset }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50 max-h-[85vh] flex flex-col shadow-sheet"
          >
            <div className="flex items-center justify-between p-4 border-b border-gp-surface-2 bg-white rounded-t-3xl sticky top-0 shrink-0">
              <h2 className="text-[22px] font-medium text-gp-ink">Demo QR samples</h2>
              <button
                onClick={onClose}
                className="p-2 text-gp-ink-2 hover:bg-gp-surface rounded-full"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-4 pb-12">
              {scenarios
                .filter((s) => s.qrText != null && s.qrText.trim() !== '')
                .map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      onSelect(scenario.qrText!, scenario.title);
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 text-left p-3 rounded-2xl active:bg-gp-surface-2"
                  >
                    <div className="w-12 h-12 bg-gp-surface flex items-center justify-center rounded-full text-2xl shrink-0">
                      {scenario.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[15px] text-gp-ink line-clamp-1">
                          {scenario.title}
                        </span>
                        <span className="text-[10px] font-bold bg-gp-surface-2 text-gp-ink-2 px-1.5 py-0.5 rounded shrink-0">
                          DEMO
                        </span>
                      </div>
                      {scenario.shortLabel && (
                        <p className="text-[12px] text-gp-ink-3 mt-0.5">
                          {scenario.shortLabel}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
