import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TechnicalView from './TechnicalView';
import { renderWithRouter } from '../test/utils';
import { useDemoStore } from '../store/demoStore';

describe('TechnicalView', () => {
  it('renders default flagship scenario report and allows toggling score JSON', async () => {
    const user = userEvent.setup();
    useDemoStore.getState().resetDemo();

    renderWithRouter(<TechnicalView />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Signal extraction')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Payment context')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Contributions')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Score & level')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Pattern & DNA')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Attack chain')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Recommendation')).toBeInTheDocument();

    const scoreCard = screen.getByTestId('risk-score-card');
    expect(scoreCard).toHaveAttribute('data-score', '92');
    expect(scoreCard).toHaveTextContent('92');

    const toggleBtns = screen.getAllByRole('button', { name: '{ } JSON' });
    const scoreToggle = toggleBtns[5]; // 6th item, index 5

    await user.click(scoreToggle);

    // Look for JSON containing the score
    expect(screen.getByText(/"score": 92/)).toBeInTheDocument();
  });
});
