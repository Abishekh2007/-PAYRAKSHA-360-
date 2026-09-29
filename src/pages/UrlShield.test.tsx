import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import UrlShield from './UrlShield';
import { getScenario, analyzeLocal, analyzeUrlLocal } from '../engine';

describe('UrlShield', () => {
  it('shows error notice for invalid url', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UrlShield />);

    const input = screen.getByLabelText('URL to analyze');
    await user.type(input, 'not a url');

    const analyzeBtn = screen.getByRole('button', { name: 'ANALYZE URL' });
    await user.click(analyzeBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid URL.');
  });

  it('runs analysis for sample mallicious url', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UrlShield />);

    const input = screen.getByLabelText('URL to analyze');
    const testUrl = 'http://kyc-update-verify.xyz/login';
    await user.type(input, testUrl);

    const analyzeBtn = screen.getByRole('button', { name: 'ANALYZE URL' });
    await user.click(analyzeBtn);

    const urlAnalysis = analyzeUrlLocal(testUrl);
    const hostText = urlAnalysis.host;

    // the host text is visible
    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });

    // using a more flexible approach to find the host text, it's often within paragraphs or lists
    expect(screen.getByText((content, node) => {
      const hasText = (elem: Element) => elem.textContent === hostText;
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node?.children || []).every(child => !hasText(child));
      return nodeHasText && childrenDontHaveText;
    })).toBeInTheDocument();

    // there is no a[href] containing it
    const links = screen.queryAllByRole('link');
    links.forEach(link => {
      expect(link).not.toHaveTextContent(hostText);
    });

    const expectedScore = analyzeLocal({ url: testUrl }).score;
    expect(resultView).toHaveAttribute('data-score', String(expectedScore));
  });
});
