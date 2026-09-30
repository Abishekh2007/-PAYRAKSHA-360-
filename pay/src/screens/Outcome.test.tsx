import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';

import Outcome from './Outcome';
import { usePayStore } from '../store/payStore';
import type { PayRecord } from '../store/payStore';
import type { LinkDecision } from '../../../src/types/link';
import type { RiskLevelId } from '../../../src/types';

describe('Outcome Screen', () => {
  beforeEach(() => {
    usePayStore.setState({
      draft: null,
      records: [],
      link: { online: false, lastSeen: null, target: null },
    });
  });

  const renderOutcome = (decision: LinkDecision) => {
    const record: PayRecord = {
      id: 'test_rec_1',
      eventId: 'evt_1',
      at: new Date().toISOString(),
      source: 'camera',
      input: { qrText: 'test' },
      score: 50,
      level: 'CAUTION' as RiskLevelId,
      levelLabel: 'CAUTION',
      patternName: 'Test Pattern',
      recipient: 'merchant@demo',
      payeeName: 'Test Merchant',
      amount: 100,
      mode: 'demo-pay',
      decision,
      decidedAt: new Date().toISOString(),
      engine: 'browser',
    };

    usePayStore.getState().addRecord(record);

    return render(
      <MemoryRouter initialEntries={['/done/test_rec_1']}>
        <Routes>
          <Route path="/done/:recordId" element={<Outcome />} />
        </Routes>
      </MemoryRouter>
    );
  };

  const checkText = () => {
    expect(screen.getByText('SIMULATION · No money moved · No bank was contacted')).toBeInTheDocument();
  };

  it('shows generic info when cancelled', () => {
    renderOutcome('cancelled');
    expect(screen.getByText('Payment cancelled')).toBeInTheDocument();
    checkText();
  });

  it('shows generic info when verified', () => {
    renderOutcome('verify');
    expect(screen.getByText('Verify before you pay')).toBeInTheDocument();
    checkText();
  });

  it('shows generic info when trusted', () => {
    renderOutcome('trusted');
    expect(screen.getByText('Trusted contact alerted (demo)')).toBeInTheDocument();
    checkText();
  });

  it('shows generic info when paid_demo', () => {
    renderOutcome('paid_demo');
    expect(screen.getByText('Demo payment complete')).toBeInTheDocument();
    checkText();
  });

  it('shows generic info when pending', () => {
    renderOutcome('pending');
    expect(screen.getByText('Check saved')).toBeInTheDocument();
    checkText();
  });
});
