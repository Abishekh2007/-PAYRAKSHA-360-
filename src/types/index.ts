// App-wide types. Engine types live beside the engine (shared/reference/engine.d.mts) and are re-exported here.
export type * from '../../shared/reference/engine.mjs';
import type { RiskLevelId, RiskReport, UrlAnalysis } from '../../shared/reference/engine.mjs';

/** Which engine produced a result: the FastAPI backend, or the in-browser engine (offline fallback). */
export type EngineSource = 'python-api' | 'browser';

/** Optional ML second opinion from the Python backend. It never changes the explainable score. */
export interface MlInsight {
  available: boolean;
  /** e.g. 'tfidf-logreg-v1'. */
  model: string;
  /** 0..1: how closely the message text resembles the synthetic scam corpus. */
  scamProbability: number;
  label: 'scam-like' | 'benign-like';
  topTerms: { term: string; weight: number }[];
  note: string;
}

export interface AnalyzeResponse { report: RiskReport; source: EngineSource; latencyMs: number; ml: MlInsight | null }
export interface UrlResponse { analysis: UrlAnalysis; source: EngineSource; latencyMs: number }
export interface BackendHealth {
  status: 'ok';
  simulation: true;
  engine: { name: string; version: string; runtime: string };
  ml: { available: boolean; model: string | null };
}

/** Exportable incident report. Demo only, never an official cybercrime report. */
export interface IncidentReportDoc {
  /** Always 'DEMO REPORT — NOT AN OFFICIAL CYBERCRIME REPORT'. */
  title: string;
  reportId: string;
  /** ISO timestamp. */
  generatedAt: string;
  score: number;
  level: RiskLevelId;
  levelLabel: string;
  patternName: string;
  /** Display strings; 'Not identified' when unknown. */
  payment: { recipient: string; amount: string; merchant: string; source: string };
  signals: string[];
  dna: { label: string; percent: number }[];
  attackChain: string[];
  recommendation: string;
  safeActions: string[];
  disclaimer: string;
  notice: string;
}
