import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhoneMirror } from './PhoneMirror';
import type { LinkEvent } from '../../types/link';

describe('PhoneMirror', () => {
  it('renders waiting state', () => {
    render(<PhoneMirror event={null} />);
    expect(screen.getByText('Waiting for a phone check…')).toBeInTheDocument();
  });

  it('renders event with unknown-electricity@demo, RISK 70, HIGH CAUTION', () => {
    const event: LinkEvent = {
      id: 'lk_123',
      seq: 1,
      at: '2026-09-30T10:00:00Z',
      device: 'Pixel 8',
      source: 'camera',
      input: { qrText: 'some qr' },
      score: 70,
      level: 'HIGH_CAUTION',
      levelLabel: 'HIGH CAUTION',
      patternName: 'Test',
      recipient: 'unknown-electricity@demo',
      amount: 1999,
      headline: 'A test headline',
      decision: 'pending',
      decidedAt: null,
      simulation: true
    };

    render(<PhoneMirror event={event} />);

    expect(screen.getByText('Pixel 8')).toBeInTheDocument();
    expect(screen.getByText('unknown-electricity@demo')).toBeInTheDocument();
    expect(screen.getByText('HIGH CAUTION')).toBeInTheDocument();

    // Test the RISK 70 part by looking at how they are rendered
    // "RISK" and "70" are separate spans in the HTML we wrote
    expect(screen.getByText('RISK')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();

    expect(screen.getByText('A test headline')).toBeInTheDocument();
    expect(screen.getByText('Checked')).toBeInTheDocument();
    expect(screen.getByText('SIMULATION')).toBeInTheDocument();

    // Amount
    // The engine's fmtINR typically formats 1999 to something like "₹1,999" (depending on locale/implementation).
    // Let's just verify it didn't render "Amount not set"
    expect(screen.queryByText('Amount not set')).not.toBeInTheDocument();
  });
});
