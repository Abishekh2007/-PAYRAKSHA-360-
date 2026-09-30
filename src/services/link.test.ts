import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { fetchLinkEvents, setLinkTarget, fetchLinkInfo, resetLink, useLinkFeed } from './link';

describe('link service', () => {
  it('fetch mocks — success, non-2xx → null, bad JSON → null, a never-settling fetch with timeoutMs: 20 → null', async () => {
    // success
    const fetchSuccess = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ events: [], latestSeq: 1, devices: [], target: null, simulation: true })
    });
    const res1 = await fetchLinkEvents(0, { fetchImpl: fetchSuccess });
    expect(res1?.latestSeq).toBe(1);

    // non-2xx
    const fetchNon2xx = vi.fn().mockResolvedValue({ ok: false });
    const res2 = await fetchLinkEvents(0, { fetchImpl: fetchNon2xx });
    expect(res2).toBeNull();

    // bad JSON
    const fetchBadJson = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('Bad JSON'); }
    });
    const res3 = await fetchLinkEvents(0, { fetchImpl: fetchBadJson });
    expect(res3).toBeNull();

    // never-settling fetch with timeoutMs: 20
    const fetchNeverSettles = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 50)));
    const res4 = await fetchLinkEvents(0, { fetchImpl: fetchNeverSettles, timeoutMs: 20 });
    expect(res4).toBeNull();
  });

  it('useLinkFeed: merges by id newest first, resets when latestSeq drops', async () => {
    let mockResponse: any = { events: [{ id: '1', seq: 1 }], latestSeq: 1, devices: [], target: null };
    const fetchImpl = vi.fn().mockImplementation(() => Promise.resolve({
      ok: true,
      json: async () => mockResponse
    }));

    const { result, unmount } = renderHook(() => useLinkFeed({ fetchImpl, intervalMs: 50 }));

    // Wait for the immediate poll
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.reachable).toBe(true);
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe('1');

    act(() => {
      mockResponse = { events: [{ id: '2', seq: 2 }], latestSeq: 2, devices: [], target: null };
    });

    // Wait for the interval poll
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0].id).toBe('2'); // seq desc order

    // Reset when latestSeq drops
    act(() => {
      mockResponse = { events: [{ id: '3', seq: 1 }], latestSeq: 1, devices: [], target: null };
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });

    expect(result.current.events).toHaveLength(1); // cleared and replaced
    expect(result.current.events[0].id).toBe('3');

    unmount();
  });
});
