import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithRouter } from '../test/utils';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrustedContact from './TrustedContact';
import { useDemoStore } from '../store/demoStore';
import { runScenarioLocal } from '../engine';

describe('TrustedContact', () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it('renders default state and can send alert', async () => {
    const user = userEvent.setup();
    renderWithRouter(<TrustedContact />);

    expect(screen.getByText(/No financial credentials are shared/i)).toBeInTheDocument();

    const sendButton = screen.getByRole('button', { name: /SEND DEMO ALERT/i });
    await user.click(sendButton);

    expect(screen.getByText(/PAYRAKSHA SAFETY ALERT/i)).toBeInTheDocument();
    expect(screen.getByText(/₹15,000/i)).toBeInTheDocument();
    expect(screen.getByText(/88\/100/i)).toBeInTheDocument();
    expect(screen.getByText(/RESPONSE PROTOCOL/i)).toBeInTheDocument();

    const markSafe = screen.getByRole('button', { name: /MARK SAFE/i });
    await user.click(markSafe);

    expect(useDemoStore.getState().trustedAlert?.status).toBe('marked_safe');
    expect(screen.getByText(/marked this payment as safe\. Still verify before paying\./i)).toBeInTheDocument();
  });

  it('preserves existing report on resend', async () => {
    const user = userEvent.setup();

    act(() => {
      useDemoStore.getState().sendTrustedAlert(runScenarioLocal('utility_scam'));
    });

    renderWithRouter(<TrustedContact />);

    const markSafe = screen.getByRole('button', { name: /MARK SAFE/i });
    await user.click(markSafe);

    const sendAgainButton = screen.getByRole('button', { name: /SEND AGAIN/i });
    await user.click(sendAgainButton);

    const alert = useDemoStore.getState().trustedAlert;
    expect(alert?.report.score).toBe(92);
    expect(alert?.status).toBe('pending');
  });
});

