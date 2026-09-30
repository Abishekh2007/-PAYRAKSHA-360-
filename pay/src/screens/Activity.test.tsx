import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import Activity from './Activity';
import { usePayStore } from '../store/payStore';
import type { PayRecord } from '../store/payStore';

const dummyRecord = (id: string, overrides: Partial<PayRecord>): PayRecord => ({
  id,
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

describe('Activity Screen', () => {
  beforeEach(() => {
    usePayStore.setState({
      draft: null,
      records: [],
      link: { online: false, lastSeen: null, target: null },
    });
  });

  const renderScreen = () =>
    render(
      <MemoryRouter initialEntries={['/activity']}>
        <Routes>
          <Route path="/activity" element={<Activity />} />
          <Route path="/done/:id" element={<div data-testid="done-route" />} />
          <Route path="/scan" element={<div data-testid="scan-route" />} />
        </Routes>
      </MemoryRouter>
    );

  it('renders empty state', async () => {
    renderScreen();
    expect(screen.getByText('No checks yet')).toBeInTheDocument();

    // click "Scan any QR code"
    const user = userEvent.setup();
    await user.click(screen.getByText('Scan any QR code'));
    expect(screen.getByTestId('scan-route')).toBeInTheDocument();
  });

  it('renders grouped rows and navigates on click', async () => {
    const today = new Date().toISOString();

    const r1 = dummyRecord('r1', { at: today, payeeName: 'Alice', amount: 500 });
    const r2 = dummyRecord('r2', { at: today, payeeName: 'Bob', amount: 200, decision: 'cancelled' });

    usePayStore.setState({ records: [r1, r2] });
    renderScreen();

    // Group header "Today" should be present
    expect(screen.getByText('Today')).toBeInTheDocument();

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toBeInTheDocument();

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('₹200')).toBeInTheDocument(); // Though struck through

    const user = userEvent.setup();
    await user.click(screen.getByText('Alice'));

    expect(screen.getByTestId('done-route')).toBeInTheDocument();
  });
});
