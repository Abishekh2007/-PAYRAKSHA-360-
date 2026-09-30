import { describe, it, expect, beforeEach } from 'vitest';
import { screen, act, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import { renderWithRouter } from '../test/utils';
import { useDemoStore } from '../store/demoStore';
import { runScenarioLocal, getScenario } from '../engine';

beforeEach(() => {
  act(() => { useDemoStore.getState().resetDemo(); });
});

describe('Dashboard', () => {
  it('renders the dashboard and updates history', () => {
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

  it('shows payment-twin with HIGH level by default', () => {
    renderWithRouter(<Dashboard />);

    const twin = screen.getByTestId('payment-twin');
    expect(twin).toHaveAttribute('data-level', 'HIGH');
  });

  it('clicking a feed row changes the payment-twin and sets aria-pressed', () => {
    renderWithRouter(<Dashboard />);

    const legitTitle = getScenario('legit_utility').title;
    const btn = screen.getByRole('button', { name: (name) => name.includes(legitTitle) });

    act(() => {
      fireEvent.click(btn);
    });

    const twin = screen.getByTestId('payment-twin');
    expect(twin).toHaveAttribute('data-level', 'LOW');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking Analyze in detail stores the selected report', () => {
    renderWithRouter(<Dashboard />);

    // Default selected is utility_scam (HIGH)
    const analyzeBtn = screen.getByRole('button', { name: 'Analyze in detail' });

    act(() => {
      fireEvent.click(analyzeBtn);
    });

    const stored = useDemoStore.getState().current;
    expect(stored).not.toBeNull();
    // The flagship scenario report id matches
    const flagship = runScenarioLocal('utility_scam');
    expect(stored?.report.id).toBe(flagship.id);
  });
});
