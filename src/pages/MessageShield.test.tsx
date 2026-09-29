import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import MessageShield from './MessageShield';
import { getScenario, analyzeLocal } from '../engine';

describe('MessageShield', () => {
  it('shows error notice for empty input', async () => {
    const user = userEvent.setup();
    renderWithRouter(<MessageShield />);

    const analyzeBtn = screen.getByRole('button', { name: 'ANALYZE MESSAGE' });
    await user.click(analyzeBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a message for analysis.');
  });

  it('runs analysis for kyc_scam and displays SCAM DNA, pattern, and explanation', async () => {
    const user = userEvent.setup();
    renderWithRouter(<MessageShield />);

    const scenario = getScenario('kyc_scam');
    const sampleBtn = screen.getByRole('button', { name: scenario.shortLabel });

    await user.click(sampleBtn);

    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    const expectedScore = analyzeLocal({ message: scenario.message }).score;
    expect(resultView).toHaveAttribute('data-score', String(expectedScore));

    const scamDnaList = screen.getByRole('list', { name: 'Scam DNA' });
    const listItems = within(scamDnaList).getAllByRole('listitem');

    expect(listItems.some((li) => li.textContent?.includes('🔴 Urgency'))).toBe(true);
    expect(listItems.some((li) => li.textContent?.includes('🔴 Threat language'))).toBe(true);
    expect(listItems.some((li) => li.textContent?.includes('🔴 Authority impersonation'))).toBe(true);
    expect(listItems.some((li) => li.textContent?.includes('🔴 Payment request'))).toBe(true);

    expect(screen.getByText('Detected pattern:')).toBeInTheDocument();
    expect(screen.getByText('KYC IMPERSONATION')).toBeInTheDocument();

    const inSimpleWords = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && (element?.textContent?.startsWith('In simple words:') ?? false);
    });
    expect(inSimpleWords).toBeInTheDocument();
  });

  it('does not include LEGITIMATE PAYMENT sample button', () => {
    renderWithRouter(<MessageShield />);

    const buttons = screen.queryAllByRole('button');
    const legitButton = buttons.find((btn) => /LEGITIMATE PAYMENT/i.test(btn.textContent || ''));
    expect(legitButton).toBeUndefined();
  });

  it('renders link to QR002 safe payment', () => {
    renderWithRouter(<MessageShield />);

    const link = screen.getByRole('link', { name: /See a safe payment \(QR002\)/ });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toContain('/qr?demo=QR002');
  });
});
