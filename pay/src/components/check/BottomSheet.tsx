import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  'aria-label'?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children, 'aria-label': ariaLabel }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-sheet p-6 pb-12 flex flex-col"
            role="dialog"
            aria-label={ariaLabel || title}
          >
            {title && <h2 className="text-xl font-medium mb-4">{title}</h2>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
