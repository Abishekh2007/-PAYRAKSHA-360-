import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import ScamDna from './ScamDna';
import { runScenarioLocal, scenarioToInput } from '../engine';
import { useDemoStore } from '../store/demoStore';

describe('ScamDna Page', () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it('renders default flagship scenario', () => {
    renderWithRouter(<ScamDna />);

    // Check child components are rendered
    expect(screen.getAllByTestId('scam-dna').length).toBeGreaterThan(0);

    // Check for pattern name of flagship (utility_scam)
    const report = runScenarioLocal('utility_scam');
    expect(screen.getByText(report.patternName)).toBeInTheDocument();

    // Check for default message
    expect(screen.getByText(/Showing the flagship demo: QR001 electricity-bill scam/)).toBeInTheDocument();
  });

  it('updates when a new scenario is analysed in the store', () => {
    renderWithRouter(<ScamDna />);

    act(() => {
      const scenarioReport = runScenarioLocal('legit_utility');
      useDemoStore.getState().recordAnalysis({
        label: 'My new analysis test',
        input: scenarioToInput('legit_utility'),
        report: scenarioReport,
        source: 'browser'
      });
    });

    expect(screen.getByText('Showing: My new analysis test')).toBeInTheDocument();
  });

  it('changes scenario when select is used', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ScamDna />);

    const select = screen.getByRole('combobox', { name: 'Load a demo scenario' });
    await user.selectOptions(select, 'kyc_scam');

    // It should load the label from the scenario title.
    // controlScenarios()[x].title for kyc_scam is "Bank KYC Scam" (we just check it updates based on 'Showing:')
    // Run scenario local to get the exact one.
    expect(screen.getByText(/Showing:/)).toBeInTheDocument();
  });
});
