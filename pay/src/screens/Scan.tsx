import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Flashlight, Image as ImageIcon, Monitor, Sparkles } from 'lucide-react';
import { usePayStore } from '../store/payStore';
import { startCameraScan, decodeQrFromFile, QR_READ_ERROR } from '../../../src/services/qr';
import { Viewfinder } from '../components/scan/Viewfinder';
import { SampleSheet } from '../components/scan/SampleSheet';

export default function Scan() {
  const navigate = useNavigate();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLive, setCameraLive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const target = usePayStore((s) => s.link.target);

  useEffect(() => {
    if (window.isSecureContext === false || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('fallback');
      return;
    }

    if (!videoRef.current) return;

    let stopFn: (() => void) | undefined;
    let cancelled = false;
    setCameraLive(false);
    // Permission prompt ignored or no camera: don't leave the user on a black screen.
    const slow = setTimeout(() => { if (!cancelled) setCameraError('timeout'); }, 8000);
    startCameraScan(videoRef.current, (text) => {
      if (typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(60);
        } catch { /* ignore */ }
      }
      usePayStore.getState().setDraft({ input: { qrText: text }, source: 'camera' });
      navigate('/pay');
    })
      .then((res) => {
        clearTimeout(slow);
        if (cancelled) { res.stop(); return; }
        stopFn = res.stop;
        setCameraLive(true);
        setCameraError(null);
      })
      .catch(() => {
        clearTimeout(slow);
        if (!cancelled) setCameraError('denied');
      });

    return () => {
      cancelled = true;
      clearTimeout(slow);
      if (stopFn) stopFn();
    };
  }, [navigate, attempt]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadError(null);
      const text = await decodeQrFromFile(file);
      usePayStore.getState().setDraft({ input: { qrText: text }, source: 'gallery' });
      navigate('/pay');
    } catch {
      setUploadError(QR_READ_ERROR);
    }
  };

  const handOff = (input: { qrText: string }, source: any, label?: string) => {
    usePayStore.getState().setDraft({ input, source, label });
    navigate('/pay');
  };

  return (
    <main className="bg-black text-white min-h-full flex flex-col relative overflow-hidden pb-[260px]">
      <header className="flex items-center justify-between p-4 bg-black/30 absolute top-0 inset-x-0 z-20">
        <button aria-label="Close scanner" onClick={() => navigate('/')} className="p-2 text-white active:opacity-70">
          <X size={24} />
        </button>
        <h1 className="text-[22px] font-medium text-white shadow-sm">Scan any QR code</h1>
        <button disabled title="Torch not available in the demo" className="p-2 text-white opacity-50 cursor-not-allowed">
          <Flashlight size={24} />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center items-center relative z-0">
        {cameraError ? (
          <div data-testid="camera-help" className="mx-4 p-4 rounded-3xl bg-white/10 text-white text-[14px] text-center z-10">
            {cameraError === 'fallback' ? (
              <>
                <p className="font-medium mb-2">Camera needs a secure (HTTPS) page on phones.</p>
                <p className="text-white/80">
                  On the computer run <code className="bg-black/50 px-1 py-0.5 rounded text-[12px]">tailscale funnel --bg 7481</code> and open the https://….ts.net address, or use Upload from gallery, Scan what the console shows, or the demo samples below.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium mb-2">{cameraError === 'timeout' ? 'Camera is not responding' : 'Camera not available'}</p>
                <p className="text-white/80 mb-3">
                  {cameraError === 'timeout'
                    ? 'Allow camera access in the browser prompt, or this device may not have a camera.'
                    : 'Camera access was blocked or no camera was found.'}{' '}
                  You can still use Upload from gallery or the demo QR samples below.
                </p>
                <button type="button" onClick={() => { setCameraError(null); setAttempt((a) => a + 1); }}
                  className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-gp-ink">Try again</button>
              </>
            )}
          </div>
        ) : (
          <>
            <Viewfinder videoRef={videoRef} />
            {!cameraLive && (
              <p data-testid="camera-starting" className="absolute bottom-6 inset-x-0 text-center text-[13px] text-white/80 z-10">
                Starting camera… allow access if your browser asks
              </p>
            )}
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl text-gp-ink pb-6 z-20 shadow-sheet">
        {uploadError && (
          <div role="alert" className="px-4 py-3 text-risk-high text-sm text-center font-medium bg-risk-high-soft rounded-t-3xl border-b border-risk-high/10">
            {uploadError}
          </div>
        )}
        <div className="p-2 mt-2 space-y-1">
          <label className="flex items-center gap-4 p-4 active:bg-gp-surface-2 rounded-2xl cursor-pointer">
            <ImageIcon className="text-gp-blue" size={24} />
            <div className="flex-1 font-medium text-[15px]">Upload from gallery</div>
            <input type="file" accept="image/*" data-testid="gallery-input" className="sr-only" onChange={handleUpload} />
          </label>

          <button
            disabled={!target}
            onClick={() => target && handOff({ qrText: target.qrText }, 'console-target', target.label)}
            className="w-full flex items-center gap-4 p-4 active:bg-gp-surface-2 rounded-2xl disabled:opacity-50 text-left"
          >
            <Monitor className="text-gp-blue" size={24} />
            <div className="flex-1">
              <div className="font-medium text-[15px]">Scan what the console shows</div>
              {!target && <div className="text-[12px] text-gp-ink-3 mt-0.5">Open Device Link on the console to show a QR</div>}
            </div>
          </button>

          <button onClick={() => setShowSamples(true)} className="w-full flex items-center gap-4 p-4 active:bg-gp-surface-2 rounded-2xl text-left">
            <Sparkles className="text-gp-blue" size={24} />
            <div className="flex-1 font-medium text-[15px]">Demo QR samples</div>
          </button>
        </div>
        <p className="text-center text-[12px] text-gp-ink-3 pb-2 pt-3 border-t border-gp-surface-2 mx-4">
          SIMULATION · scanning never sends money
        </p>
      </div>

      <SampleSheet
        open={showSamples}
        onClose={() => setShowSamples(false)}
        onSelect={(t, l) => handOff({ qrText: t }, 'sample', l)}
      />
    </main>
  );
}
