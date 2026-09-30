// RakshaPay side of the phone ↔ console link. SIMULATION ONLY: these calls report demo risk checks, never payments.
// STUB: the pay-check task implements scanCheck and sendDecision, the pay-home task heartbeat's caller (contract final).
import type { AnalyzeInput, MlInsight, RiskReport } from '../../../src/types';
import type { LinkDecision, LinkEvent, LinkSource, LinkTarget } from '../../../src/types/link';
import { analyzeLocal } from '../../../src/engine';

export interface LinkCallOptions { fetchImpl?: typeof fetch; timeoutMs?: number }

export interface ScanCheckResult {
  report: RiskReport;
  /** The console link event, or null when the backend could not be reached (then engine is 'browser'). */
  event: LinkEvent | null;
  engine: 'python-api' | 'browser';
  ml: MlInsight | null;
}

/**
 * POST /api/link/scan {device, source, input, replaces?}. On success resolves {report, event, engine:'python-api', ml}.
 * On ANY failure (network error, timeout (default 2500 ms), non-2xx, bad JSON) resolves
 * {report: analyzeLocal(input), event: null, engine: 'browser', ml: null}. Never throws, never pays.
 */
export async function scanCheck(
  input: AnalyzeInput,
  opts: LinkCallOptions & { device: string; source: LinkSource; replaces?: string },
): Promise<ScanCheckResult> {
  const { device, source, replaces, fetchImpl = fetch, timeoutMs = 2500 } = opts;
  const fallback: ScanCheckResult = {
    report: analyzeLocal(input),
    event: null,
    engine: 'browser',
    ml: null,
  };

  const controller = new AbortController();

  try {
    const body: Record<string, unknown> = { device, source, input };
    if (replaces !== undefined) {
      body.replaces = replaces;
    }

    const fetchPromise = fetchImpl('/api/link/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error('Timeout'));
      }, timeoutMs);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      return fallback;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return fallback;
    }


    // Validate the shape: report.score must be a number
    if (
      !data ||
      typeof data !== 'object' ||
      !('report' in data) ||
      typeof (data as Record<string, unknown>).report !== 'object' ||
      typeof ((data as Record<string, unknown>).report as Record<string, unknown>).score !== 'number'
    ) {
      return fallback;
    }

    const typedData = data as { event: LinkEvent; report: RiskReport; ml: MlInsight | null; simulation: boolean };
    return {
      report: typedData.report,
      event: typedData.event,
      engine: 'python-api',
      ml: typedData.ml,
    };
  } catch {
    return fallback;
  }
}

/** POST /api/link/decision {id, decision}. Resolves the updated event, or null on any failure. Never throws. */
export async function sendDecision(
  id: string,
  decision: Exclude<LinkDecision, 'pending'>,
  opts: LinkCallOptions = {},
): Promise<LinkEvent | null> {
  const { fetchImpl = fetch } = opts;

  try {
    const response = await fetchImpl('/api/link/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, decision }),
    });

    if (!response.ok) {
      return null;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return null;
    }

    if (!data || typeof data !== 'object' || !('event' in data)) {
      return null;
    }

    return (data as { event: LinkEvent }).event ?? null;
  } catch {
    return null;
  }
}

/** POST /api/link/heartbeat {device}. Resolves {ok:true, target} on 2xx, {ok:false, target:null} on any failure. Never throws. */
export async function heartbeat(device: string, opts: LinkCallOptions = {}): Promise<{ ok: boolean; target: LinkTarget | null }> {
  const { fetchImpl = fetch } = opts;

  try {
    const response = await fetchImpl('/api/link/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device }),
    });

    if (!response.ok) {
      return { ok: false, target: null };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { ok: false, target: null };
    }

    if (!data || typeof data !== 'object') {
      return { ok: false, target: null };
    }

    const typedData = data as { ok: boolean; target: LinkTarget | null; simulation: boolean };
    return {
      ok: typedData.ok === true,
      target: typedData.target ?? null,
    };
  } catch {
    return { ok: false, target: null };
  }
}
