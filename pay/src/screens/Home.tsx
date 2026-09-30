import { PalettePicker } from '../../../src/theme/PalettePicker';
import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, ShieldAlert, QrCode, Smartphone, Landmark, AtSign, RefreshCcw, FileText, Phone, Landmark as BankBalance, History, Shield as ShieldIcon, Users } from 'lucide-react';
import { usePayStore } from '../store/payStore';
import recipientsData from '../../../shared/recipients.json';
import { Toast } from '../components/shell/Toast';
import { ScanFab } from '../components/shell/ScanFab';
import { AmountSheet } from '../components/shell/AmountSheet';

const recipients = Object.entries(recipientsData).map(([vpa, data]) => ({
  vpa,
  ...data,
}));

export default function Home() {
  const { deviceName, link, setDraft } = usePayStore();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [sheetState, setSheetState] = useState<{isOpen: boolean, payeeName: string, vpa: string, initial: string, color: string}>({
    isOpen: false, payeeName: '', vpa: '', initial: '', color: 'bg-gp-blue'
  });

  const people = useMemo(() => recipients.filter(r => r.category === 'personal'), []);
  const businesses = useMemo(() => recipients.filter(r => r.category === 'shopping' || r.category === 'utility'), []);

  const openSheet = (payeeName: string, vpa: string, initial: string, color: string) => {
    setSheetState({ isOpen: true, payeeName, vpa, initial, color });
  };

  const showDemoToast = () => setToastMsg("Demo only — RakshaPay checks QR payments. Try Scan any QR code.");

  const handleTargetCheck = () => {
    if (link.target) {
       setDraft({
         input: { qrText: link.target.qrText! },
         source: 'console-target',
         label: link.target.label
       });
       navigate('/pay');
    }
  };

  const animationProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0, y: 15 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-20px" },
    transition: { duration: 0.4 }
  };

  return (
    <div className="min-h-full bg-gp-surface pb-28">
      {/* Top row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
         <button className="flex-1 bg-gp-surface rounded-full h-12 flex items-center px-4 gap-3 bg-white border border-gp-line">
           <Search size={22} className="text-gp-ink-3 stroke-2" />
           <span className="text-gp-ink-3 text-[15px]">Pay friends and merchants</span>
         </button>
         <PalettePicker />
         <Link to="/profile" aria-label="Profile" className="w-10 h-10 rounded-full bg-gp-blue text-white flex items-center justify-center font-medium shadow-sm shrink-0">
           {deviceName.charAt(0).toUpperCase()}
         </Link>
      </div>

      {/* Brand row */}
      <div className="px-4 py-4 flex flex-col gap-1 items-center">
         <div className="flex items-center gap-1.5 text-gp-ink mb-1">
            <ShieldIcon size={24} className="stroke-2 text-gp-blue" />
            <span className="text-[22px] font-medium tracking-tight">RakshaPay</span>
         </div>
         <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm">
            <div className={`w-2 h-2 rounded-full ${link.online ? 'bg-risk-low-ink' : 'bg-gp-ink-3'}`} />
            <span className="text-[12px] font-medium text-gp-ink-2">
              {link.online ? 'Linked to console' : 'Console offline · checks run on this phone'}
            </span>
         </div>
      </div>

      {/* Hero card */}
      <motion.div {...animationProps} className="px-4 mb-6">
        <div className="card shadow-card p-5 flex flex-col items-center text-center gap-3 text-white" style={{ backgroundImage: 'var(--brand-gradient)' }}>
           <div className="text-[18px] font-semibold leading-tight">Scan. Check. Then pay.</div>
           <p className="text-[14px] text-white/85 max-w-[260px]">PayRaksha checks every QR for scam signals before you pay. SIMULATION — no real money moves.</p>
           <Link to="/scan" className="rounded-full bg-white text-gp-blue font-medium py-2.5 px-6 mt-1 text-[14px] shadow">Scan any QR code</Link>
        </div>
      </motion.div>

      {/* Console target card */}
      {link.target && (
         <motion.div {...animationProps} className="px-4 mb-6">
            <div className="card shadow-card p-4 border border-gp-line flex items-center justify-between">
               <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] text-gp-ink-3">The console is showing a demo QR</span>
                  <span className="text-[15px] font-medium text-gp-ink truncate max-w-[150px]">{link.target.label}</span>
               </div>
               <button onClick={handleTargetCheck} className="pill-tonal px-4 h-10 text-[14px] shrink-0">Check it</button>
            </div>
         </motion.div>
      )}

      {/* Action grid */}
      <motion.div {...animationProps} className="px-4 mb-8">
         <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            <Link to="/scan" className="flex flex-col items-center gap-2">
               <div className="tile w-14 h-14 bg-gp-blue-soft rounded-2xl flex items-center justify-center text-gp-blue">
                 <QrCode size={24} className="stroke-2" />
               </div>
               <span className="text-[12px] font-medium text-gp-ink-2 text-center leading-tight">Scan any<br/>QR code</span>
            </Link>
            <button onClick={() => {
                 document.getElementById('people-section')?.scrollIntoView({ behavior: 'smooth' });
            }} className="flex flex-col items-center gap-2">
               <div className="tile w-14 h-14 bg-gp-blue-soft rounded-2xl flex items-center justify-center text-gp-blue">
                 <Users size={24} className="stroke-2" />
               </div>
               <span className="text-[12px] font-medium text-gp-ink-2 text-center leading-tight">Pay<br/>contacts</span>
            </button>

            <button onClick={showDemoToast} className="flex flex-col items-center gap-2">
               <div className="tile w-14 h-14 bg-gp-blue-soft rounded-2xl flex items-center justify-center text-gp-blue">
                 <Phone size={24} className="stroke-2" />
               </div>
               <span className="text-[12px] font-medium text-gp-ink-2 text-center leading-tight">Pay phone<br/>number</span>
            </button>

            <button onClick={showDemoToast} className="flex flex-col items-center gap-2">
               <div className="tile w-14 h-14 bg-gp-blue-soft rounded-2xl flex items-center justify-center text-gp-blue">
                 <Landmark size={24} className="stroke-2" />
               </div>
               <span className="text-[12px] font-medium text-gp-ink-2 text-center leading-tight">Bank<br/>transfer</span>
            </button>

            <button onClick={showDemoToast} className="flex flex-col items-center gap-2">
               <div className="tile w-14 h-14 bg-gp-blue-soft rounded-2xl flex items-center justify-center text-gp-blue">
                 <AtSign size={24} className="stroke-2" />
               </div>
               <span className="text-[12px] font-medium text-gp-ink-2 text-center leading-tight">Pay UPI<br/>ID</span>
            </button>

            <button onClick={showDemoToast} className="flex flex-col items-center gap-2">
               <div className="tile w-14 h-14 bg-gp-blue-soft rounded-2xl flex items-center justify-center text-gp-blue">
                 <RefreshCcw size={24} className="stroke-2" />
               </div>
               <span className="text-[12px] font-medium text-gp-ink-2 text-center leading-tight">Self<br/>transfer</span>
            </button>

            <button onClick={showDemoToast} className="flex flex-col items-center gap-2">
               <div className="tile w-14 h-14 bg-gp-blue-soft rounded-2xl flex items-center justify-center text-gp-blue">
                 <FileText size={24} className="stroke-2" />
               </div>
               <span className="text-[12px] font-medium text-gp-ink-2 text-center leading-tight">Pay<br/>bills</span>
            </button>

            <button onClick={showDemoToast} className="flex flex-col items-center gap-2">
               <div className="tile w-14 h-14 bg-gp-blue-soft rounded-2xl flex items-center justify-center text-gp-blue">
                 <Smartphone size={24} className="stroke-2" />
               </div>
               <span className="text-[12px] font-medium text-gp-ink-2 text-center leading-tight">Mobile<br/>recharge</span>
            </button>
         </div>
      </motion.div>

      {/* People */}
      <motion.div {...animationProps} id="people-section" className="px-4 mb-8">
         <h2 className="section-title text-[18px] font-medium text-gp-ink mb-4">People</h2>
         <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {people.map((person, i) => {
               const init = person.name.charAt(0).toUpperCase();
               const colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
               const code = colors[i % colors.length];
               return (
                  <button key={person.vpa} onClick={() => openSheet(person.name, person.vpa, init, code)} className="flex flex-col items-center min-w-[72px] gap-2">
                     <div className={`avatar w-[48px] h-[48px] ${code} text-white rounded-full flex items-center justify-center text-xl font-medium`}>
                        {init}
                     </div>
                     <span className="text-[13px] font-medium text-gp-ink-2 text-center leading-tight line-clamp-2 max-w-[72px]">
                        {person.name.split(' ')[0]}
                     </span>
                  </button>
               );
            })}
         </div>
      </motion.div>

      {/* Businesses */}
      <motion.div {...animationProps} className="px-4 mb-8">
         <h2 className="section-title text-[18px] font-medium text-gp-ink mb-4">Businesses</h2>
         <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {businesses.map((biz, i) => {
               const init = biz.name.charAt(0).toUpperCase();
               const colors = ['bg-indigo-600', 'bg-teal-600', 'bg-rose-600', 'bg-amber-600'];
               const code = colors[i % colors.length];
               return (
                  <button key={biz.vpa} onClick={() => openSheet(biz.name, biz.vpa, init, code)} className="flex flex-col items-center min-w-[72px] gap-2">
                     <div className={`avatar w-[48px] h-[48px] ${code} text-white rounded-2xl flex items-center justify-center text-xl font-medium`}>
                        {init}
                     </div>
                     <span className="text-[13px] font-medium text-gp-ink-2 text-center leading-tight line-clamp-2 max-w-[72px]">
                        {biz.name.split(' ')[0]}
                     </span>
                  </button>
               );
            })}
         </div>
      </motion.div>

      {/* Manage your money */}
      <motion.div {...animationProps} className="px-4 mb-8">
         <div className="card bg-white rounded-3xl py-2 px-1 shadow-card flex flex-col">
            <button onClick={() => setToastMsg("Demo app — RakshaPay never connects to a bank")} className="flex items-center gap-4 py-4 px-4 w-full active:bg-gp-surface-2 rounded-2xl">
               <BankBalance size={22} className="text-gp-blue stroke-2" />
               <span className="text-[15px] font-medium text-gp-ink">Check bank balance</span>
            </button>
            <Link to="/activity" className="flex items-center gap-4 py-4 px-4 w-full active:bg-gp-surface-2 rounded-2xl">
               <History size={22} className="text-gp-blue stroke-2" />
               <span className="text-[15px] font-medium text-gp-ink">See transaction history</span>
            </Link>
            <Link to="/shield" className="flex items-center gap-4 py-4 px-4 w-full active:bg-gp-surface-2 rounded-2xl">
               <ShieldAlert size={22} className="text-gp-blue stroke-2" />
               <span className="text-[15px] font-medium text-gp-ink">PayRaksha Shield</span>
            </Link>
         </div>
      </motion.div>

      {/* Footer */}
      <div className="px-6 text-center text-[12px] text-gp-ink-3 pb-8 leading-relaxed">
         RakshaPay DEMO · SIMULATION<br/>never asks for your UPI PIN, OTP or passwords
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      <ScanFab />
      <AmountSheet
         isOpen={sheetState.isOpen}
         onClose={() => setSheetState(s => ({ ...s, isOpen: false }))}
         payeeName={sheetState.payeeName}
         vpa={sheetState.vpa}
         initial={sheetState.initial}
         avatarColor={sheetState.color}
      />
    </div>
  );
}
