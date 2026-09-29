import { describe, it, expect } from 'vitest';
import { screen, act } from '@testing-library/react';
import Dashboard from './Dashboard';
import { renderWithRouter } from '../test/utils';
import { useDemoStore } from '../store/demoStore';
import { runScenarioLocal } from '../engine';

describe('Dashboard', () => {
  it('renders the dashboard and updates history', () => {
    act(() => { useDemoStore.getState().resetDemo(); });
    renderWithRouter(<Dashboard />);

    const badges = screen.getAllByText('SIMULATION / DEMO');
    expect(badges.length).toBeGreaterThan(0);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Threats analyzed')).toBeInTheDocument();
    
    expect(screen.getByText('Analyses').nextElementSibling?.textContent).toBe('0');

    act(() => {
      useDemoStore.getState().recordAnalysis({
        label: 'Test Analysis',
        input: {},
        report: runScenarioLocal('utility_scam'),
        source: 'browser'
      });
    });

    expect(screen.getByText('Analyses').nextElementSibling?.textContent).toBe('1');
    expect(screen.getByText('High / High Caution').nextElementSibling?.textContent).toBe('1');
  });
});
