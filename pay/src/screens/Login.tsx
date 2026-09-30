// DEMO login gate. Demo code 3023 unlocks the app for this browser tab; nothing is stored beyond a session flag.
import { ShieldCheck } from 'lucide-react';
import { CodePad, DEMO_LOGIN_CODE } from '../components/CodePad';

export const LOGIN_KEY = 'rakshapay.demo-login';

export function isLoggedIn(): boolean {
  try { return sessionStorage.getItem(LOGIN_KEY) === '1'; } catch { return false; }
}

export default function Login({ onLogin }: { onLogin: () => void }) {
  const done = () => {
    try { sessionStorage.setItem(LOGIN_KEY, '1'); } catch { /* private mode */ }
    onLogin();
  };
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col items-center gap-2 px-6 pb-8 pt-10 text-white" style={{ backgroundImage: 'var(--brand-gradient)' }}>
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur"><ShieldCheck size={34} /></span>
        <h1 className="text-[26px] font-semibold tracking-tight">RakshaPay</h1>
        <p className="text-[13px] text-white/85">Think before you pay · DEMO</p>
      </div>
      <div className="-mt-5 flex-1 rounded-t-[28px] bg-white px-6 pt-8">
        <CodePad testId="login-pad" expected={DEMO_LOGIN_CODE} title="Enter demo login code"
          subtitle="Enter the 4-digit hackathon demo code to unlock" onSuccess={done} />
      </div>
    </div>
  );
}
