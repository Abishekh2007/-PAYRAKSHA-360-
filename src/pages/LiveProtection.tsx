import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBackendHealth } from '../services/api';
import { useDemoStore } from '../store/demoStore';
import { PageShell } from '../components/layout';
import { GlassCard, SimulationBadge, Badge } from '../components/ui';
import { EngineCore, GuardianRobot } from '../components/three';

export default function LiveProtection() {
  const [healthText, setHealthText] = useState('Checking engine…');
  const history = useDemoStore((s) => s.history);
  const latestReport = history[0]?.report ?? null;

  useEffect(() => {
    let mounted = true;
    getBackendHealth().then((health) => {
      if (!mounted) return;
      if (health?.status === 'ok') {
        setHealthText(`Python risk engine online (v${health.engine.version})`);
      } else {
        setHealthText('Backend offline: in-browser engine active');
      }
    }).catch(() => {
      if (!mounted) return;
      setHealthText('Backend offline: in-browser engine active');
    });
    return () => { mounted = false; };
  }, []);

  const mood = latestReport?.level === 'HIGH' || latestReport?.level === 'HIGH_CAUTION' ? 'alert'
             : latestReport?.level === 'LOW' ? 'safe'
             : 'idle';

  return (
    <PageShell eyebrow="Live Protection" title="Protection Hub" subtitle="Real-time pre-payment defense" icon={<span>🛡️</span>}>
      <SimulationBadge />

      <GlassCard className="mb-8">
        <h2 className="text-xl mb-4">PROTECTION ACTIVE · SIMULATION</h2>
        <p className="text-sm text-gray-400 mb-6">{healthText}</p>
        <div className="flex bg-slate-900 rounded-lg p-6 relative h-64 overflow-hidden">
           <div className="absolute inset-0">
             <EngineCore level={latestReport?.level ?? null} />
           </div>
           <div className="absolute inset-0 z-10 pointer-events-none">
             <GuardianRobot mood={mood} />
           </div>
        </div>
      </GlassCard>

      <section className="mb-8">
        <h3 className="text-lg font-bold mb-4">Protection layers</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { id: 'QR Shield', path: '/qr' },
            { id: 'Message Shield', path: '/message' },
            { id: 'URL Shield', path: '/url' },
            { id: 'Payment Risk', path: '/payment' },
            { id: 'Trusted Contact', path: '/trusted' },
            { id: 'Elder Mode', path: '/elder' }
          ].map(layer => (
            <GlassCard key={layer.id} className="flex flex-col items-start gap-2">
              <span className="font-semibold">{layer.id}</span>
              <Link to={layer.path} className="text-sm text-blue-400 underline">Active (demo)</Link>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-bold mb-4">Recent analyses (this session)</h3>
        {history.length === 0 ? (
          <GlassCard>
            No analyses yet. Try a demo QR.{' '}
            <Link to="/qr?demo=QR001" className="text-blue-400 underline">Try demo QR</Link>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {history.map((record, i) => (
              <GlassCard key={i} className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{record.label}</div>
                  <div className="text-xs text-gray-500">{new Date(record.at).toLocaleTimeString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge>{record.report.score}</Badge>
                  <span className="text-sm">{record.report.levelLabel}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      <Link
        to="/simulation"
        className="btn-danger w-full text-center text-lg py-4 rounded-lg block font-bold"
      >
        🚨 RUN LIVE SCAM SIMULATION
      </Link>
    </PageShell>
  );
}
