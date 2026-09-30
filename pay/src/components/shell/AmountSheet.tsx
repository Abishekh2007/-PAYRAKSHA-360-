import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Delete } from 'lucide-react';
import { usePayStore } from '../../store/payStore';
import { useNavigate } from 'react-router-dom';

export interface AmountSheetProps {
  isOpen: boolean;
  onClose: () => void;
  payeeName: string;
  vpa: string;
  avatarColor: string;
  initial: string;
}

export function AmountSheet({ isOpen, onClose, payeeName, vpa, avatarColor, initial }: AmountSheetProps) {
  const [amountStr, setAmountStr] = useState('0');
  const navigate = useNavigate();

  const handlePad = (key: string) => {
    if (key === 'delete') {
      setAmountStr(s => s.length > 1 ? s.slice(0, -1) : '0');
      return;
    }
    let newValue = amountStr;
    if (key === '.') {
      if (!amountStr.includes('.')) newValue = amountStr + '.';
    } else {
      newValue = amountStr === '0' ? key : amountStr + key;
    }

    const parts = newValue.split('.');
    if (parts.length === 2 && parts[1].length > 2) return;

    if (parseFloat(newValue) > 100000) return;
    setAmountStr(newValue);
  };

  const amount = parseFloat(amountStr);

  const handlePay = () => {
    usePayStore.getState().setDraft({
      input: { payment: { recipient: vpa, amount } },
      source: 'manual',
      label: 'Pay ' + payeeName
    });
    navigate('/pay');
    setAmountStr('0');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
         <>
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 0.5 }}
             exit={{ opacity: 0 }}
             role="presentation"
             className="fixed inset-0 bg-black z-40"
             onClick={onClose}
           />
           <motion.div
             initial={{ y: '100%' }}
             animate={{ y: 0 }}
             exit={{ y: '100%' }}
             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
             className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-sheet flex flex-col"
             role="dialog"
             aria-label={`Pay ${payeeName}`}
           >
             <div className="flex flex-col items-center pt-6 pb-4">
                <div className={`avatar w-12 h-12 flex items-center justify-center rounded-full text-white text-xl font-medium mb-3 ${avatarColor}`}>
                  {initial}
                </div>
                <h2 className="text-[15px] font-medium text-gp-ink">{payeeName}</h2>
                <p className="text-[12px] text-gp-ink-3">Paying {vpa}</p>
             </div>

             <div className="flex justify-center text-4xl sm:text-5xl font-medium tabular-nums text-gp-ink py-4">
               ₹{amountStr}
             </div>

             <div className="grid grid-cols-3 gap-y-4 py-4 px-6 max-w-sm mx-auto w-full">
                {[1,2,3,4,5,6,7,8,9,'.',0,'delete'].map(key => {
                  if (key === 'delete') {
                    return (
                      <button key={key} aria-label="Delete" onClick={() => handlePad(key.toString())} className="flex items-center justify-center h-14 active:bg-gp-surface-2 rounded-full">
                         <Delete size={24} className="stroke-2 text-gp-ink" />
                      </button>
                    );
                  }
                  const label = key === '.' ? 'Decimal point' : `Digit ${key}`;
                  return (
                    <button key={key} aria-label={label} onClick={() => handlePad(key.toString())} className="flex items-center justify-center h-14 text-2xl active:bg-gp-surface-2 rounded-full font-medium text-gp-ink tabular-nums">
                       {key}
                    </button>
                  );
                })}
             </div>

             <div className="p-4 flex justify-center pb-8">
               <button
                 className="pill-primary px-6 flex items-center gap-2 min-w-[140px] justify-center disabled:opacity-50 disabled:active:scale-100"
                 disabled={amount === 0 || isNaN(amount)}
                 onClick={handlePay}
               >
                 Check & pay
                 <ArrowRight size={20} className="stroke-2" />
               </button>
             </div>
           </motion.div>
         </>
      )}
    </AnimatePresence>
  );
}
