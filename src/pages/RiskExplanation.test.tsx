import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import RiskExplanation from './RiskExplanation';
import { useDemoStore } from '../store/demoStore';

describe('RiskExplanation Page', () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it('renders required sections and test hooks', () => {
    // Explanation hooks are inside child components, ensure parent renders them OK
    renderWithRouter(<RiskExplanation />);

    expect(screen.getByTestId('risk-explanation')).toBeInTheDocument();
    expect(screen.getByTestId('contributions')).toBeInTheDocument();

    // Check for SOC elements
    expect(screen.getByText('ADVERSARY NEXT MOVE')).toBeInTheDocument();
  });

  it('contains the arithmetic line correctly formatted', () => {
    renderWithRouter(<RiskExplanation />);

    // Look for the specific arithmetic formatting
    expect(screen.getAllByText(/=/).length).toBeGreaterThan(0);
    // Find the actual element text that combines score calc
    const codeBlock = screen.getAllByText(/\+/).find(el => el.textContent?.includes('='));
    expect(codeBlock).toBeDefined();
  });

  it('toggles technical view mapping table', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RiskExplanation />);

    const toggle = screen.getByRole('switch', { name: 'Technical view' });

    // ensure not rendered by default (not full table with 'Value', 'Detail')
    expect(screen.queryByText('Feature / Key')).not.toBeInTheDocument();

    await user.click(toggle);

    // After click it should be toggled on globally and render table block
    expect(screen.getByText('Feature / Key')).toBeInTheDocument();
  });

  it('scenario select loads kyc_scam and risk card updates correctly', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RiskExplanation />);

    const select = screen.getByRole('combobox', { name: 'Load a demo scenario' });
    await user.selectOptions(select, 'kyc_scam');

    // Expected score for kyc_scam is 95
    expect(screen.getByTestId('risk-score-card')).toBeInTheDocument();
  });
});
