import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, MonitorCheck, MonitorOff, UserX, Receipt, Clock, Phone, ScanText, FileWarning } from 'lucide-react';
import { usePayStore } from '../store/payStore';
import { formatInr, formatShortTime } from './activityFormat';

export default function Shield() {
  const navigate = useNavigate();
  const { records, link } = usePayStore();

  const totalChecks = records.length;
  const stoppedRecords = records.filter(
    (r) => r.decision === 'cancelled' && (r.level === 'HIGH' || r.level === 'HIGH_CAUTION')
  );
  const stoppedCount = stoppedRecords.length;
  const safeSum = stoppedRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

  const levels = {
    LOW: records.filter((r) => r.level === 'LOW').length,
    CAUTION: records.filter((r) => r.level === 'CAUTION').length,
    HIGH_CAUTION: records.filter((r) => r.level === 'HIGH_CAUTION').length,
    HIGH: records.filter((r) => r.level === 'HIGH').length,
  };
  const maxLevelCount = Math.max(...Object.values(levels), 1);

  return (
    <div className="bg-gp-surface min-h-screen pb-28">
      <header className="bg-gp-bg flex items-center justify-between px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            aria-label="Back"
            className="p-2 -ml-2 rounded-full hover:bg-gp-surface-2 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gp-ink" />
          </button>
          <h1 className="text-[22px] font-medium text-gp-ink leading-tight">PayRaksha Shield</h1>
        </div>
        <div className="px-2 py-1 text-[10px] font-medium tracking-wider text-gp-ink-3 bg-gp-surface-2 rounded-full uppercase">
          Simulation
        </div>
      </header>

      <main className="p-4 space-y-6">
        <div className="card p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gp-blue-soft text-gp-blue flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-[18px] font-medium text-gp-ink">
            Your payments are checked before you pay
          </h2>

          <div className="w-full flex flex-col gap-3 mt-2">
            <div className="flex gap-3">
              <div className="flex-1 bg-gp-surface-2 rounded-2xl p-4 flex flex-col justify-center">
                <div className="text-2xl font-medium text-gp-ink">{totalChecks}</div>
                <div className="text-xs text-gp-ink-2 mt-1">Checks run</div>
              </div>
              <div className="flex-1 bg-gp-surface-2 rounded-2xl p-4 flex flex-col justify-center">
                <div className="text-2xl font-medium text-gp-ink">{stoppedCount}</div>
                <div className="text-xs text-gp-ink-2 mt-1">Risky payments stopped</div>
              </div>
            </div>
            <div className="w-full bg-gp-surface-2 rounded-2xl p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-medium text-gp-ink">{formatInr(safeSum)}</div>
              <div className="text-xs text-gp-ink-2 mt-1">Money kept safe (demo)</div>
            </div>
          </div>
          <div className="text-[10px] text-gp-ink-3 tracking-wide uppercase mt-2">
            SIMULATED HACKATHON DATA · from this phone's demo checks
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="font-medium text-gp-ink">Risk levels</h3>
          <div className="space-y-4">
            {[
              { id: 'LOW', label: 'LOW RISK', count: levels.LOW, color: 'bg-risk-low' },
              { id: 'CAUTION', label: 'CAUTION', count: levels.CAUTION, color: 'bg-risk-caution' },
              { id: 'HIGH_CAUTION', label: 'HIGH CAUTION', count: levels.HIGH_CAUTION, color: 'bg-risk-elevated' },
              { id: 'HIGH', label: 'HIGH RISK', count: levels.HIGH, color: 'bg-risk-high' },
            ].map((level) => (
              <div key={level.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gp-ink-2 font-medium">{level.label}</span>
                  <span className="text-gp-ink">{level.count}</span>
                </div>
                <div className="h-1.5 w-full bg-gp-surface-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${level.color} rounded-full`}
                    style={{ width: `${(level.count / maxLevelCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-gp-surface-2 flex items-center justify-center shrink-0">
            {link.online ? <MonitorCheck className="w-5 h-5 text-gp-blue" /> : <MonitorOff className="w-5 h-5 text-gp-ink-3" />}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gp-ink text-sm">
              {link.online ? 'Linked to the PAYRAKSHA 360 console' : 'Console offline — checks still run on this phone'}
            </h3>
            {link.online && link.lastSeen && (
              <p className="text-xs text-gp-ink-3 mt-1">
                Last seen {formatShortTime(link.lastSeen)}
              </p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-medium text-gp-ink mb-4">What PayRaksha checks</h3>
          <div className="space-y-5">
            {[
              { icon: UserX, text: 'New or unverified payees' },
              { icon: Receipt, text: 'Amounts unusual for the payee' },
              { icon: Clock, text: 'Urgency and pressure words' },
              { icon: Phone, text: 'Calls and screen-sharing while paying' },
              { icon: ScanText, text: '“Scan to receive money” tricks' },
              { icon: FileWarning, text: 'Known scam patterns (KYC, refunds, prizes, jobs, fake bills)' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <item.icon className="w-5 h-5 text-gp-blue shrink-0" />
                <div className="text-sm text-gp-ink-2 leading-tight">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="text-center px-6 py-4 text-xs text-gp-ink-3 font-medium leading-relaxed">
        PayRaksha never asks for your UPI PIN, OTP, passwords or card numbers.
      </div>
    </div>
  );
}
