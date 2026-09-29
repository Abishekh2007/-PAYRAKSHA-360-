import type { AnalyzeInput, AnalyzeResponse, BackendHealth, UrlResponse } from '../types';
import { analyzeLocal, analyzeUrlLocal } from '../engine';

export interface ApiOptions {
  timeoutMs?: number;
  preferLocal?: boolean;
  signal?: AbortSignal;
}

const API_BASE = ((import.meta as any).env?.VITE_API_BASE ?? '').replace(/\/$/, '');
let backendDownUntil: number = 0;

export function resetApiState(): void {
  backendDownUntil = 0;
}

export function isBackendMarkedDown(): boolean {
  return now() < backendDownUntil;
}

function markBackendDown(): void {
  backendDownUntil = now() + 30000;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export async function analyzeRisk(input: AnalyzeInput, opts: ApiOptions = {}): Promise<AnalyzeResponse> {
  const t0 = now();
  if (opts.preferLocal || isBackendMarkedDown()) {
    const report = analyzeLocal(input);
    return { report, source: 'browser', latencyMs: now() - t0, ml: null };
  }

  const timeoutMs = opts.timeoutMs ?? 1500;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const abortListener = () => controller.abort();
  if (opts.signal) {
    opts.signal.addEventListener('abort', abortListener);
  }

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const body = await response.json();
    if (typeof body.score !== 'number' || typeof body.level !== 'string') {
      throw new Error('Invalid response shape');
    }

    const { ml, ...report } = body;
    return { report, source: 'python-api', latencyMs: now() - t0, ml: ml ?? null };
  } catch (err: any) {
    if (opts.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    markBackendDown();
    const report = analyzeLocal(input);
    return { report, source: 'browser', latencyMs: now() - t0, ml: null };
  } finally {
    clearTimeout(timeoutId);
    if (opts.signal) {
      opts.signal.removeEventListener('abort', abortListener);
    }
  }
}

export async function analyzeUrlRisk(url: string, opts: ApiOptions = {}): Promise<UrlResponse> {
  const t0 = now();
  if (opts.preferLocal || isBackendMarkedDown()) {
    return { analysis: analyzeUrlLocal(url), source: 'browser', latencyMs: now() - t0 };
  }

  const timeoutMs = opts.timeoutMs ?? 1500;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const abortListener = () => controller.abort();
  if (opts.signal) {
    opts.signal.addEventListener('abort', abortListener);
  }

  try {
    const response = await fetch(`${API_BASE}/api/analyze/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const body = await response.json();
    if (typeof body.valid !== 'boolean') {
      throw new Error('Invalid response shape');
    }

    return { analysis: body, source: 'python-api', latencyMs: now() - t0 };
  } catch (err: any) {
    if (opts.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    markBackendDown();
    return { analysis: analyzeUrlLocal(url), source: 'browser', latencyMs: now() - t0 };
  } finally {
    clearTimeout(timeoutId);
    if (opts.signal) {
      opts.signal.removeEventListener('abort', abortListener);
    }
  }
}

export async function getBackendHealth(opts: ApiOptions = {}): Promise<BackendHealth | null> {
  const timeoutMs = opts.timeoutMs ?? 1500;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const abortListener = () => controller.abort();
  if (opts.signal) {
    opts.signal.addEventListener('abort', abortListener);
  }

  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const body = await response.json();
    if (body.status === 'ok') {
      resetApiState();
      return body;
    }
    return null;
  } catch (err: any) {
    if (opts.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
    if (opts.signal) {
      opts.signal.removeEventListener('abort', abortListener);
    }
  }
}
