import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import Shield from './Shield';
import { usePayStore } from '../store/payStore';
import type { PayRecord } from '../store/payStore';

const dummyRecord = (overrides: Partial<PayRecord>): PayRecord => ({
  id: Math.random().toString(),
  eventId: null,
  at: new Date().toISOString(),
  source: 'qr' as any,
  input: {} as any,
  score: 0,
  level: 'LOW',
  levelLabel: 'Low risk',
  patternName: 'safe',
  recipient: 'test@demo',
  payeeName: 'Test merchant',
  amount: 1000,
  mode: 'demo-pay',
  decision: 'pending',
  decidedAt: null,
  engine: 'browser',
  ...overrides,
});

describe('Shield Screen', () => {
  beforeEach(() => {
    usePayStore.setState({
      draft: null,
      records: [],
      link: { online: false, lastSeen: null, target: null },
    });
  });

  const renderScreen = () =>
    render(
      <MemoryRouter initialEntries={['/shield']}>
        <Routes>
          <Route path="/shield" element={<Shield />} />
        </Routes>
      </MemoryRouter>
    );

  it('calculates stats correctly', () => {
    const r1 = dummyRecord({ level: 'HIGH', decision: 'cancelled', amount: 1999 });
    const r2 = dummyRecord({ level: 'HIGH_CAUTION', decision: 'cancelled', amount: 500 });
    const r3 = dummyRecord({ level: 'LOW', decision: 'paid_demo', amount: 1000 }); // Not stopped

    usePayStore.setState({ records: [r1, r2, r3] });
    renderScreen();

    // "Checks run" = 3
    expect(screen.getByText('3')).toBeInTheDocument();
    // "Risky payments stopped" = 2
    expect(screen.getByText('2')).toBeInTheDocument();
    // "Money kept safe (demo)" = 1999 + 500 = 2499 -> formatInr -> ₹2,499
    expect(screen.getByText('₹2,499')).toBeInTheDocument();
  });
});
