// RakshaPay side of the phone ↔ console link. SIMULATION ONLY: these calls report demo risk checks, never payments.
// STUB: the pay-check task implements scanCheck and sendDecision, the pay-home task heartbeat's caller (contract final).
import type { AnalyzeInput, MlInsight, RiskReport } from '../../../src/types';
import type { LinkDecision, LinkEvent, LinkSource, LinkTarget } from '../../../src/types/link';

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
  _input: AnalyzeInput,
  _opts: LinkCallOptions & { device: string; source: LinkSource; replaces?: string },
): Promise<ScanCheckResult> {
  throw new Error('scanCheck: not implemented yet');
}

/** POST /api/link/decision {id, decision}. Resolves the updated event, or null on any failure. Never throws. */
export async function sendDecision(
  _id: string,
  _decision: Exclude<LinkDecision, 'pending'>,
  _opts: LinkCallOptions = {},
): Promise<LinkEvent | null> {
  return null;
}

/** POST /api/link/heartbeat {device}. Resolves {ok:true, target} on 2xx, {ok:false, target:null} on any failure. Never throws. */
export async function heartbeat(_device: string, _opts: LinkCallOptions = {}): Promise<{ ok: boolean; target: LinkTarget | null }> {
  return { ok: false, target: null };
}
