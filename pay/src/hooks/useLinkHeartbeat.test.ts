import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLinkHeartbeat } from './useLinkHeartbeat';
import { usePayStore } from '../store/payStore';
import * as linkService from '../lib/link';
import type { LinkTarget } from '../../../src/types/link';

vi.mock('../lib/link', () => ({
  heartbeat: vi.fn(),
}));

describe('useLinkHeartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    usePayStore.setState({
      deviceName: 'Test Phone',
      link: { online: false, lastSeen: null, target: null },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls heartbeat on mount and updates store when online', async () => {
    const mockTarget: LinkTarget = { setAt: '2023-01-01T00:00:00Z', label: 'Test', qrText: 'test' };
    vi.mocked(linkService.heartbeat).mockResolvedValue({ ok: true, target: mockTarget });

    renderHook(() => useLinkHeartbeat(3000));

    expect(linkService.heartbeat).toHaveBeenCalledWith('Test Phone');
    expect(linkService.heartbeat).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      const link = usePayStore.getState().link;
      expect(link.online).toBe(true);
      expect(link.lastSeen).not.toBeNull();
      expect(link.target).toEqual(mockTarget);
    });
  });

  it('calls heartbeat on interval', async () => {
    vi.mocked(linkService.heartbeat).mockResolvedValue({ ok: true, target: null });

    renderHook(() => useLinkHeartbeat(3000));

    expect(linkService.heartbeat).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3000);
    expect(linkService.heartbeat).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(3000);
    expect(linkService.heartbeat).toHaveBeenCalledTimes(3);
  });

  it('handles offline state', async () => {
    usePayStore.setState({ link: { online: true, lastSeen: '2021-01-01T00:00:00Z', target: null } });
    vi.mocked(linkService.heartbeat).mockResolvedValue({ ok: false, target: null });

    renderHook(() => useLinkHeartbeat(3000));

    await waitFor(() => {
      const link = usePayStore.getState().link;
      expect(link.online).toBe(false);
      expect(link.lastSeen).toBe('2021-01-01T00:00:00Z');
      expect(link.target).toBeNull();
    });
  });
});
