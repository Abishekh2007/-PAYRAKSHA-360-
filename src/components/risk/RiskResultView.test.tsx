import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/utils';
import { RiskResultView } from './RiskResultView';
import { runScenarioLocal } from '../../engine';
import { useDemoStore } from '../../store/demoStore';

describe('RiskResultView', () => {
  it('renders HIGH risk results (utility_scam)', async () => {
    const report = runScenarioLocal('utility_scam');
    renderWithRouter(<RiskResultView report={report} showPayment />);

    const result = screen.getByTestId('risk-result');
    expect(result).toHaveAttribute('data-score', '92');
    expect(result).toHaveAttribute('data-level', 'HIGH');

    expect(screen.getByText('🚨 HIGH RISK PAYMENT')).toBeInTheDocument();
    expect(screen.getByText('WHY ARE WE WARNING YOU?')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'VERIFY OFFICIALLY' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CANCEL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ASK TRUSTED CONTACT' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'VIEW FULL ANALYSIS' })).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'CANCEL' });
    await userEvent.click(cancelBtn);
    expect(screen.getByRole('status')).toHaveTextContent('Payment cancelled (simulation). No money moved.');

    const trustedBtn = screen.getByRole('button', { name: 'ASK TRUSTED CONTACT' });
    await userEvent.click(trustedBtn);
    expect(useDemoStore.getState().trustedAlert).toBeTruthy();
  });

  it('renders LOW risk results (legit_utility)', () => {
    const report = runScenarioLocal('legit_utility');
    renderWithRouter(<RiskResultView report={report} showPayment />);

    expect(screen.getByText('WHY THIS LOOKS SAFER')).toBeInTheDocument();
    expect(screen.queryByText(/DON'T PAY YET/)).not.toBeInTheDocument();

    const result = screen.getByTestId('risk-result');
    expect(result).toHaveAttribute('data-score', '12');
    expect(result).toHaveAttribute('data-level', 'LOW');

    expect(screen.getByRole('button', { name: 'CONTINUE (SIMULATION)' })).toBeInTheDocument();

    const checkIcon = screen.getAllByText(/^✓/);
    expect(checkIcon.length).toBeGreaterThan(0);
  });

  it('calls onAction when provided', async () => {
    const report = runScenarioLocal('utility_scam');
    const handleAction = vi.fn();
    renderWithRouter(<RiskResultView report={report} onAction={handleAction} />);

    const verifyBtn = screen.getByRole('button', { name: 'VERIFY OFFICIALLY' });
    await userEvent.click(verifyBtn);
    expect(handleAction).toHaveBeenCalledWith('verify');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders MlInsightCard with 72% scam-like when provided', () => {
    const report = runScenarioLocal('utility_scam');
    const ml = {
      available: true,
      model: 'test-model',
      scamProbability: 0.72,
      label: 'scam-like' as const,
      topTerms: [],
      note: ''
    };
    renderWithRouter(<RiskResultView report={report} ml={ml} />);
    expect(screen.getByText('72% scam-like')).toBeInTheDocument();
  });

  it('PaymentPreview shows correct amount and title without any upi links', () => {
    const report = runScenarioLocal('utility_scam');
    const { container } = renderWithRouter(<RiskResultView report={report} showPayment />);
    expect(screen.getByText('PAYMENT PREVIEW')).toBeInTheDocument();
    expect(screen.getByText('₹1,999')).toBeInTheDocument();
    const links = container.querySelectorAll('a[href^="upi:"]');
    expect(links.length).toBe(0);
  });
});
