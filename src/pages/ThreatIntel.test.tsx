import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import ThreatIntel from './ThreatIntel';
import { renderWithRouter } from '../test/utils';
import { runScenarioLocal } from '../engine';

describe('ThreatIntel', () => {
  it('renders labels and engine data correctly', () => {
    renderWithRouter(<ThreatIntel />);

    expect(screen.getAllByText('SIMULATED HACKATHON DATA')[0]).toBeInTheDocument();
    expect(screen.getByText('Illustrative numbers for the demo. Not real-world statistics.')).toBeInTheDocument();

    const utilityReport = runScenarioLocal('utility_scam');
    expect(screen.getAllByText(String(utilityReport.score))[0]).toBeInTheDocument();
    expect(screen.getAllByText(utilityReport.levelLabel)[0]).toBeInTheDocument();
    expect(screen.getAllByText(utilityReport.patternName)[0]).toBeInTheDocument();

    // Check for SOC elements and styling markers
    expect(screen.getByText('THREAT INTELLIGENCE BOARD')).toBeInTheDocument();
  });
});
