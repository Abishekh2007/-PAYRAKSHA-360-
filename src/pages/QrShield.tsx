import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { Button, SimulationBadge, ScanSteps, ErrorNotice } from '../components/ui';
import { RiskResultView } from '../components/risk';
import { GuardianRobot } from '../components/three';
import {
  decodeQrFromFile,
  startCameraScan,
  CAMERA_ERROR,
  QR_READ_ERROR,
} from '../services/qr';
import { analyzeRisk } from '../services/api';
import { parseQrLocal, scenarioToInput, qrScenarios } from '../engine';
import { useDemoStore } from '../store/demoStore';
import type { RiskReport, EngineSource, MlInsight, Scenario, RobotMood, AnalyzeInput } from '../types';
import { QrCode, ScanLine, Upload, X, Camera } from 'lucide-react';

const SCAN_STEP_TEXTS = [
  'QR DETECTED',
  'Extracting payment metadata...',
  'Checking recipient...',
  'Checking payment context...',
  'Running risk engine...',
];

export default function QrShield() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recordAnalysis = useDemoStore((s) => s.recordAnalysis);

  const [activeTab, setActiveTab] = useState<'none' | 'demo' | 'camera'>('none');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [scanning, setScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(-1);

  const [report, setReport] = useState<RiskReport | null>(null);
  const [source, setSource] = useState<EngineSource | undefined>(undefined);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [ml, setMl] = useState<MlInsight | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const stopCameraRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const demoId = searchParams.get('demo');
    if (demoId) {
      const allScenarios = qrScenarios();
      const s = allScenarios.find((x) => x.id === demoId || x.qrId === demoId);
      if (s) {
        handleDemoClick(s);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    return stopCamera;
  }, []);

  const stopCamera = () => {
    if (stopCameraRef.current) {
      stopCameraRef.current();
      stopCameraRef.current = null;
    }
  };

  const startCamera = async () => {
    setActiveTab('camera');
    setErrorMsg(null);
    setReport(null);
    if (!videoRef.current) return;

    try {
      const { stop } = await startCameraScan(videoRef.current, handleQrDecodedText);
      stopCameraRef.current = stop;
    } catch (err: any) {
      setErrorMsg(err.message || CAMERA_ERROR);
      setActiveTab('none');
    }
  };

  // Needed for async mounting of video tag
  useEffect(() => {
      if (activeTab === 'camera') {
          startCamera();
      }
  }, [activeTab]);

  const handleQrDecodedText = async (text: string, labelForRecord = 'Camera QR') => {
    stopCamera();
    setActiveTab('none');
    await runAnalysis(text, undefined, labelForRecord);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setReport(null);
    try {
      const text = await decodeQrFromFile(file);
      await runAnalysis(text, undefined, 'Uploaded QR');
    } catch (err: any) {
      setErrorMsg(err.message || QR_READ_ERROR);
    }
    e.target.value = ''; // reset
  };

  const handleDemoClick = (scenario: Scenario) => {
    setActiveTab('none');
    setErrorMsg(null);
    setReport(null);
    const input = scenarioToInput(scenario);
    runAnalysis(scenario.qrText || '', input, `${scenario.qrId || scenario.id} · ${scenario.shortLabel || scenario.title}`);
  };

  const runAnalysis = async (text: string, baseInput?: AnalyzeInput, labelForRecord?: string) => {
    setScanning(true);
    setScanStepIndex(0);
    setErrorMsg(null);

    let finalInput: AnalyzeInput;
    const parsed = parseQrLocal(text);

    if (parsed.error) {
      setScanning(false);
      setScanStepIndex(-1);
      setErrorMsg(QR_READ_ERROR);
      return;
    }

    if (baseInput) {
        finalInput = baseInput;
    } else {
        if (parsed.fields.scenario) {
            try {
                const s = qrScenarios().find(s => s.id === parsed.fields.scenario || s.qrId === parsed.fields.scenario);
                if (s) {
                    finalInput = { ...scenarioToInput(s), qrText: text };
                } else {
                    finalInput = { qrText: text };
                }
            } catch (e) {
                finalInput = { qrText: text };
            }
        } else {
            finalInput = { qrText: text };
        }
    }

    const stepInterval = setInterval(() => {
      setScanStepIndex((prev) => prev < SCAN_STEP_TEXTS.length ? prev + 1 : prev);
    }, 300);

    let res;
    try {
        res = await analyzeRisk(finalInput);
    } catch (e) {
        clearInterval(stepInterval);
        setScanning(false);
        setScanStepIndex(-1);
        setErrorMsg('Error running analysis');
        return;
    }

    await new Promise(r => setTimeout(r, 1500));
    clearInterval(stepInterval);
    setScanStepIndex(SCAN_STEP_TEXTS.length);

    setReport(res.report);
    setSource(res.source);
    setLatencyMs(res.latencyMs);
    setMl(res.ml);
    setScanning(false);

    recordAnalysis({
        label: labelForRecord || 'QR Analysis',
        input: finalInput,
        report: res.report,
        source: res.source,
        latencyMs: res.latencyMs,
        ml: res.ml
    });
  };

  const reset = () => {
    setReport(null);
    setScanStepIndex(-1);
    setScanning(false);
    setErrorMsg(null);
    setActiveTab('none');
  };

  let mood: RobotMood = 'idle';
  if (scanning) mood = 'thinking';
  else if (report) {
      if (report.level === 'HIGH' || report.level === 'HIGH_CAUTION') mood = 'alert';
      else if (report.level === 'LOW') mood = 'safe';
  }

  return (
    <PageShell eyebrow="Protection" title="QR Shield" subtitle="Scan payment QR codes to analyze risk before you pay." icon={<ScanLine className="w-8 h-8 md:w-12 md:h-12" />}>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 flex flex-col gap-6">
          <GuardianRobot mood={mood} className="h-64" />
          <p className="text-sm text-gray-400 font-medium">Scanning never pays. PAYRAKSHA only reads demo QR data.</p>
          <SimulationBadge />

          <div className="flex flex-col gap-3">
             <Button
                variant="primary"
                onClick={() => setActiveTab('camera')}
                icon={<Camera size={18} />}
                disabled={scanning}
             >
                 START CAMERA
             </Button>

             <Button
                variant="outline"
                onClick={handleUploadClick}
                icon={<Upload size={18} />}
                disabled={scanning}
             >
                 UPLOAD QR IMAGE
             </Button>
             <input
                type="file"
                accept="image/*"
                data-testid="qr-upload"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
             />

             <Button
                variant="outline"
                onClick={() => setActiveTab(activeTab === 'demo' ? 'none' : 'demo')}
                icon={<QrCode size={18} />}
                disabled={scanning}
             >
                 USE DEMO QR
             </Button>
          </div>

          {activeTab === 'demo' && !scanning && !report && (
              <div className="flex flex-col gap-2 mt-4 p-4 border border-gray-700 rounded-lg bg-gray-900/50">
                  <h3 className="font-semibold text-white mb-2">Select a Demo QR</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {qrScenarios().map((s) => {
                          const id = s.qrId || s.id;
                          return (
                              <Button
                                  key={s.id}
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`${id} · ${s.shortLabel || s.title}`}
                                  onClick={() => handleDemoClick(s)}
                              >
                                  {id} {s.shortLabel || s.title}
                              </Button>
                          );
                      })}
                  </div>
              </div>
          )}
        </div>

        <div className="lg:w-2/3">
           {errorMsg && <ErrorNotice message={errorMsg} onRetry={reset} className="mb-6" />}

           {activeTab === 'camera' && !scanning && !report && (
               <div className="relative rounded-xl overflow-hidden bg-black border border-gray-700 aspect-[4/3] flex flex-col items-center justify-center">
                   <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                   <div className="absolute inset-0 border-2 border-brand-500/50 m-8 rounded-lg pointer-events-none">
                       <div className="h-0.5 bg-brand-500 w-full animate-scan" style={{ top: '50%', position: 'absolute' }}></div>
                   </div>
                   <div className="absolute bottom-4 z-10">
                       <Button variant="danger" icon={<X size={18} />} onClick={() => { stopCamera(); setActiveTab('none'); }}>
                           STOP CAMERA
                       </Button>
                   </div>
               </div>
           )}

           {scanning && (
               <div className="p-6 border border-gray-700 rounded-xl bg-gray-900/50 h-full flex items-center justify-center">
                   <div className="w-full max-w-md">
                       <ScanSteps steps={SCAN_STEP_TEXTS} activeIndex={scanStepIndex} />
                   </div>
               </div>
           )}

           {report && !scanning && (
               <div className="flex flex-col gap-6">
                   <RiskResultView
                      report={report}
                      source={source}
                      latencyMs={latencyMs}
                      ml={ml}
                      showPayment={true}
                   />
                   <div className="flex justify-center mt-4">
                       <Button onClick={reset} variant="outline" icon={<ScanLine size={18} />}>
                           SCAN ANOTHER QR
                       </Button>
                   </div>
               </div>
           )}

           {!report && !scanning && activeTab === 'none' && !errorMsg && (
               <div className="h-full min-h-[300px] border border-gray-800 rounded-xl flex items-center justify-center bg-gray-900/30 text-gray-500">
                   Select a method to scan a QR code
               </div>
           )}
        </div>
      </div>
    </PageShell>
  );
}
