import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LinkToaster } from './LinkToaster';
import * as linkService from '../../services/link';
import { useDemoStore } from '../../store/demoStore';

vi.mock('../../services/link', () => ({
  useLinkFeed: vi.fn(),
}));

describe('LinkToaster', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useDemoStore.getState().resetDemo();
    vi.mocked(linkService.useLinkFeed).mockReturnValue({
      events: [],
      devices: [],
      target: null,
      reachable: false,
      latestSeq: 0
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('works per requirements', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(
      <MemoryRouter>
        <LinkToaster />
      </MemoryRouter>
    );

    // Initial feed: 1 event, reachable: true -> no toasts
    vi.mocked(linkService.useLinkFeed).mockReturnValue({
      events: [
        {
          id: 'lk_1', seq: 1, at: '2023', device: 'iPhone', source: 'camera',
          input: { qrText: 'A' }, score: 10, level: 'LOW', levelLabel: 'LOW RISK',
          patternName: 'safe', recipient: 'foo@demo', amount: 10, headline: 'OK',
          decision: 'pending', decidedAt: null, simulation: true,
        }
      ],
      devices: [],
      target: null,
      reachable: true,
      latestSeq: 1
    });

    rerender(
      <MemoryRouter>
        <LinkToaster />
      </MemoryRouter>
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    // New event: Pixel 8
    vi.mocked(linkService.useLinkFeed).mockReturnValue({
      events: [
        {
          id: 'lk_2', seq: 2, at: '2023', device: 'Pixel 8', source: 'camera',
          input: { qrText: 'X' }, score: 70, level: 'HIGH_CAUTION', levelLabel: 'HIGH CAUTION',
          patternName: 'warn', recipient: 'unknown-electricity@demo', amount: null, headline: 'Warn',
          decision: 'pending', decidedAt: null, simulation: true,
        },
        {
          id: 'lk_1', seq: 1, at: '2023', device: 'iPhone', source: 'camera',
          input: { qrText: 'A' }, score: 10, level: 'LOW', levelLabel: 'LOW RISK',
          patternName: 'safe', recipient: 'foo@demo', amount: 10, headline: 'OK',
          decision: 'pending', decidedAt: null, simulation: true,
        }
      ],
      devices: [],
      target: null,
      reachable: true,
      latestSeq: 2
    });

    rerender(
      <MemoryRouter>
        <LinkToaster />
      </MemoryRouter>
    );

    const toasts = await screen.findAllByRole('status');
    expect(toasts.length).toBeGreaterThan(0);
    expect(screen.getByText('Pixel 8 checked a payment')).toBeInTheDocument();
    expect(screen.getByText('RISK 70')).toBeInTheDocument();
    
    // Check demo store
    expect(useDemoStore.getState().current?.label).toContain('Pixel 8');
    
    // Now same id, higher seq, decision cancelled
    vi.mocked(linkService.useLinkFeed).mockReturnValue({
      events: [
        {
          id: 'lk_2', seq: 3, at: '2023', device: 'Pixel 8', source: 'camera',
          input: { qrText: 'X' }, score: 70, level: 'HIGH_CAUTION', levelLabel: 'HIGH CAUTION',
          patternName: 'warn', recipient: 'unknown-electricity@demo', amount: null, headline: 'Warn',
          decision: 'cancelled', decidedAt: 'now', simulation: true,
        },
        {
          id: 'lk_1', seq: 1, at: '2023', device: 'iPhone', source: 'camera',
          input: { qrText: 'A' }, score: 10, level: 'LOW', levelLabel: 'LOW RISK',
          patternName: 'safe', recipient: 'foo@demo', amount: 10, headline: 'OK',
          decision: 'pending', decidedAt: null, simulation: true,
        }
      ],
      devices: [],
      target: null,
      reachable: true,
      latestSeq: 3
    });
    
    const prevCounter = useDemoStore.getState().history.length;

    rerender(
      <MemoryRouter>
        <LinkToaster />
      </MemoryRouter>
    );

    expect(screen.getByText('Pixel 8 chose: Cancelled')).toBeInTheDocument();
    expect(useDemoStore.getState().history.length).toBe(prevCounter); // No new analysis recorded

    // Dismiss the original toast
    const dismissBtns = screen.getAllByLabelText('Dismiss');
    await user.click(dismissBtns[0]);
    // The specific toast shouldn't be found
  });
});
