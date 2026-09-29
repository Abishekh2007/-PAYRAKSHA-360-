import React, { useState, useEffect } from 'react';
import { PageShell } from '../components/layout';
import { GlassCard, SectionHeader, Button, Toggle, Badge } from '../components/ui';
import { controlScenarios, runScenarioLocal, scenarioToInput } from '../engine';
import { useDemoStore } from '../store/demoStore';
import { Link } from 'react-router-dom';
import { getBackendHealth } from '../services/api';

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
    <PageShell title="LIVE DEMO CONTROL CENTER">
      <div className="flex flex-col gap-8">
        {statusText && (
          <div className="p-4 bg-gray-800 text-white rounded font-bold" role="status">
            {statusText}
          </div>
        )}

        <GlassCard>
          <SectionHeader title="Scenarios" />
          <div className="grid gap-4 mt-4">
            {controlScenarios().map((s) => {
               const report = runScenarioLocal(s.id);
               return (
                 <div key={s.id} data-testid={s.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-white/10 rounded gap-4">
                   <div className="flex items-center gap-4">
                     <span className="text-2xl" aria-hidden="true">{s.icon}</span>
                     <div>
                       <h3 className="font-bold">{s.qrId ? `${s.qrId} ` : ''}{s.title}</h3>
                       <Badge>{report.score}</Badge>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     {s.qrId && (
                       <Link to={`/qr?demo=${s.qrId}`} className="btn-outline px-3 py-1 rounded border border-white p-2">OPEN IN QR SHIELD</Link>
                     )}
                     <Button onClick={() => handleLoad(s.id, s.qrId, s.shortLabel || s.title)}>LOAD AS CURRENT</Button>
                   </div>
                 </div>
               );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Demo flows" />
          <div className="flex flex-wrap gap-4 mt-4">
             {['/judge', '/simulation', '/counterfactual', '/what-if', '/signals', '/trusted', '/elder', '/report', '/qr-generator', '/technical'].map(path => (
               <Link key={path} to={path} className="btn-outline px-3 py-1 rounded border border-white p-2">
                 {path}
               </Link>
             ))}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Toggles" />
          <div className="flex flex-col gap-4 mt-4">
            <Toggle checked={store.elderMode} onChange={store.setElderMode} label="Elder Safety Mode" />
            <Toggle checked={store.technicalView} onChange={store.setTechnicalView} label="Technical View" />
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Backend Status" />
          <div className="flex items-center gap-4 mt-4">
            <span>{backendStatus}</span>
            <Button onClick={checkBackend}>RE-CHECK</Button>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Reset Demo" />
          <div className="mt-4">
            <Button variant="danger" onClick={handleReset}>RESET DEMO</Button>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
