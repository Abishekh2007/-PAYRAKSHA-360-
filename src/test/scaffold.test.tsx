import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { runCounterfactual, runLiveSimulation, runScenarioLocal, runSignalsConnected } from '../engine';

describe('scaffold', () => {
  it('reproduces the engine anchors', () => {
    expect(runScenarioLocal('utility_scam')).toMatchObject({ score: 92, level: 'HIGH' });
    expect(runScenarioLocal('legit_utility')).toMatchObject({ score: 12, level: 'LOW' });
    expect(runScenarioLocal('customer_care_scam')).toMatchObject({ score: 88, level: 'HIGH' });
    const cf = runCounterfactual();
    expect([cf.base.score, ...cf.steps.map((s) => s.report.score)]).toEqual([92, 62, 39, 24]);
    expect(runSignalsConnected().steps.map((s) => s.report.score)).toEqual([45, 66, 77, 85]);
    const stages = runLiveSimulation().phases.map((p) => p.report.score);
    expect(stages[0]).toBe(54);
    expect(stages[stages.length - 1]).toBe(92);
  });

  it('renders the app shell with the demo banner', async () => {
    render(<App />);
    expect(screen.getAllByText('DEMO ENVIRONMENT — NO REAL PAYMENTS').length).toBeGreaterThan(0);
    expect((await screen.findAllByRole('navigation')).length).toBeGreaterThan(0);
  });
});
