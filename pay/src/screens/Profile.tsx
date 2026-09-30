import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { usePayStore } from '../store/payStore';

export default function Profile() {
  const navigate = useNavigate();
  const { deviceName, setDeviceName, reset } = usePayStore();
  const [nameInput, setNameInput] = useState(deviceName);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const initial = deviceName.charAt(0).toUpperCase() || 'D';

  const handleSave = () => {
    setDeviceName(nameInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
          <h1 className="text-[22px] font-medium text-gp-ink leading-tight">Profile</h1>
        </div>
        <div className="px-2 py-1 text-[10px] font-medium tracking-wider text-gp-ink-3 bg-gp-surface-2 rounded-full uppercase">
          Simulation
        </div>
      </header>

      <main className="p-4 space-y-6">
        <div className="flex flex-col items-center gap-3 mt-4 mb-2">
          <div className="avatar w-20 h-20 rounded-full bg-gp-blue text-gp-bg flex items-center justify-center text-3xl font-medium">
            {initial}
          </div>
          <h2 className="text-2xl font-medium text-gp-ink">{deviceName}</h2>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="font-medium text-gp-ink mb-1">Device name</h3>
          <div className="flex gap-3">
            <input
              type="text"
              aria-label="Device name"
              maxLength={40}
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setSaved(false); }}
              className="flex-1 bg-gp-surface-2 text-gp-ink text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gp-blue transition-shadow"
            />
            <button
              onClick={handleSave}
              disabled={nameInput.trim() === '' || nameInput.trim() === deviceName}
              className="pill pill-primary px-6 flex-shrink-0 disabled:opacity-50"
            >
              Save
            </button>
          </div>
          {saved && (
            <div role="status" className="flex items-center gap-1.5 text-xs text-risk-low-ink font-medium">
              <Check className="w-4 h-4" />
              Saved
            </div>
          )}
          <p className="text-xs text-gp-ink-3">
            The console shows this name next to your checks.
          </p>
        </div>

        <div className="card overflow-hidden">
          {confirmReset ? (
            <div className="p-5 flex flex-col items-center text-center gap-4 animate-fade-up">
              <p className="font-medium text-gp-ink">Clear all checks on this phone?</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="pill pill-primary flex-1"
                >
                  Keep
                </button>
                <button
                  onClick={() => {
                    reset();
                    setConfirmReset(false);
                  }}
                  className="pill pill-danger flex-1 bg-risk-high text-gp-bg"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full p-5 text-left text-[15px] font-medium text-risk-high hover:bg-gp-surface-2 transition-colors"
            >
              Reset demo data
            </button>
          )}
        </div>

        <div className="card p-5">
          <p className="text-xs text-gp-ink-2 leading-relaxed">
            <span className="font-medium text-gp-ink">RakshaPay DEMO</span> — a hackathon prototype for PAYRAKSHA 360.
            It never moves money, never connects to a bank and never asks for your UPI PIN, OTP, passwords or card numbers.
          </p>
        </div>
      </main>
    </div>
  );
}
