import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../test/utils';
import JudgeMode from './JudgeMode';
import { runScenarioLocal, runSignalsConnected } from '../engine';

describe('JudgeMode', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs act 1 and 2 and 3 correctly', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<JudgeMode />);
    
    // ACT 1
    let btn = screen.getByRole('button', { name: 'RUN ACT 1' });
    await user.click(btn);
    
    act(() => vi.advanceTimersByTime(2000));
    
    let result = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    expect(result).toHaveAttribute('data-score', String(runScenarioLocal('utility_scam').score));
    
    // Prev / Next / Reset are there
    let nextBtn = screen.getByRole('button', { name: 'Next' });
    await user.click(nextBtn);
    
    // ACT 2
    btn = screen.getByRole('button', { name: 'RUN ACT 2' });
    await user.click(btn);
    
    act(() => vi.advanceTimersByTime(2000));
    
    result = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
    expect(result).toHaveAttribute('data-score', String(runScenarioLocal('legit_utility').score));
    
    // ACT 3
    nextBtn = screen.getByRole('button', { name: 'Next' });
    await user.click(nextBtn);
    
    btn = screen.getByRole('button', { name: 'RUN ACT 3' });
    await user.click(btn);
    
    const seq = runSignalsConnected();
    act(() => vi.advanceTimersByTime(seq.steps.length * 600));
    
    // Now check for all step scores being rendered as gauges correctly.
    // The gauge component sets role="meter" with aria-valuenow.
    const gauges = await screen.findAllByRole('meter');
    expect(gauges.length).toBeGreaterThanOrEqual(seq.steps.length);
    
    seq.steps.forEach(step => {
      expect(screen.getByText(step.label)).toBeInTheDocument();
      const gauge = gauges.find(g => g.getAttribute('aria-valuenow') === String(step.report.score));
      expect(gauge).toBeInTheDocument();
    });
    
    expect(screen.getByText('SIGNALS CONNECTED')).toBeInTheDocument();
    expect(screen.getByText(seq.finalText)).toBeInTheDocument();
    expect(screen.getByTestId('kpi-demo-steps')).toBeInTheDocument();
  });
});
