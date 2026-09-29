import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counterfactual from './Counterfactual';
import { renderWithRouter } from '../test/utils';
import { runCounterfactual } from '../engine';

// Recharts sometimes has issues in jsdom unless mocked or handled, but let's try rendering it first
// If it fails we mock recharts

describe('Counterfactual', () => {
  it('handles steps and shows final text', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Counterfactual />);

    // Base gauge: 92
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '92');

    const cf = runCounterfactual();
    const scores = [62, 39, 24]; // From the prompt

    for (let i = 0; i < cf.steps.length; i++) {
      const step = cf.steps[i];
      const btn = screen.getByRole('button', { name: step.button });
      // Only the next one is enabled if we clicked in order
      expect(btn).not.toBeDisabled();
      await user.click(btn);

      expect(meter).toHaveAttribute('aria-valuenow', scores[i].toString());
    }

    expect(screen.getByText('Context changed. Risk reduced because multiple suspicious signals were removed.')).toBeInTheDocument();

    // Expect the text list "92 → 62 → 39 → 24"
    expect(screen.getByText('92 → 62 → 39 → 24')).toBeInTheDocument();
  });
});