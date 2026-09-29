import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
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

  it('runs analysis for sample utility_scam', async () => {
    const user = userEvent.setup();
    renderWithRouter(<MessageShield />);

    const scenario = getScenario('utility_scam');
    const sampleBtn = screen.getByRole('button', { name: scenario.shortLabel });

    await user.click(sampleBtn);

    // Should load the analysis
    const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    const expectedScore = analyzeLocal({ message: scenario.message }).score;
    expect(resultView).toHaveAttribute('data-score', String(expectedScore));

    // check signal labels exist
    const report = analyzeLocal({ message: scenario.message });
    const textSignals = report.analyses.text.signals;

    if (textSignals.length > 0) {
      // Find the first signal label somewhere in the document
      const firstLabel = textSignals[0].label;
      const regex = new RegExp(firstLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      expect(screen.getAllByText(regex).length).toBeGreaterThan(0);
    }
  });
});
