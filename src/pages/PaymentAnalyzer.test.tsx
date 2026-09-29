import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import PaymentAnalyzer from './PaymentAnalyzer';
import { getScenario, runScenarioLocal, analyzeLocal } from '../engine';
import type { AnalyzeInput } from '../types';

describe('PaymentAnalyzer', () => {
  it('shows error for amount <= 0', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PaymentAnalyzer />);

    const amountInput = screen.getByLabelText('Amount (₹)');
    await user.type(amountInput, '0');

    const analyzeBtn = screen.getByRole('button', { name: 'ANALYZE PAYMENT' });
    await user.click(analyzeBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount greater than 0.');
  });

  it('runs analysis for customer_care_scam preset', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PaymentAnalyzer />);

    const scenario = getScenario('customer_care_scam');
    const presetBtn = screen.getByRole('button', { name: scenario.shortLabel });
    await user.click(presetBtn);

    const analyzeBtn = screen.getByRole('button', { name: 'ANALYZE PAYMENT' });
    await user.click(analyzeBtn);

    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 8000 });
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

     const analyzeBtn = screen.getByRole('button', { name: 'ANALYZE PAYMENT' });
     await user.click(analyzeBtn);

     const resultView = await screen.findByTestId('risk-result', {}, { timeout: 8000 });
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

  it('analyzes risky and safe inputs according to spec', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PaymentAnalyzer />);

    // 1. With nothing chosen, no radio is checked
    const verifiedGroup = screen.getByRole('group', { name: 'Recipient verified' });
    const hasRequestGroup = screen.getByRole('group', { name: 'Message contains payment request' });
    const amountUnusualGroup = screen.getByRole('group', { name: 'Amount unusual' });

    expect(within(verifiedGroup).getByLabelText('YES')).not.toBeChecked();
    expect(within(verifiedGroup).getByLabelText('NO')).not.toBeChecked();
    expect(within(hasRequestGroup).getByLabelText('YES')).not.toBeChecked();
    expect(within(hasRequestGroup).getByLabelText('NO')).not.toBeChecked();
    expect(within(amountUnusualGroup).getByLabelText('YES')).not.toBeChecked();
    expect(within(amountUnusualGroup).getByLabelText('NO')).not.toBeChecked();

    // 2. Fill risky values
    const riskyInput: AnalyzeInput = {
      payment: {
        recipient:'unknown@demo', amount:1999, previousPayments:0,
        source:'whatsapp', urgency:'high',
        recipientVerified:false, hasPaymentRequest:true, amountUnusual:true
      },
      behaviour: {}
    };

    await user.type(screen.getByLabelText('Recipient ID'), 'unknown@demo');
    await user.type(screen.getByLabelText('Amount (₹)'), '1999');
    await user.type(screen.getByLabelText('Previous payments to this recipient'), '0');

    await user.selectOptions(screen.getByLabelText('Source'), 'whatsapp');
    await user.selectOptions(screen.getByLabelText('Urgency'), 'high');

    await user.click(within(verifiedGroup).getByLabelText('NO'));
    await user.click(within(hasRequestGroup).getByLabelText('YES'));
    await user.click(within(amountUnusualGroup).getByLabelText('YES'));

    const analyzeBtn = screen.getByRole('button', { name: 'ANALYZE PAYMENT' });
    await user.click(analyzeBtn);

    // 'Calculating contextual risk…' appears
    expect(screen.getByText('Calculating contextual risk…')).toBeInTheDocument();

    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 8000 });

    const riskyScore = analyzeLocal(riskyInput).score;
    // The spec says data-score equal to String(analyzeLocal(sameInput).score) (51)
    expect(resultView).toHaveAttribute('data-score', String(riskyScore));
    expect(resultView).toHaveAttribute('data-score', '51');

    expect(screen.getAllByText('CONTEXTUAL RISK').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RISK FACTORS').length).toBeGreaterThan(0);

    // RECOMMENDATION PANEL is part of RiskResultView, so text shouldn't be constrained to just this component.
    // The parent has it though.
    // wait, the assertion checks screen, so we are good.

    const riskFactorsList = screen.getByRole('list', { name: 'Risk factors' });
    expect(within(riskFactorsList).getAllByRole('listitem').length).toBeGreaterThanOrEqual(3);

    // 3. Switch to safe values and analyze again
    const safeInput: AnalyzeInput = {
      payment: {
        ...riskyInput.payment,
        source: 'official_app', urgency: 'low',
        recipientVerified: true, hasPaymentRequest: false, amountUnusual: false
      },
      behaviour: {}
    };

    await user.selectOptions(screen.getByLabelText('Source'), 'official_app');
    await user.selectOptions(screen.getByLabelText('Urgency'), 'low');
    await user.click(within(verifiedGroup).getByLabelText('YES'));
    await user.click(within(hasRequestGroup).getByLabelText('NO'));
    await user.click(within(amountUnusualGroup).getByLabelText('NO'));

    await user.click(analyzeBtn);
    const resultViewSafe = await screen.findByTestId('risk-result', {}, { timeout: 8000 });

    const safeScore = analyzeLocal(safeInput).score;
    expect(resultViewSafe).toHaveAttribute('data-score', String(safeScore));
    expect(resultViewSafe).toHaveAttribute('data-score', '21');
  });
});