// GPay-style 4-digit keypad for the DEMO login code and DEMO payment code.
// The code is checked locally against a fixed demo value; it is never stored or sent anywhere.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Delete, Check } from 'lucide-react';

export const DEMO_LOGIN_CODE = '3023';
export const DEMO_PAY_CODE = '2026';

export function CodePad({ expected, title, subtitle, onSuccess, testId }: {
  expected: string;
  title: string;
  subtitle: string;
  onSuccess: () => void;
  testId?: string;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const press = (d: string) => { setError(false); setCode((c) => (c.length < 4 ? c + d : c)); };
  const back = () => { setError(false); setCode((c) => c.slice(0, -1)); };

  useEffect(() => {
    if (code.length < 4) return;
    if (code === expected) { const t = setTimeout(onSuccess, 150); return () => clearTimeout(t); }
    setError(true);
    navigator.vibrate?.(120);
    const t = setTimeout(() => setCode(''), 450);
    return () => clearTimeout(t);
  }, [code, expected, onSuccess]);

  return (
    <div data-testid={testId} className="flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-[18px] font-medium text-gp-ink">{title}</p>
        <p className="mt-1 text-[13px] text-gp-ink-3">{subtitle}</p>
      </div>
      <motion.div animate={error ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.35 }} className="flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-4 w-4 rounded-full border-2 transition-colors ${
            error ? 'border-risk-high bg-risk-high' : i < code.length ? 'border-gp-blue bg-gp-blue' : 'border-gp-line'}`} />
        ))}
      </motion.div>
      <p role="alert" className="h-5 text-[13px] font-medium text-risk-high-ink">{error ? 'Incorrect demo code. Try again.' : ''}</p>
      <div className="grid w-full max-w-[280px] grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <Key key={d} label={d} onClick={() => press(d)} />
        ))}
        <Key label="Delete" onClick={back}><Delete size={22} /></Key>
        <Key label="0" onClick={() => press('0')} />
        <Key label="OK" onClick={() => code.length === 4 && code === expected && onSuccess()}><Check size={22} /></Key>
      </div>
      <p className="rounded-full bg-risk-caution-soft px-3 py-1 text-center text-[11px] font-medium text-risk-caution-ink">
        DEMO code only — never enter your real UPI PIN here
      </p>
    </div>
  );
}

function Key({ label, onClick, children }: { label: string; onClick: () => void; children?: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      className="flex h-14 items-center justify-center rounded-2xl bg-gp-surface text-[22px] font-medium text-gp-ink active:bg-gp-blue-soft">
      {children ?? label}
    </button>
  );
}
