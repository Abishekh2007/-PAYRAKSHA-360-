import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/utils';
import { RiskScoreCard } from './RiskScoreCard';
import { runScenarioLocal } from '../../engine';

describe('RiskScoreCard', () => {
  it('renders correctly for HIGH risk', () => {
    const report = runScenarioLocal('utility_scam');
    renderWithRouter(<RiskScoreCard report={report} />);

    const card = screen.getByTestId('risk-score-card');
    expect(card).toHaveAttribute('data-score', '92');
    expect(card).toHaveAttribute('data-level', 'HIGH');

    expect(screen.getByText('🚨 HIGH RISK PAYMENT')).toBeInTheDocument();
    expect(screen.getAllByText('92 / 100').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HIGH RISK').length).toBeGreaterThan(0); // report.levelLabel

    if (report.patternName) {
      expect(screen.getByText(`Pattern: ${report.patternName}`)).toBeInTheDocument();
    }
  });

  it('renders correctly for LOW risk', () => {
    const report = runScenarioLocal('legit_utility');
    renderWithRouter(<RiskScoreCard report={report} />);

    const card = screen.getByTestId('risk-score-card');
    expect(card).toHaveAttribute('data-score', '12');
    expect(card).toHaveAttribute('data-level', 'LOW');
    expect(screen.getAllByText('12 / 100').length).toBeGreaterThan(0);
  });
});
