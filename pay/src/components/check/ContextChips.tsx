import React from 'react';

export interface ContextState {
  onCall: boolean;
  screenShare: boolean;
  scanToReceive: boolean;
}

interface ContextChipsProps {
  context: ContextState;
  onChange: (key: keyof ContextState, value: boolean) => void;
  disabled?: boolean;
}

export const ContextChips: React.FC<ContextChipsProps> = ({ context, onChange, disabled }) => {
  const chips = [
    { key: 'onCall' as const, label: "I'm on a call with them" },
    { key: 'screenShare' as const, label: "They asked me to share my screen" },
    { key: 'scanToReceive' as const, label: "They said scan to receive money" }
  ];

  return (
    <div className="mt-6">
      <h3 className="section-title mb-3">Anything else happening?</h3>
      <div className="flex flex-wrap gap-2">
        {chips.map(({ key, label }) => {
          const isActive = context[key];
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={isActive}
              onClick={() => onChange(key, !isActive)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                isActive
                  ? 'bg-gp-blue text-white border-gp-blue'
                  : 'bg-white text-gp-ink border-gp-line hover:bg-gp-surface disabled:opacity-50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
