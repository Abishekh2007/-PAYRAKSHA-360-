import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import UrlShield from './UrlShield';
import { analyzeUrlLocal, getScenario } from '../engine';

describe('UrlShield', () => {
  it('renders demo URLs on first render without link elements', () => {
    renderWithRouter(<UrlShield />);

    expect(screen.getByText('https://official-demo-bank.example')).toBeInTheDocument();
    expect(screen.getByText('https://secure-bank-kyc-demo.example')).toBeInTheDocument();
    expect(screen.getByText('https://example-shopping-offer.demo')).toBeInTheDocument();

    const links = screen.queryAllByRole('link');
    links.forEach(link => {
      expect(link.getAttribute('href') ?? '').not.toContain('example');
    });
  });

  it('shows error notice for invalid url', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UrlShield />);

    const input = screen.getByLabelText('URL to analyze');
    await user.type(input, 'not a url');

    const checkBtn = screen.getByRole('button', { name: 'CHECK URL' });
    await user.click(checkBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid URL.');
  });

  it('runs analysis for KYC look-alike and shows correct results', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UrlShield />);

    const shieldStatus = screen.getByTestId('shield-status');
    expect(shieldStatus).toHaveAttribute('data-state', 'idle');

    const kycBtn = screen.getByRole('button', { name: 'KYC look-alike (demo)' });
    await user.click(kycBtn);

    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });

    expect(shieldStatus).toHaveAttribute('data-state', 'hold');

    expect(resultView).toHaveAttribute('data-score', '78');

    expect(document.body.textContent).toContain('URL RISK');
    expect(document.body.textContent).toContain('78 / 100');
    expect(document.body.textContent).toContain('Reported in threat feed (simulated)');

    const urlLevel = await screen.findByTestId('url-level');
    expect(urlLevel).toHaveTextContent('HIGH CAUTION');
    expect(urlLevel).not.toHaveClass('text-transparent');
    expect(document.body.textContent).toContain('Potentially risky link. Multiple warning signals detected.');
  });

  it('runs analysis for Official bank demo and shows data-score 0', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UrlShield />);

    const bankBtn = screen.getByRole('button', { name: 'Official bank (demo)' });
    await user.click(bankBtn);

    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    expect(resultView).toHaveAttribute('data-score', '0');

    const urlLevel = await screen.findByTestId('url-level');
    expect(urlLevel).toHaveTextContent('LOW');
  });

  it('runs analysis for Shopping offer demo and shows data-score 30', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UrlShield />);

    const shoppingBtn = screen.getByRole('button', { name: 'Shopping offer (demo)' });
    await user.click(shoppingBtn);

    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    expect(resultView).toHaveAttribute('data-score', '30');
  });

  it('runs analysis for sample malicious url and does not render clickable link', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UrlShield />);

    const testUrl = 'http://kyc-update-verify.xyz/login';
    const input = screen.getByLabelText('URL to analyze');
    await user.type(input, testUrl);

    const checkBtn = screen.getByRole('button', { name: 'CHECK URL' });
    await user.click(checkBtn);

    const urlAnalysis = analyzeUrlLocal(testUrl);
    const hostText = urlAnalysis.host;

    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });

    expect(resultView).toHaveAttribute('data-score', String(urlAnalysis.score));

    expect(document.body.textContent).toContain(hostText);

    const links = screen.queryAllByRole('link');
    links.forEach(link => {
      expect(link).not.toHaveTextContent('kyc-update-verify');
      expect(link.getAttribute('href') ?? '').not.toContain('kyc-update-verify');
    });
  });

  it('loads kyc_scam sample from SCENARIO SAMPLES panel and shows analysis result', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UrlShield />);

    const scenario = getScenario('kyc_scam');

    const samplesHeading = screen.getByText('SCENARIO SAMPLES · DEMO');
    // Walk up to find the hud-panel container (has class "hud-panel")
    let samplesPanel: HTMLElement | null = samplesHeading.parentElement;
    while (samplesPanel && !samplesPanel.classList.contains('hud-panel')) {
      samplesPanel = samplesPanel.parentElement;
    }
    if (!samplesPanel) throw new Error('Could not find SCENARIO SAMPLES panel');

    const sampleBtn = within(samplesPanel).getByRole('button', { name: scenario.shortLabel });
    await user.click(sampleBtn);

    const urlInput = screen.getByLabelText('URL to analyze') as HTMLInputElement;
    expect(urlInput.value).toBe(scenario.url);

    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    expect(resultView).toBeInTheDocument();
  });
});
