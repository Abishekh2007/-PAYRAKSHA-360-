import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { predictNextMove, NEXT_MOVES, NextMoveCard } from '../../src/components/soc';
import { runScenarioLocal, runLiveSimulation, scenarios } from '../../src/engine';

describe('predictNextMove and NextMoveCard', () => {
  it('returns null for null, undefined, legit_utility, legit_merchant', () => {
    expect(predictNextMove(null)).toBeNull();
    expect(predictNextMove(undefined)).toBeNull();
    expect(predictNextMove(runScenarioLocal('legit_utility'))).toBeNull();
    expect(predictNextMove(runScenarioLocal('legit_merchant'))).toBeNull();
  });

  it('predicts utility_scam next move', () => {
    const utility = runScenarioLocal('utility_scam');
    expect(predictNextMove(utility)).toEqual({
      category: 'utility',
      move: NEXT_MOVES.utility.move,
      counter: NEXT_MOVES.utility.counter,
      likelihood: 78,
      basis: 'Utility / Electricity pattern · 8 warning signals',
    });
  });

  it('predicts customer_care_scam next move', () => {
    const care = runScenarioLocal('customer_care_scam');
    expect(predictNextMove(care)).toEqual({
      category: 'customer_care',
      move: NEXT_MOVES.customer_care.move,
      counter: NEXT_MOVES.customer_care.counter,
      likelihood: 75,
      basis: 'Customer Care pattern · 8 warning signals',
    });
  });

  it('predicts for live simulation phase 0', () => {
    const report = runLiveSimulation().phases[0].report;
    const result = predictNextMove(report);
    expect(result?.likelihood).toBe(55);
    expect(result?.basis.endsWith('· 5 warning signals')).toBe(true);
  });

  it('validates likelihood constraints for all scenarios', () => {
    for (const s of scenarios) {
      const r = runScenarioLocal(s.id);
      const result = predictNextMove(r);
      if (r.level === 'LOW') {
        expect(result).toBeNull();
      } else {
        expect(result).not.toBeNull();
        if (result) {
          expect(Number.isInteger(result.likelihood)).toBe(true);
          expect(result.likelihood).toBeGreaterThanOrEqual(55);
          expect(result.likelihood).toBeLessThanOrEqual(90);
        }
      }
    }
  });

  it('renders NextMoveCard for utility_scam', () => {
    render(<NextMoveCard report={runScenarioLocal('utility_scam')} />);
    const wrapper = screen.getByTestId('next-move');
    screen.getByRole('heading', { name: /SCAMMER.S LIKELY NEXT MOVE/ });
    expect(wrapper).toHaveTextContent(NEXT_MOVES.utility.move);
    expect(wrapper).toHaveTextContent('COUNTER-MOVE');
    expect(wrapper).toHaveTextContent(NEXT_MOVES.utility.counter);
    expect(wrapper).toHaveTextContent('Utility / Electricity pattern · 8 warning signals');
    expect(wrapper).toHaveTextContent('simulated likelihood');
    expect(wrapper).toHaveTextContent('SIMULATION');

    const likelihood = screen.getByTestId('next-move-likelihood');
    expect(likelihood).toHaveTextContent('78%');
  });

  it('renders NextMoveCard for legit_utility', () => {
    render(<NextMoveCard report={runScenarioLocal('legit_utility')} />);
    const wrapper = screen.getByTestId('next-move');
    screen.getByRole('heading', { name: /SCAMMER.S LIKELY NEXT MOVE/ });
    expect(wrapper).toHaveTextContent('NO NEXT MOVE PREDICTED');
    expect(wrapper).toHaveTextContent('SIMULATION');
    expect(screen.queryByTestId('next-move-likelihood')).toBeNull();
  });

  it('renders NextMoveCard for null', () => {
    render(<NextMoveCard report={null} />);
    const wrapper = screen.getByTestId('next-move');
    screen.getByRole('heading', { name: /SCAMMER.S LIKELY NEXT MOVE/ });
    expect(wrapper).toHaveTextContent('NO NEXT MOVE PREDICTED');
    expect(wrapper).toHaveTextContent('SIMULATION');
    expect(screen.queryByTestId('next-move-likelihood')).toBeNull();
  });
});
