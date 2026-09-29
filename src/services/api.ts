// STUB: the services task adds the FastAPI call (POST /api/analyze, short timeout) in front of this local fallback.
// Contract: never throws for backend problems; it falls back to the in-browser engine and says so in `source`.
import type { AnalyzeInput, AnalyzeResponse, BackendHealth, UrlResponse } from '../types';
import { analyzeLocal, analyzeUrlLocal } from '../engine';

export interface ApiOptions {
  /** Backend timeout in ms before falling back. Default 1500. */
  timeoutMs?: number;
  /** Skip the backend and use the in-browser engine. */
  preferLocal?: boolean;
  signal?: AbortSignal;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Analyses a payment situation: Python API first, in-browser engine as fallback. */
export async function analyzeRisk(input: AnalyzeInput, _opts: ApiOptions = {}): Promise<AnalyzeResponse> {
  const t0 = now();
  const report = analyzeLocal(input);
  return { report, source: 'browser', latencyMs: now() - t0, ml: null };
}

/** URL-only analysis (simulated intelligence; the URL is never fetched). */
export async function analyzeUrlRisk(url: string, _opts: ApiOptions = {}): Promise<UrlResponse> {
  const t0 = now();
  return { analysis: analyzeUrlLocal(url), source: 'browser', latencyMs: now() - t0 };
}

/** GET /api/health, or null when the backend is not reachable. */
export async function getBackendHealth(_opts: ApiOptions = {}): Promise<BackendHealth | null> {
  return null;
}
