import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { Button, SimulationBadge } from '../components/ui';
import { HudPanel } from '../components/soc';
import { QrCode, Download, ExternalLink } from 'lucide-react';
import {
  buildDemoQrPayload,
  generateQrSvg,
  svgToDataUrl,
  DemoQrFields,
} from '../services/qr';
import { scenarios, qrScenarios, parseQrLocal, analyzeLocal } from '../engine';

const SOURCE_OPTIONS = [
  'WhatsApp Demo',
  'SMS Demo',
  'Email Demo',
  'Website Demo',
  'Official App Demo',
];

export default function QrGenerator() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [sourceOpt, setSourceOpt] = useState(SOURCE_OPTIONS[0]);
  const [scenarioId, setScenarioId] = useState('');
  const [urgency, setUrgency] = useState(false);
  const [recipientVerified, setRecipientVerified] = useState(true);

  const [errorText, setErrorText] = useState<string | null>(null);

  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [generatedPayload, setGeneratedPayload] = useState<string | null>(null);
  const [generatedRisk, setGeneratedRisk] = useState<number | null>(null);

  const handlePresetClick = (s: any) => {
    if (!s.qrText) return;
    const parsed = parseQrLocal(s.qrText);
    const { fields } = parsed;

    const lines = s.qrText.split('\n');
    const uLine = lines.find((l: string) => l.startsWith('urgency='));
    const vLine = lines.find((l: string) => l.startsWith('recipientVerified='));
    const uVal = uLine ? uLine.split('=')[1] === 'true' : false;
    const vVal = vLine ? vLine.split('=')[1] === 'true' : false;

    setRecipient(fields.recipient || '');
    setAmount(fields.amount ? String(fields.amount) : '');
    setMerchant(fields.merchant || '');
    setNote(fields.note || '');

    if (fields.source) {
       const matched = SOURCE_OPTIONS.find(opt => opt.toLowerCase().includes(fields.source!.toLowerCase())) || fields.source;
       if (SOURCE_OPTIONS.includes(matched)) setSourceOpt(matched);
       else setSourceOpt(SOURCE_OPTIONS[0]);
    } else {
       setSourceOpt(SOURCE_OPTIONS[0]);
    }

    setScenarioId(fields.scenario || s.id);
    setUrgency(uVal);
    setRecipientVerified(vLine ? vVal : true);
    setErrorText(null);
  };

  const handleGenerate = async () => {
    setErrorText(null);
    setGeneratedSvg(null);
    setGeneratedPayload(null);
    setGeneratedRisk(null);

    const checkUpi = (val: string) => val.toLowerCase().includes('upi:');
    if (checkUpi(recipient) || checkUpi(merchant) || checkUpi(note) || checkUpi(sourceOpt)) {
      setErrorText('Real payment links are not allowed in demo QR codes.');
      return;
    }

    if (!recipient.endsWith('@demo')) {
      setErrorText('Use a demo recipient ending in @demo.');
      return;
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt < 1 || amt > 1000000) {
      setErrorText('Enter a demo amount between ₹1 and ₹10,00,000.');
      return;
    }

    const fields: DemoQrFields = {
      recipient,
      amount: amt,
      merchant,
      note,
      source: sourceOpt,
      scenario: scenarioId || undefined,
      urgency,
      recipientVerified,
    };

    const payload = buildDemoQrPayload(fields);
    const svgStr = await generateQrSvg(payload);

    const risk = analyzeLocal({ qrText: payload }).score;

    setGeneratedPayload(payload);
    setGeneratedSvg(svgStr);
    setGeneratedRisk(risk);
  };

  const handleDownload = () => {
    if (!generatedSvg) return;
    const blob = new Blob([generatedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payraksha-demo-qr.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell eyebrow="LAB" title="QR Generator" subtitle="Build demo QR codes for testing PAYRAKSHA." width="wide" icon={<QrCode className="w-8 h-8 md:w-12 md:h-12" />} actions={<SimulationBadge />}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        <div className="lg:col-span-6 flex flex-col gap-6">
          <HudPanel eyebrow="PRESETS" title="QUICK LOAD">
            <div className="flex flex-wrap gap-2">
               {qrScenarios().map((s) => (
                   <Button key={s.id} variant="outline" size="sm" onClick={() => handlePresetClick(s)}>
                     {s.qrId || s.id}
                   </Button>
               ))}
            </div>
          </HudPanel>

          <HudPanel eyebrow="DEMO QR FORGE" title="QR CONFIGURATION" bodyClassName="p-0">
            <form className="p-4 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
               <label className="flex flex-col gap-1">
                   <span className="hud-label">Recipient</span>
                   <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} className="bg-cyan-950/20 border border-cyan-800/30 rounded-sm px-3 py-2 text-cyan-50 font-mono text-sm focus:border-cyan-400/50 focus:outline-none" />
               </label>

               <label className="flex flex-col gap-1">
                   <span className="hud-label">Amount (₹)</span>
                   <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="bg-cyan-950/20 border border-cyan-800/30 rounded-sm px-3 py-2 text-cyan-50 font-mono text-sm focus:border-cyan-400/50 focus:outline-none" />
               </label>

               <label className="flex flex-col gap-1">
                   <span className="hud-label">Merchant</span>
                   <input type="text" value={merchant} onChange={e => setMerchant(e.target.value)} className="bg-cyan-950/20 border border-cyan-800/30 rounded-sm px-3 py-2 text-cyan-50 font-mono text-sm focus:border-cyan-400/50 focus:outline-none" />
               </label>

               <label className="flex flex-col gap-1">
                   <span className="hud-label">Note</span>
                   <input type="text" value={note} onChange={e => setNote(e.target.value)} className="bg-cyan-950/20 border border-cyan-800/30 rounded-sm px-3 py-2 text-cyan-50 font-mono text-sm focus:border-cyan-400/50 focus:outline-none" />
               </label>

               <label className="flex flex-col gap-1">
                   <span className="hud-label">Source</span>
                   <select value={sourceOpt} onChange={e => setSourceOpt(e.target.value)} className="bg-cyan-950/20 border border-cyan-800/30 rounded-sm px-3 py-2 text-cyan-50 font-mono text-sm focus:border-cyan-400/50 focus:outline-none">
                      {SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
               </label>

               <label className="flex flex-col gap-1">
                   <span className="hud-label">Scenario ID (optional)</span>
                   <select value={scenarioId} onChange={e => setScenarioId(e.target.value)} className="bg-cyan-950/20 border border-cyan-800/30 rounded-sm px-3 py-2 text-cyan-50 font-mono text-sm focus:border-cyan-400/50 focus:outline-none">
                      <option value="">-- None --</option>
                      {scenarios.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                   </select>
               </label>

               <label className="flex items-center gap-3 mt-2 cursor-pointer group">
                   <input type="checkbox" checked={urgency} onChange={e => setUrgency(e.target.checked)} className="peer sr-only" />
                   <div className="w-4 h-4 border border-cyan-400/30 rounded-sm peer-checked:bg-cyan-400/20 peer-focus:border-cyan-400 flex items-center justify-center">
                     {urgency && <div className="w-2 h-2 bg-cyan-400 rounded-sm" />}
                   </div>
                   <span className="hud-label group-hover:text-cyan-300 transition-colors">Urgency</span>
               </label>

               <label className="flex items-center gap-3 cursor-pointer group">
                   <input type="checkbox" checked={recipientVerified} onChange={e => setRecipientVerified(e.target.checked)} className="peer sr-only" />
                   <div className="w-4 h-4 border border-cyan-400/30 rounded-sm peer-checked:bg-cyan-400/20 peer-focus:border-cyan-400 flex items-center justify-center">
                     {recipientVerified && <div className="w-2 h-2 bg-cyan-400 rounded-sm" />}
                   </div>
                   <span className="hud-label group-hover:text-cyan-300 transition-colors">Recipient Verified</span>
               </label>

               {errorText && <div role="alert" className="text-red-400 bg-red-950/30 border border-red-900/50 p-3 rounded-sm mt-2 font-mono text-sm flex items-start gap-2">
                 <span className="mt-0.5">⚠️</span> <span>{errorText}</span>
               </div>}

               <div className="pt-2">
                 <Button type="submit" variant="primary" fullWidth>
                     GENERATE DEMO QR
                 </Button>
               </div>
            </form>
          </HudPanel>
        </div>

        <div className="lg:col-span-6">
           {generatedSvg && generatedPayload && (
               <HudPanel eyebrow="OUTPUT" title="DEMO — NOT A REAL PAYMENT QR" className="sticky top-6">
                 <div className="flex flex-col items-center gap-6">
                   <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-sm text-xs font-medium border border-slate-700 font-mono tracking-widest uppercase">
                       QR-only risk: {generatedRisk} / 100
                   </span>

                   <div className="relative p-1 border border-cyan-400/20 bg-cyan-400/5 rounded-sm">
                     <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/50" />
                     <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/50" />
                     <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/50" />
                     <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/50" />
                     <img src={svgToDataUrl(generatedSvg)} alt="Demo QR code" className="w-64 h-64 bg-white p-2 rounded-sm relative z-10" />
                   </div>

                   <div className="w-full">
                       <pre className="text-[10px] text-cyan-300/70 bg-black/40 p-4 rounded-sm overflow-auto border border-cyan-400/10 font-mono break-all whitespace-pre-wrap leading-relaxed max-h-48">
                           {generatedPayload}
                       </pre>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-4 w-full pt-2">
                       <Button variant="outline" onClick={handleDownload} icon={<Download size={16} />} fullWidth>
                           Download SVG
                       </Button>
                       <Link to="/qr" className="flex-1">
                           <Button variant="primary" icon={<ExternalLink size={16} />} fullWidth>
                               Open QR Shield
                           </Button>
                       </Link>
                   </div>
                   <p className="text-[10px] text-slate-500 text-center font-mono uppercase tracking-widest max-w-xs">
                     Scan it with the camera or upload the downloaded image.
                   </p>
                 </div>
               </HudPanel>
           )}
        </div>
      </div>
    </PageShell>
  );
}
