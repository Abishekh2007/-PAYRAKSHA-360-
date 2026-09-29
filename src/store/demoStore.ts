// Demo session state. In memory only: nothing is persisted, and nothing is sent to anyone.
import { useMemo } from 'react';
import { create } from 'zustand';
import type { AnalyzeInput, EngineSource, MlInsight, RiskReport } from '../types';
import { FLAGSHIP_SCENARIO_ID, runScenarioLocal } from '../engine';

export interface AnalysisRecord {
  id: string;
  at: number;
  /** e.g. 'QR001 · Electricity bill' or 'Message analysis'. */
  label: string;
  input: AnalyzeInput;
  report: RiskReport;
  source: EngineSource;
  ml: MlInsight | null;
  latencyMs: number | null;
}
export type NewAnalysis = Omit<AnalysisRecord, 'id' | 'at' | 'ml' | 'latencyMs'> & Partial<Pick<AnalysisRecord, 'at' | 'ml' | 'latencyMs'>>;

export type TrustedAlertStatus = 'pending' | 'marked_safe' | 'advised_not_to_pay';
/** Simulated in-app alert to a trusted contact (spec §19). Never sent to a real person. */
export interface TrustedAlert { id: string; reportId: string; contactName: string; sentAt: number; status: TrustedAlertStatus; report: RiskReport }

export interface DemoState {
  current: AnalysisRecord | null;
  /** Newest first, at most 25. */
  history: AnalysisRecord[];
  elderMode: boolean;
  technicalView: boolean;
  trustedAlert: TrustedAlert | null;
  recordAnalysis: (rec: NewAnalysis) => AnalysisRecord;
  setElderMode: (on: boolean) => void;
  toggleElderMode: () => void;
  setTechnicalView: (on: boolean) => void;
  sendTrustedAlert: (report: RiskReport, contactName?: string) => TrustedAlert;
  resolveTrustedAlert: (status: Exclude<TrustedAlertStatus, 'pending'>) => void;
  resetDemo: () => void;
}

const HISTORY_LIMIT = 25;
let counter = 0;

let flagship: RiskReport | null = null;
/** The flagship demo report (QR001 electricity-bill scam), computed once. */
export function flagshipReport(): RiskReport {
  flagship ??= runScenarioLocal(FLAGSHIP_SCENARIO_ID);
  return flagship;
}

export const useDemoStore = create<DemoState>()((set) => ({
  current: null,
  history: [],
  elderMode: false,
  technicalView: false,
  trustedAlert: null,
  recordAnalysis: (rec) => {
    counter += 1;
    const full: AnalysisRecord = { ml: null, latencyMs: null, ...rec, at: rec.at ?? Date.now(), id: `${rec.report.id}-${counter}` };
    set((s) => ({ current: full, history: [full, ...s.history].slice(0, HISTORY_LIMIT) }));
    return full;
  },
  setElderMode: (on) => set({ elderMode: on }),
  toggleElderMode: () => set((s) => ({ elderMode: !s.elderMode })),
  setTechnicalView: (on) => set({ technicalView: on }),
  sendTrustedAlert: (report, contactName = 'Priya (trusted contact, demo)') => {
    counter += 1;
    const alert: TrustedAlert = { id: `TA-${counter}`, reportId: report.id, contactName, sentAt: Date.now(), status: 'pending', report };
    set({ trustedAlert: alert });
    return alert;
  },
  resolveTrustedAlert: (status) => set((s) => (s.trustedAlert ? { trustedAlert: { ...s.trustedAlert, status } } : {})),
  resetDemo: () => set({ current: null, history: [], trustedAlert: null, technicalView: false, elderMode: false }),
}));

/** The report a page should show: the latest analysis, or the flagship demo scenario if nothing was analysed yet. */
export function useCurrentReport(): { report: RiskReport; record: AnalysisRecord | null; isDefault: boolean } {
  const record = useDemoStore((s) => s.current);
  return useMemo(
    () => (record ? { report: record.report, record, isDefault: false } : { report: flagshipReport(), record: null, isDefault: true }),
    [record],
  );
}
