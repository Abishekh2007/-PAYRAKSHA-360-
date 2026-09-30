// Console side of the phone link. STUB: the console-link task implements it (contract below is final).
import { useState, useEffect, useRef } from 'react';
import type { LinkDevice, LinkEvent, LinkEventsResponse, LinkInfo, LinkTarget } from '../types/link';

export interface LinkRequestOptions { fetchImpl?: typeof fetch; timeoutMs?: number }

const API_BASE = ((import.meta as any).env?.VITE_API_BASE ?? '').replace(/\/$/, '');

async function fetchWithTimeout(url: string, options: RequestInit, fetchImpl: typeof fetch, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    return null;
  }
}

/** GET /api/link/events?after=<after>. Resolves null when the backend is unreachable or answers non-2xx. Never throws. */
export async function fetchLinkEvents(after = 0, opts: LinkRequestOptions = {}): Promise<LinkEventsResponse | null> {
  const _fetch = opts.fetchImpl ?? fetch;
  const timeout = opts.timeoutMs ?? 2500;

  const res = await fetchWithTimeout(`${API_BASE}/api/link/events?after=${after}`, {}, _fetch, timeout);
  if (!res || !res.ok) return null;

  try {
    const data = await res.json();
    if (data && Array.isArray(data.events) && typeof data.latestSeq === 'number') {
      return data as LinkEventsResponse;
    }
    return null;
  } catch {
    return null;
  }
}

/** POST /api/link/target {qrText, label}. Resolves the stored target, or null on any failure. Never throws. */
export async function setLinkTarget(qrText: string, label: string, opts: LinkRequestOptions = {}): Promise<LinkTarget | null> {
  const _fetch = opts.fetchImpl ?? fetch;
  const timeout = opts.timeoutMs ?? 2500;

  const res = await fetchWithTimeout(`${API_BASE}/api/link/target`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrText, label })
  }, _fetch, timeout);

  if (!res || !res.ok) return null;

  try {
    const data = await res.json();
    return (data && data.qrText) ? data : null;
  } catch {
    return null;
  }
}

/** GET /api/link/info. Resolves null on any failure. Never throws. */
export async function fetchLinkInfo(opts: LinkRequestOptions = {}): Promise<LinkInfo | null> {
  const _fetch = opts.fetchImpl ?? fetch;
  const timeout = opts.timeoutMs ?? 2500;

  const res = await fetchWithTimeout(`${API_BASE}/api/link/info`, {}, _fetch, timeout);
  if (!res || !res.ok) return null;

  try {
    const data = await res.json();
    return data && typeof data === 'object' && ('simulation' in data) ? data : null;
  } catch {
    return null;
  }
}

/** POST /api/link/reset. Resolves true on 2xx. Never throws. */
export async function resetLink(opts: LinkRequestOptions = {}): Promise<boolean> {
  const _fetch = opts.fetchImpl ?? fetch;
  const timeout = opts.timeoutMs ?? 2500;

  const res = await fetchWithTimeout(`${API_BASE}/api/link/reset`, { method: 'POST' }, _fetch, timeout);
  return res ? res.ok : false;
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
export function useLinkFeed(opts: { intervalMs?: number; enabled?: boolean; fetchImpl?: typeof fetch } = {}): LinkFeedState {
  const { intervalMs = 1500, enabled = true, fetchImpl } = opts;

  const [state, setState] = useState<LinkFeedState>({
    events: [],
    devices: [],
    target: null,
    reachable: false,
    latestSeq: 0
  });

  const latestSeqRef = useRef<number>(0);
  const fetchingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    async function poll() {
      if (!mounted) return;
      if (fetchingRef.current) return;

      fetchingRef.current = true;
      try {
        const response = await fetchLinkEvents(latestSeqRef.current, { fetchImpl });

        if (!mounted) return;

        if (!response) {
          setState((prev) => prev.reachable ? { ...prev, reachable: false } : prev);
        } else {
          setState((prev) => {
            let nextEvents = [...prev.events];

            if (response.latestSeq < latestSeqRef.current) {
              // Reset if seq drops
              nextEvents = [];
            }

            latestSeqRef.current = response.latestSeq;

            // Merge events by id, keep higher seq (response events will have higher seq, or we overwrite)
            const map = new Map<string, LinkEvent>();
            for (const ev of nextEvents) {
              map.set(ev.id, ev);
            }
            for (const ev of response.events) {
              const existing = map.get(ev.id);
              if (!existing || ev.seq > existing.seq) {
                map.set(ev.id, ev);
              }
            }

            const merged = Array.from(map.values())
              .sort((a, b) => b.seq - a.seq)
              .slice(0, 50);

            return {
              events: merged,
              devices: response.devices,
              target: response.target,
              reachable: true,
              latestSeq: response.latestSeq
            };
          });
        }
      } finally {
        fetchingRef.current = false;
      }
    }

    // poll immediately
    poll();

    // poll loop
    const id = setInterval(poll, intervalMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [intervalMs, enabled, fetchImpl]);

  return state;
}
