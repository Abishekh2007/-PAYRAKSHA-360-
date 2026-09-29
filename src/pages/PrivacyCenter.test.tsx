import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrivacyCenter from './PrivacyCenter';
import { renderWithRouter } from '../test/utils';
import { useDemoStore } from '../store/demoStore';

describe('PrivacyCenter', () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it('renders NEVER REQUEST card and credentials text', () => {
    renderWithRouter(<PrivacyCenter />);

    expect(screen.getByText('❌ UPI PIN')).toBeInTheDocument();
    expect(screen.getByText('❌ OTP')).toBeInTheDocument();
    expect(screen.getByText('❌ Password')).toBeInTheDocument();
    expect(screen.getByText('❌ CVV')).toBeInTheDocument();
    expect(screen.getByText('❌ Full card number')).toBeInTheDocument();

    expect(screen.getByText('No financial credentials are shared.')).toBeInTheDocument();
    expect(screen.getByTestId('simulation-badge')).toBeInTheDocument();
  });

  it('clears session data on button click', async () => {
    const user = userEvent.setup();
    const recordAnalysis = useDemoStore.getState().recordAnalysis;

    // Add dummy history
    recordAnalysis({
      label: 'dummy',
      input: {},
      report: { id: 'dummy' } as any,
      source: 'browser',
    });

    expect(useDemoStore.getState().history.length).toBe(1);

    renderWithRouter(<PrivacyCenter />);

    const clearBtn = screen.getByRole('button', { name: /CLEAR SESSION DATA/i });
    await user.click(clearBtn);

    expect(useDemoStore.getState().history.length).toBe(0);
    expect(screen.getByText('Session data cleared.')).toBeInTheDocument();
  });
});
