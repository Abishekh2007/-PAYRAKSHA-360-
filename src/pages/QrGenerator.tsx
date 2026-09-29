import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { Button, SimulationBadge } from '../components/ui';
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
    <PageShell eyebrow="Demo Settings" title="QR Generator" subtitle="Build demo QR codes for testing PAYRAKSHA." icon={<QrCode className="w-8 h-8 md:w-12 md:h-12" />}>
      <SimulationBadge />

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        <div className="lg:w-1/2 flex flex-col gap-6">
          <div className="border border-gray-700 bg-gray-900/50 p-6 rounded-xl flex flex-col gap-4">
            <h3 className="font-semibold text-lg">Presets</h3>
            <div className="flex flex-wrap gap-2">
               {qrScenarios().map((s) => (
                   <Button key={s.id} variant="outline" size="sm" onClick={() => handlePresetClick(s)}>
                     {s.qrId || s.id}
                   </Button>
               ))}
            </div>
          </div>

          <form className="border border-gray-700 bg-gray-900/50 p-6 rounded-xl flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
             <h3 className="font-semibold text-lg">QR Configuration</h3>

             <label className="flex flex-col gap-1">
                 <span className="text-sm font-medium">Recipient</span>
                 <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" />
             </label>

             <label className="flex flex-col gap-1">
                 <span className="text-sm font-medium">Amount (₹)</span>
                 <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" />
             </label>

             <label className="flex flex-col gap-1">
                 <span className="text-sm font-medium">Merchant</span>
                 <input type="text" value={merchant} onChange={e => setMerchant(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" />
             </label>

             <label className="flex flex-col gap-1">
                 <span className="text-sm font-medium">Note</span>
                 <input type="text" value={note} onChange={e => setNote(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" />
             </label>

             <label className="flex flex-col gap-1">
                 <span className="text-sm font-medium">Source</span>
                 <select value={sourceOpt} onChange={e => setSourceOpt(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                    {SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </select>
             </label>

             <label className="flex flex-col gap-1">
                 <span className="text-sm font-medium">Scenario ID (optional)</span>
                 <select value={scenarioId} onChange={e => setScenarioId(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white">
                    <option value="">-- None --</option>
                    {scenarios.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                 </select>
             </label>

             <label className="flex items-center gap-2 mt-2">
                 <input type="checkbox" checked={urgency} onChange={e => setUrgency(e.target.checked)} className="w-4 h-4" />
                 <span className="text-sm font-medium">Urgency</span>
             </label>

             <label className="flex items-center gap-2">
                 <input type="checkbox" checked={recipientVerified} onChange={e => setRecipientVerified(e.target.checked)} className="w-4 h-4" />
                 <span className="text-sm font-medium">Recipient Verified</span>
             </label>

             {errorText && <div role="alert" className="text-red-400 bg-red-950/30 border border-red-900 p-3 rounded mt-2">{errorText}</div>}

             <Button type="submit" variant="primary" className="mt-4">
                 GENERATE DEMO QR
             </Button>
          </form>
        </div>

        <div className="lg:w-1/2">
           {generatedSvg && generatedPayload && (
               <div className="border border-brand-700 bg-brand-950/20 p-6 rounded-xl flex flex-col items-center gap-6">
                   <span className="bg-gray-800 text-gray-200 px-3 py-1 rounded-full text-xs font-medium border border-gray-700 font-mono">
                       QR-only risk: {generatedRisk} / 100
                   </span>

                   <p className="font-bold text-red-500 uppercase tracking-widest text-sm">DEMO QR — NOT A PAYMENT QR</p>

                   <img src={svgToDataUrl(generatedSvg)} alt="Demo QR code" className="w-64 h-64 bg-white p-2 rounded-lg" />

                   <div className="w-full">
                       <pre className="text-xs text-gray-400 bg-gray-900 p-4 rounded overflow-auto border border-gray-700 font-mono">
                           {generatedPayload}
                       </pre>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-4 w-full">
                       <Button variant="outline" onClick={handleDownload} icon={<Download size={18} />} fullWidth>
                           Download SVG
                       </Button>
                       <Link to="/qr" className="flex-1">
                           <Button variant="primary" icon={<ExternalLink size={18} />} fullWidth>
                               Open QR Shield
                           </Button>
                       </Link>
                   </div>
                   <p className="text-xs text-gray-400 text-center">Scan it with the camera or upload the downloaded image.</p>
               </div>
           )}
        </div>
      </div>
    </PageShell>
  );
}