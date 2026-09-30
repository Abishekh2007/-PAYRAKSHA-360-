import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95 }}
           className="fixed bottom-24 left-4 right-4 z-50 flex justify-center pointer-events-none"
        >
          <div role="status" className="bg-gp-ink-2 text-gp-bg px-4 py-3 rounded-xl shadow-float text-[14px] leading-tight text-center max-w-[320px]">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
