import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import PaymentAnalyzer from './PaymentAnalyzer';
import { getScenario, runScenarioLocal } from '../engine';

describe('PaymentAnalyzer', () => {
  it('shows error for amount <= 0', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PaymentAnalyzer />);

    const amountInput = screen.getByLabelText('Amount (₹)');
    await user.type(amountInput, '0');

    const analyzeBtn = screen.getByRole('button', { name: 'ANALYZE PAYMENT RISK' });
    await user.click(analyzeBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount greater than 0.');
  });

  it('runs analysis for customer_care_scam preset', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PaymentAnalyzer />);

    const scenario = getScenario('customer_care_scam');
    const presetBtn = screen.getByRole('button', { name: scenario.shortLabel });
    await user.click(presetBtn);

    const analyzeBtn = screen.getByRole('button', { name: 'ANALYZE PAYMENT RISK' });
    await user.click(analyzeBtn);

    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    const expectedScore = runScenarioLocal('customer_care_scam').score;
    // Expected to be 88 as per docs
    expect(resultView).toHaveAttribute('data-score', String(expectedScore));
  });

  it('runs analysis for legit_utility preset', async () => {
     const user = userEvent.setup();
     renderWithRouter(<PaymentAnalyzer />);

     const scenario = getScenario('legit_utility');
     const presetBtn = screen.getByRole('button', { name: scenario.shortLabel });
     await user.click(presetBtn);

     const analyzeBtn = screen.getByRole('button', { name: 'ANALYZE PAYMENT RISK' });
     await user.click(analyzeBtn);

     const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
     const expectedScore = runScenarioLocal('legit_utility').score;
     // Expected to be 12 as per docs
     expect(resultView).toHaveAttribute('data-score', String(expectedScore));
  });

  it('contains no inputs matching sensitive patterns', () => {
    renderWithRouter(<PaymentAnalyzer />);
    const inputs = screen.getAllByRole('textbox').concat(screen.getAllByRole('spinbutton'));

    inputs.forEach(input => {
      const name = input.getAttribute('name') || '';
      const ariaLabel = input.getAttribute('aria-label') || '';
      const id = input.getAttribute('id') || '';

      const regex = /pin|otp|password|cvv|card/i;
      expect(name).not.toMatch(regex);
      expect(ariaLabel).not.toMatch(regex);
      expect(id).not.toMatch(regex);
    });
  });
});
