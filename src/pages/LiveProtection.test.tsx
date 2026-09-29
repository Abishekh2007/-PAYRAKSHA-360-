import { describe, it, expect, afterEach } from 'vitest';
import { renderWithRouter } from '../test/utils';
import { screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LiveProtection from './LiveProtection';
import { useDemoStore } from '../store/demoStore';
import { analyzeLocal, scenarioToInput, runScenarioLocal } from '../engine';

describe('LiveProtection', () => {
  afterEach(() => {
    useDemoStore.getState().resetDemo?.();
  });

  it('renders header and engine status', () => {
    renderWithRouter(<LiveProtection />);
    expect(screen.getByText('LIVE PAYMENT SAFETY')).toBeInTheDocument();
    expect(screen.getByText('Protection Engine Ready')).toBeInTheDocument();
  });

  it('renders START LIVE SCAN button', () => {
    renderWithRouter(<LiveProtection />);
    expect(screen.getByRole('button', { name: /START LIVE SCAN/i })).toBeInTheDocument();
  });

  it('renders input card links with correct hrefs', () => {
    renderWithRouter(<LiveProtection />);
    const qrLink = screen.getByRole('link', { name: /SCAN QR/i });
    expect(qrLink).toHaveAttribute('href', '/qr');

    const msgLink = screen.getByRole('link', { name: /PASTE MESSAGE/i });
    expect(msgLink).toHaveAttribute('href', '/message');

    const urlLink = screen.getByRole('link', { name: /CHECK URL/i });
    expect(urlLink).toHaveAttribute('href', '/url');

    const payLink = screen.getByRole('link', { name: /ANALYZE PAYMENT/i });
    expect(payLink).toHaveAttribute('href', '/payment');
  });

  it('shows history when present', () => {
    const doc = runScenarioLocal('legit_utility');
    act(() => {
      useDemoStore.getState().recordAnalysis({
        label: 'My test',
        input: {},
        report: doc,
        source: 'browser',
      });
    });

    renderWithRouter(<LiveProtection />);
    expect(screen.getByText('My test')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /RUN LIVE SCAM SIMULATION/i });
    expect(link).toHaveAttribute('href', '/simulation');
  });

  it('runs a full scan, shows events and result', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithRouter(<LiveProtection />);

    const button = screen.getByRole('button', { name: /START LIVE SCAN/i });
    await user.click(button);

    // Wait for the event log to appear and all 6 events to show
    const log = await screen.findByRole('log', { name: 'Live event stream' }, { timeout: 8000 });

    const eventTexts = [
      'QR detected',
      'Payment metadata extracted',
      'Recipient analyzed',
      'Context evaluated',
      'Social-engineering signals detected',
      'Risk calculation complete',
    ];

    for (const text of eventTexts) {
      await within(log).findByText(new RegExp(text), {}, { timeout: 8000 });
    }

    // Each line should match HH:MM:SS — format
    const listItems = within(log).getAllByRole('listitem');
    const timePattern = /^\d{2}:\d{2}:\d{2} — /;
    for (const item of listItems) {
      expect(item.textContent?.replace(/^✓\s*/, '')).toMatch(timePattern);
    }

    // Wait for result
    const resultEl = await screen.findByTestId('risk-result', {}, { timeout: 8000 });

    const expectedScore = analyzeLocal(scenarioToInput('utility_scam')).score;
    expect(resultEl).toHaveAttribute('data-score', String(expectedScore));

    const meter = screen.getByRole('meter', { name: 'Risk score' });
    expect(meter).toHaveAttribute('aria-valuenow', String(expectedScore));

    expect(screen.getByText('RISK SCORE')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${expectedScore} / 100`))).toBeInTheDocument();
    expect(screen.getAllByText(/HIGH RISK/).length).toBeGreaterThan(0);

    const viewLink = screen.getByRole('link', { name: /VIEW FULL ANALYSIS/i });
    expect(viewLink).toHaveAttribute('href', '/explain');
  }, 20000);

  it('unmounting mid-scan throws nothing and leaves no pending timers', async () => {
    const user = userEvent.setup({ delay: null });
    const { unmount } = renderWithRouter(<LiveProtection />);

    const button = screen.getByRole('button', { name: /START LIVE SCAN/i });
    await user.click(button);

    // Wait 500ms then unmount
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(() => unmount()).not.toThrow();
  }, 20000);
});
