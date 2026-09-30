import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Pay from './Pay';
import Outcome from './Outcome';
import { usePayStore } from '../store/payStore';
import { analyzeLocal } from '../../../src/engine';

vi.mock('../lib/link', () => ({
  scanCheck: vi.fn().mockImplementation(async (input) => {
    return {
      report: analyzeLocal(input),
      event: { id: 'lk_1' },
      engine: 'python-api',
      ml: null,
    };
  }),
  sendDecision: vi.fn().mockResolvedValue(null),
}));

const UTIL_QR = `PAYRAKSHA://demo-payment
recipient=unknown-electricity@demo
amount=1999
merchant=Electricity Board Demo
source=WhatsApp Demo
urgency=true
recipientVerified=false
scenario=utility_scam`;

const LEGIT_QR = `PAYRAKSHA://demo-payment
recipient=merchant@demo
amount=450
merchant=Demo Kirana Store
source=Known Merchant Demo
scenario=legit_merchant`;

describe('Pay Screen', () => {
  beforeEach(() => {
    usePayStore.setState({
      draft: null,
      records: [],
      link: { online: false, lastSeen: null, target: null },
    });
    vi.clearAllMocks();
  });

  const renderApp = () => {
    return render(
      <MemoryRouter initialEntries={['/pay']}>
        <Routes>
          <Route path="/pay" element={<Pay />} />
          <Route path="/done/:recordId" element={<Outcome />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders UTIL_QR draft correctly', async () => {
    const user = userEvent.setup();
    usePayStore.setState({
      draft: {
        input: { qrText: UTIL_QR },
        source: 'camera',
      },
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('HIGH CAUTION')).toBeInTheDocument();
    });

    const elements = screen.queryAllByRole('textbox');
    expect(elements).toHaveLength(0); // Zero input elements

    expect(screen.getByText('Potentially risky payment situation')).toBeInTheDocument();

    const cancelBtn = screen.getByText('Cancel payment');
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText('Payment cancelled')).toBeInTheDocument();
    });
  });

  it('handles screen-share chip changing risk to HIGH RISK', async () => {
    const user = userEvent.setup();
    usePayStore.setState({
      draft: {
        input: { qrText: UTIL_QR },
        source: 'camera',
      },
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('HIGH CAUTION')).toBeInTheDocument();
    });

    const shareBtn = screen.getByRole('button', { name: "They asked me to share my screen" });
    await user.click(shareBtn);

    await waitFor(() => {
      expect(screen.getByText('HIGH RISK')).toBeInTheDocument();
    });
  });

  it('shows payment confirm sheet for legit merchant', async () => {
    const user = userEvent.setup();
    usePayStore.setState({
      draft: {
        input: { qrText: LEGIT_QR },
        source: 'camera',
      },
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pay ₹450 (demo)' })).toBeInTheDocument();
    });

    const payBtn = screen.getByRole('button', { name: 'Pay ₹450 (demo)' });
    await user.click(payBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Confirm demo payment' })).toBeInTheDocument();
    });
  });
});
