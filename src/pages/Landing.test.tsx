import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../test/utils';
import Landing from './Landing';
import { runScenarioLocal } from '../engine';

vi.mock('../components/three', () => ({
  HeroScene: () => <div data-testid="hero-scene">Hero Scene Fallback</div>
}));

describe('Landing', () => {
  it('renders verbatim content', () => {
    renderWithRouter(<Landing />);
    
    expect(screen.getByText('PAYRAKSHA 360')).toBeInTheDocument();
    expect(screen.getByText('Think Before You Pay.')).toBeInTheDocument();
    expect(screen.getByText('An Explainable AI Pre-Payment Scam Defense System')).toBeInTheDocument();
    expect(screen.getByText("Don't detect fraud after the loss.")).toBeInTheDocument();
    expect(screen.getByText('Understand the risk before the payment.')).toBeInTheDocument();
    expect(screen.getByText('Pause. Understand. Pay Safely.')).toBeInTheDocument();
    
    expect(screen.getByText('Most fraud detection asks:')).toBeInTheDocument();
    expect(screen.getByText('Was this transaction fraudulent?')).toBeInTheDocument();
    expect(screen.getByText('We ask:')).toBeInTheDocument();
    expect(screen.getByText('Does this payment situation make sense BEFORE you pay?')).toBeInTheDocument();
    expect(screen.getByText('PAUSE. UNDERSTAND. VERIFY. PAY SAFELY.')).toBeInTheDocument();
  });

  it('renders flagship card correctly', () => {
    renderWithRouter(<Landing />);
    
    const utilScam = runScenarioLocal('utility_scam');
    const scoreCard = screen.getByTestId('risk-score-card');
    
    expect(scoreCard).toHaveAttribute('data-score', String(utilScam.score));
  });

  it('renders CTA links with correct paths', () => {
    renderWithRouter(<Landing />);

    const judgeLink = screen.getByRole('link', { name: /JUDGE MODE/i });
    expect(judgeLink.getAttribute('href')).toMatch(/\/judge$/);

    const scanQrLink = screen.getByRole('link', { name: /SCAN QR/i });
    expect(scanQrLink.getAttribute('href')).toMatch(/\/qr$/);

    const simLink = screen.getByRole('link', { name: /RUN LIVE SCAM SIMULATION/i });
    expect(simLink.getAttribute('href')).toMatch(/\/simulation$/);
  });

  it('has literal 0 real payments', () => {
    renderWithRouter(<Landing />);
    expect(screen.getByText('0 real payments')).toBeInTheDocument();
  });
});
