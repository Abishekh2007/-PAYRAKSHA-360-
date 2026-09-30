import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithRouter } from '../test/utils';
import DeviceLink from './DeviceLink';
import { useLinkFeed, setLinkTarget, fetchLinkInfo } from '../services/link';
import { qrScenarios } from '../engine';

vi.mock('../services/link', async () => {
  const actual = await vi.importActual<typeof import('../services/link')>('../services/link');
  return {
    ...actual,
    useLinkFeed: vi.fn(),
    setLinkTarget: vi.fn(),
    fetchLinkInfo: vi.fn().mockResolvedValue({ phoneUrl: 'https://test.ts.net', payUrl: 'http://localhost:8091', lan: true }),
    resetLink: vi.fn().mockResolvedValue(true),
  };
});

describe('DeviceLink', () => {
  const mockEvent = {
    id: 'lk_1a2b3c4d',
    seq: 1,
    at: '2026-09-30T04:00:00Z',
    device: 'Pixel 8',
    source: 'console-target',
    input: { qrText: '...' },
    score: 70,
    level: 'HIGH_CAUTION',
    levelLabel: 'HIGH CAUTION',
    patternName: 'UTILITY IMPERSONATION + QR REDIRECTION + UNKNOWN RECIPIENT',
    recipient: 'unknown-electricity@demo',
    amount: 1999,
    headline: 'Potentially risky payment situation',
    decision: 'pending',
    decidedAt: null,
    simulation: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reachable feed', async () => {
    vi.mocked(useLinkFeed).mockReturnValue({
      events: [mockEvent as any],
      devices: [{ name: 'Pixel 8', lastSeen: 'just now', online: true }],
      reachable: true,
      latestSeq: 1,
      target: null,
    });
    
    renderWithRouter(<DeviceLink />);
    
    // Check elements
    expect(screen.getAllByText('Device Link').length).toBeGreaterThan(0);
    expect(screen.getByText('Link server online')).toBeInTheDocument();
    
    // Phone Mirror
    expect(screen.getAllByText('unknown-electricity@demo').length).toBeGreaterThan(0);
    
    // Feed
    expect(screen.getByText('Pixel 8 · console-target')).toBeInTheDocument();
    
    // Devices
    expect(screen.getAllByText('Pixel 8').length).toBeGreaterThan(0);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('calls setLinkTarget and advances carousel', async () => {
    vi.mocked(useLinkFeed).mockReturnValue({
      events: [],
      devices: [],
      reachable: true,
      latestSeq: 0,
      target: null,
    });
    const scenarios = qrScenarios();
    
    renderWithRouter(<DeviceLink />);
    
    // mount call
    expect(setLinkTarget).toHaveBeenCalledWith(scenarios[0].qrText, scenarios[0].title);
    vi.mocked(setLinkTarget).mockClear();
    
    const nextBtn = screen.getByRole('button', { name: 'Next QR' });
    fireEvent.click(nextBtn);
    
    expect(setLinkTarget).toHaveBeenCalledWith(scenarios[1].qrText, scenarios[1].title);
  });

  it('shows offline message', async () => {
    vi.mocked(useLinkFeed).mockReturnValue({
      events: [],
      devices: [],
      reachable: false,
      latestSeq: 0,
      target: null,
    });
    
    renderWithRouter(<DeviceLink />);
    expect(screen.getByText(/The link server isn't reachable/)).toBeInTheDocument();
  });
});
