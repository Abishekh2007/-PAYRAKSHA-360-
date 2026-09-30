// Console side of the phone link. STUB: the console-link task implements it (contract below is final).
import type { LinkDevice, LinkEvent, LinkEventsResponse, LinkInfo, LinkTarget } from '../types/link';

export interface LinkRequestOptions { fetchImpl?: typeof fetch; timeoutMs?: number }

/** GET /api/link/events?after=<after>. Resolves null when the backend is unreachable or answers non-2xx. Never throws. */
export async function fetchLinkEvents(_after = 0, _opts: LinkRequestOptions = {}): Promise<LinkEventsResponse | null> {
  return null;
}

/** POST /api/link/target {qrText, label}. Resolves the stored target, or null on any failure. Never throws. */
export async function setLinkTarget(_qrText: string, _label: string, _opts: LinkRequestOptions = {}): Promise<LinkTarget | null> {
  return null;
}

/** GET /api/link/info. Resolves null on any failure. Never throws. */
export async function fetchLinkInfo(_opts: LinkRequestOptions = {}): Promise<LinkInfo | null> {
  return null;
}

/** POST /api/link/reset. Resolves true on 2xx. Never throws. */
export async function resetLink(_opts: LinkRequestOptions = {}): Promise<boolean> {
  return false;
}

export interface LinkFeedState {
  /** Newest first (highest seq first), at most 50, one entry per event id (latest version). */
  events: LinkEvent[];
  devices: LinkDevice[];
  target: LinkTarget | null;
  /** True after the last poll succeeded. */
  reachable: boolean;
  latestSeq: number;
}

/** Polls fetchLinkEvents every `intervalMs` (default 1500) while `enabled` (default true). */
export function useLinkFeed(_opts: { intervalMs?: number; enabled?: boolean; fetchImpl?: typeof fetch } = {}): LinkFeedState {
  return { events: [], devices: [], target: null, reachable: false, latestSeq: 0 };
}
