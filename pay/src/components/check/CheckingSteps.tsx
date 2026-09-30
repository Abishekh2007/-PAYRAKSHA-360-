import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  'Reading payment details',
  'Checking the payee',
  'Looking for scam patterns',
  'Scoring the risk'
];

export const CheckingSteps: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 400); // Sequence through steps
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center pt-24 min-h-[50vh]">
      <div className="w-16 h-16 bg-gp-blue rounded-2xl animate-pulse-soft mb-6" />
      <h2 className="text-2xl font-medium mb-8">PayRaksha is checking this payment</h2>

      <div className="flex flex-col items-start gap-4 mx-auto">
        {STEPS.map((step, i) => {
          const isActive = i <= activeStep;
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isActive ? 1 : 0.4, x: isActive ? 0 : -10 }}
              className="flex items-center gap-3"
            >
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-gp-blue' : 'bg-gp-line'}`} />
              <span className={`text-base font-medium ${isActive ? 'text-gp-ink' : 'text-gp-ink-3'}`}>
                {step}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
