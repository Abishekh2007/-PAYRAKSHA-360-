import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePayStore } from '../store/payStore';
import { decisionLabels, levelToneClassMap, formatInr, formatDayHeader } from './activityFormat';

export default function Activity() {
  const navigate = useNavigate();
  const records = usePayStore((s) => s.records);

  const grouped: Record<string, typeof records> = {};
  for (const record of records) {
    const day = formatDayHeader(record.at);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(record);
  }

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
          <h1 className="text-[22px] font-medium text-gp-ink leading-tight">Transaction history</h1>
        </div>
        <div className="px-2 py-1 text-[10px] font-medium tracking-wider text-gp-ink-3 bg-gp-surface-2 rounded-full uppercase">
          Simulation
        </div>
      </header>

      <main className="p-4 space-y-6">
        {records.length === 0 ? (
          <div className="card p-6 flex flex-col items-center text-center gap-4">
            <h2 className="text-[18px] font-medium text-gp-ink">No checks yet</h2>
            <p className="text-gp-ink-2 text-sm leading-relaxed">
              Scan a QR code and PayRaksha will check it first.
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="pill pill-primary mt-2 flex items-center justify-center w-full max-w-[200px]"
            >
              Scan any QR code
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayRecords]) => (
            <div key={day} className="space-y-3">
              <h2 className="text-sm font-medium text-gp-ink-2 px-2">{day}</h2>
              <div className="card divide-y divide-gp-line/30 overflow-hidden">
                {dayRecords.map((record) => {
                  const title = record.payeeName ?? record.recipient ?? 'Unknown payee';
                  const isCancelled = record.decision === 'cancelled';
                  const secondLine = `${decisionLabels[record.decision] ?? record.decision} · ${record.levelLabel}`;
                  const initial = title.charAt(0).toUpperCase() || '?';

                  return (
                    <button
                      key={record.id}
                      onClick={() => navigate(`/done/${record.id}`)}
                      className="w-full flex items-center p-4 gap-4 hover:bg-gp-surface-2 transition-colors text-left"
                    >
                      <div className="avatar w-11 h-11 rounded-full bg-gp-blue text-gp-bg flex items-center justify-center text-lg font-medium shrink-0">
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-medium text-gp-ink truncate">{title}</div>
                        <div className="text-xs text-gp-ink-3 truncate mt-0.5">{secondLine}</div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-3">
                        <div className={`text-[15px] font-medium ${isCancelled ? 'line-through text-gp-ink-3' : 'text-gp-ink'}`}>
                          {record.amount ? formatInr(record.amount) : '—'}
                        </div>
                        <div className={`mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${levelToneClassMap[record.level] || 'bg-gp-surface-2 text-gp-ink-2'}`}>
                          RISK {record.score}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      <div className="text-center px-4 py-6 text-xs text-gp-ink-3 font-medium">
        SIMULATION · no real payments were made
      </div>
    </div>
  );
}
