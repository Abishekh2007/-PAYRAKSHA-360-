import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { Button, ScanSteps, ErrorNotice } from '../components/ui';
import { RiskResultView } from '../components/risk';
import { HudPanel, ShieldStatus, shieldStateFor } from '../components/soc';
import { useReducedMotion } from 'framer-motion';
import {
  decodeQrFromFile,
  startCameraScan,
  CAMERA_ERROR,
  QR_READ_ERROR,
} from '../services/qr';
import { analyzeRisk } from '../services/api';
import { parseQrLocal, scenarioToInput, qrScenarios } from '../engine';
import { useDemoStore } from '../store/demoStore';
import type { RiskReport, EngineSource, MlInsight, Scenario, AnalyzeInput } from '../types';
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
  const [qrText, setQrText] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const stopCameraRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reduceMotion = useReducedMotion();

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
    setQrText(text);

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
    setQrText('');
    setErrorMsg(null);
  };

  return (
    <PageShell eyebrow="SHIELDS" title="QR SHIELD" subtitle="Optical payload scanner" width="wide">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col gap-4">
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
            <HudPanel title="DEMO QR SAMPLES" className="animate-in fade-in slide-in-from-top-4">
              <div className="flex flex-col gap-2">
                {qrScenarios().map((s) => {
                  const id = s.qrId || s.id;
                  return (
                    <Button
                      key={s.id}
                      variant="ghost"
                      className="justify-start font-mono text-xs uppercase text-slate-300 hover:text-cyan-300"
                      aria-label={`${id} · ${s.shortLabel || s.title}`}
                      onClick={() => handleDemoClick(s)}
                    >
                      <span className="w-12 shrink-0 text-cyan-500">{id}</span>
                      <span className="truncate">{s.shortLabel || s.title}</span>
                    </Button>
                  );
                })}
              </div>
            </HudPanel>
          )}

          {activeTab === 'camera' && !scanning && !report && (
            <HudPanel title="OPTICAL SCANNER · DEMO">
              <div className="hud-panel relative mx-auto aspect-square w-full max-w-sm overflow-hidden bg-black border border-cyan-400/20">
                <video ref={videoRef} playsInline muted className="absolute inset-x-0 inset-y-0 h-full w-full object-cover opacity-80" />
                <div className="pointer-events-none absolute inset-0">
                   {!reduceMotion && (
                     <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-scan" style={{ marginTop: '-1px' }} />
                   )}
                </div>
                <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center">
                    <Button variant="danger" icon={<X size={18} />} onClick={() => { stopCamera(); setActiveTab('none'); }}>
                        STOP CAMERA
                    </Button>
                </div>
              </div>
              <p className="mt-4 text-center font-mono text-[10px] tracking-wide text-cyan-300/70 uppercase">
                CAMERA / UPLOAD · DEMO — NEVER TRIGGERS A PAYMENT
              </p>
            </HudPanel>
          )}

          {!report && !scanning && activeTab === 'none' && !errorMsg && (
            <HudPanel className="opacity-50">
               <div className="flex h-32 items-center justify-center font-mono text-xs uppercase text-slate-500">
                 Awaiting Input Method
               </div>
            </HudPanel>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col gap-4">
          <ShieldStatus
            state={shieldStateFor(report?.level ?? null, scanning)}
            shield="QR SHIELD"
            score={report?.score ?? null}
            detail={report ? `Analysis complete` : (scanning ? 'Processing image payload...' : 'Ready state')}
          />

          {errorMsg && <ErrorNotice message={errorMsg} onRetry={reset} />}

          {scanning && (
            <HudPanel title="ANALYSIS SEQUENCE">
              <ScanSteps steps={SCAN_STEP_TEXTS} activeIndex={scanStepIndex} />
            </HudPanel>
          )}

          {report && !scanning && (
            <div className="flex flex-col gap-4">
              <RiskResultView
                 report={report}
                 source={source}
                 latencyMs={latencyMs}
                 ml={ml}
                 showPayment={true}
              />

              {qrText && (
                <HudPanel title="DECODED PAYLOAD (DEMO)">
                  <div className="rounded-[3px] bg-black/40 border border-cyan-400/20 p-3 font-mono text-emerald-300 text-xs break-all">
                    {qrText}
                  </div>
                </HudPanel>
              )}

              <div className="flex justify-center mt-2">
                 <Button onClick={reset} variant="outline" icon={<ScanLine size={18} />}>
                     SCAN ANOTHER QR
                 </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
