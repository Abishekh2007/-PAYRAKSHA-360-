import React, { useState, useEffect } from 'react';
import { PageShell } from '../components/layout';
import { Button, Toggle, Badge } from '../components/ui';
import { controlScenarios, runScenarioLocal, scenarioToInput } from '../engine';
import { useDemoStore } from '../store/demoStore';
import { Link } from 'react-router-dom';
import { getBackendHealth } from '../services/api';
import { HudPanel, SOC_TONES, socToneForLevel, channelFor } from '../components/soc';

export default function DemoControl() {
  const store = useDemoStore();
  const [statusText, setStatusText] = useState('');
  const [backendStatus, setBackendStatus] = useState('Checking backend...');

  const checkBackend = async () => {
    setBackendStatus('Checking backend...');
    try {
      const health = await getBackendHealth();
      if (health) {
        setBackendStatus(`Python engine online · v${health.engine.version}`);
      } else {
        setBackendStatus('Backend offline: the in-browser engine is active');
      }
    } catch (e) {
      setBackendStatus('Backend offline: the in-browser engine is active');
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const handleLoad = (id: string, qrId: string | null, shortLabel: string) => {
    store.recordAnalysis({
      label: `${qrId ?? id} · ${shortLabel}`,
      input: scenarioToInput(id),
      report: runScenarioLocal(id),
      source: 'browser'
    });
    setStatusText('Loaded. Open Explanation, Scam DNA or Attack Chain to present it.');
  };

  const handleReset = () => {
    store.resetDemo();
    setStatusText('Demo state cleared.');
  };

  return (
    <PageShell title="LIVE DEMO CONTROL CENTER" eyebrow="SYSTEM" width="wide">
      <div className="flex flex-col gap-8">
        {statusText && (
          <div className="p-3 bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 rounded-sm font-mono text-sm tracking-wide" role="status">
            {statusText}
          </div>
        )}

        <HudPanel eyebrow="MISSION CONTROL" title="SCENARIOS" className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {controlScenarios().map((s) => {
               const report = runScenarioLocal(s.id);
               const tone = socToneForLevel(report.level);
               const t = SOC_TONES[tone];
               const channel = channelFor(report);

               return (
                 <div key={s.id} data-testid={s.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-cyan-400/15 bg-cyan-400/5 rounded-sm gap-4 transition-colors hover:bg-cyan-400/10">
                   <div className="flex items-center gap-4">
                     <span className="text-2xl" aria-hidden="true">{s.icon}</span>
                     <div>
                       <h3 className="hud-label text-slate-200">{s.qrId ? `${s.qrId} ` : ''}{s.title}</h3>
                       <div className="flex items-center gap-3 mt-1">
                         <span className="font-mono text-[10px] text-slate-500">{channel}</span>
                         <span className={`font-mono text-xs font-bold tracking-wider ${t.text}`}>
                           RISK {report.score}
                         </span>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     {s.qrId && (
                       <Link to={`/qr?demo=${s.qrId}`} className="font-mono text-[10px] uppercase tracking-wider text-cyan-300 border border-cyan-400/30 px-3 py-1.5 rounded-sm hover:bg-cyan-400/10 transition-colors">
                         OPEN IN QR SHIELD
                       </Link>
                     )}
                     <Button size="sm" variant="outline" onClick={() => handleLoad(s.id, s.qrId, s.shortLabel || s.title)}>LOAD AS CURRENT</Button>
                   </div>
                 </div>
               );
            })}
          </div>
        </HudPanel>

        <HudPanel eyebrow="SYSTEM" title="DEMO FLOWS">
          <div className="flex flex-wrap gap-3 mt-4">
             {['/judge', '/simulation', '/counterfactual', '/what-if', '/signals', '/trusted', '/elder', '/report', '/qr-generator', '/technical'].map(path => (
               <Link key={path} to={path} className="font-mono text-[10px] uppercase tracking-wider text-cyan-300 border border-cyan-400/30 px-3 py-1.5 rounded-sm hover:bg-cyan-400/10 transition-colors">
                 {path}
               </Link>
             ))}
          </div>
        </HudPanel>

        <HudPanel eyebrow="SETTINGS" title="TOGGLES">
          <div className="flex flex-col gap-4 mt-4">
            <Toggle checked={store.elderMode} onChange={store.setElderMode} label="Elder Safety Mode" />
            <Toggle checked={store.technicalView} onChange={store.setTechnicalView} label="Technical View" />
          </div>
        </HudPanel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <HudPanel eyebrow="TELEMETRY" title="BACKEND STATUS">
            <div className="flex items-center justify-between gap-4 mt-4 w-full">
              <span className="font-mono text-xs text-slate-400">{backendStatus}</span>
              <Button size="sm" variant="outline" onClick={checkBackend}>RE-CHECK</Button>
            </div>
          </HudPanel>

          <HudPanel eyebrow="MAINTENANCE" title="RESET DEMO">
            <div className="mt-4 flex items-center h-full">
              <Button 
                variant="outline" 
                onClick={handleReset} 
                className="text-red-400 border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
              >
                RESET DEMO
              </Button>
            </div>
          </HudPanel>
        </div>
      </div>
    </PageShell>
  );
}
