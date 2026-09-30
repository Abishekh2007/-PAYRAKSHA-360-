import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../test/utils';
import Landing from './Landing';
import { runScenarioLocal } from '../engine';

describe('Landing', () => {
  it('renders verbatim content', () => {
    renderWithRouter(<Landing />);

    expect(screen.getByRole('heading', { name: 'PAYRAKSHA 360', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Think Before You Pay.')).toBeInTheDocument();
    expect(screen.getByText('An Explainable AI Pre-Payment Scam Defense System')).toBeInTheDocument();
    expect(screen.getByText("Don't detect fraud after the loss.")).toBeInTheDocument();
    expect(screen.getByText('Understand the risk before the payment.')).toBeInTheDocument();
    expect(screen.getByText(/An explainable, privacy-conscious pre-payment safety layer/)).toBeInTheDocument();

    expect(screen.getByText('Does this payment situation make sense BEFORE you pay?')).toBeInTheDocument();
    expect(screen.getByText('PAY SAFELY.')).toBeInTheDocument();
  });

  it('renders flagship card correctly', () => {
    renderWithRouter(<Landing />);

    const utilScam = runScenarioLocal('utility_scam');
    const scoreCard = screen.getByTestId('risk-score-card');

    expect(scoreCard).toHaveAttribute('data-score', String(utilScam.score));
  });

  it('renders CTA links with correct paths', () => {
    renderWithRouter(<Landing />);

    const simLink = screen.getByRole('link', { name: /TRY LIVE DEMO/i });
    expect(simLink.getAttribute('href')).toMatch(/\/simulation$/);

    const scanQrLink = screen.getByRole('link', { name: /SCAN QR/i });
    expect(scanQrLink.getAttribute('href')).toMatch(/\/qr$/);

    const exploreLink = screen.getByRole('link', { name: /EXPLORE TECHNOLOGY/i });
    expect(exploreLink.getAttribute('href')).toMatch(/\/technology$/);

    const judgeLink = screen.getByRole('link', { name: /JUDGE MODE/i });
    expect(judgeLink.getAttribute('href')).toMatch(/\/judge$/);

    expect(screen.queryByRole('button', { name: /JUDGE MODE/i })).not.toBeInTheDocument();
  });

  it('has literal 0 real payments', () => {
    renderWithRouter(<Landing />);
    expect(screen.getByText('0 real payments')).toBeInTheDocument();
  });

  it('renders live threat console feed with 6 items containing RISK 92', () => {
    renderWithRouter(<Landing />);

    const list = screen.getByRole('list', { name: 'Live threat console feed' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(6);
    expect(list.textContent).toContain('RISK 92');
  });

  it('threat level widget shows HIGH level', () => {
    renderWithRouter(<Landing />);
    const threatLevel = screen.getByTestId('threat-level');
    expect(threatLevel).toHaveAttribute('data-level', 'HIGH');
  });

  it('renders device link section elements', () => {
    renderWithRouter(<Landing />);

    expect(screen.getByRole('heading', { name: "LIVE DEVICE LINK", level: 2 })).toBeInTheDocument();

    // Test the "LINK YOUR PHONE" link -> /link
    const linkYourPhone = screen.getByRole('link', { name: /LINK YOUR PHONE/i });
    expect(linkYourPhone).toBeInTheDocument();
    expect(linkYourPhone.getAttribute('href')).toMatch(/\/link$/);
  });
});
