// RakshaPay DEMO state (owned by the head). Persisted in this browser only; every record is a SIMULATION.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AnalyzeInput, RiskLevelId } from '../../../src/types';
import type { LinkDecision, LinkSource, LinkTarget } from '../../../src/types/link';
import type { PayMode } from '../lib/payView';

/** What the next Pay screen should check. Screens hand off with setDraft(...) then navigate('/pay'). */
export interface PayDraft {
  input: AnalyzeInput;
  source: LinkSource;
  /** Optional display label, e.g. the demo sample's name. */
  label?: string;
}

/** One checked payment on this phone (newest first in `records`). */
export interface PayRecord {
  /** Local id from newRecordId(); the Outcome route is /done/:recordId. */
  id: string;
  /** The console LinkEvent id, or null when the check ran offline in the browser. */
  eventId: string | null;
  /** ISO time of the check. */
  at: string;
  source: LinkSource;
  label?: string;
  input: AnalyzeInput;
  score: number;
  level: RiskLevelId;
  levelLabel: string;
  patternName: string;
  recipient: string | null;
  payeeName: string | null;
  amount: number | null;
  mode: PayMode;
  decision: LinkDecision;
  decidedAt: string | null;
  engine: 'python-api' | 'browser';
}

export interface LinkStatus {
  /** True while heartbeats reach the backend. */
  online: boolean;
  lastSeen: string | null;
  /** The demo QR the console is presenting ("Scan what the console shows"). */
  target: LinkTarget | null;
}

export const MAX_RECORDS = 50;
export const MAX_DEVICE_NAME = 40;

export function defaultDeviceName(): string {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android phone';
  return 'Demo phone';
}

export const newRecordId = (): string => `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export interface PayState {
  deviceName: string;
  draft: PayDraft | null;
  records: PayRecord[];
  link: LinkStatus;
  /** Trims, caps at 40 chars, falls back to defaultDeviceName() when empty. */
  setDeviceName: (name: string) => void;
  setDraft: (draft: PayDraft | null) => void;
  /** Prepends; keeps at most MAX_RECORDS. */
  addRecord: (record: PayRecord) => void;
  updateRecord: (id: string, patch: Partial<Omit<PayRecord, 'id'>>) => void;
  setLink: (patch: Partial<LinkStatus>) => void;
  /** Clears records and draft (keeps the device name). */
  reset: () => void;
}

const offline: LinkStatus = { online: false, lastSeen: null, target: null };

export const usePayStore = create<PayState>()(
  persist(
    (set) => ({
      deviceName: defaultDeviceName(),
      draft: null,
      records: [],
      link: offline,
      setDeviceName: (name) =>
        set({ deviceName: name.trim().slice(0, MAX_DEVICE_NAME) || defaultDeviceName() }),
      setDraft: (draft) => set({ draft }),
      addRecord: (record) => set((s) => ({ records: [record, ...s.records.filter((r) => r.id !== record.id)].slice(0, MAX_RECORDS) })),
      updateRecord: (id, patch) =>
        set((s) => ({ records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      setLink: (patch) => set((s) => ({ link: { ...s.link, ...patch } })),
      reset: () => set({ records: [], draft: null }),
    }),
    {
      name: 'rakshapay-demo',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ deviceName: s.deviceName, draft: s.draft, records: s.records }),
    },
  ),
);
