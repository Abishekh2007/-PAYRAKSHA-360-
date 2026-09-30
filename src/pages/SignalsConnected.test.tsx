import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignalsConnected from './SignalsConnected';
import { renderWithRouter } from '../test/utils';
import { runSignalsConnected } from '../engine';

describe('SignalsConnected', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reveals steps on ADD NEXT SIGNAL', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SignalsConnected />);

    expect(screen.getByText('SIGNALS CONNECTED')).toBeInTheDocument();

    const seq = runSignalsConnected();
    const addBtn = screen.getByRole('button', { name: 'ADD NEXT SIGNAL' });

    for (let i = 0; i < seq.steps.length; i++) {
      await user.click(addBtn);
    }

    const meters = screen.getAllByRole('meter');
    expect(meters).toHaveLength(seq.steps.length);
    expect(meters[0]).toHaveAttribute('aria-valuenow', '45');
    // Using length-1 to be safe if the length changes
    expect(meters[seq.steps.length - 1]).toHaveAttribute('aria-valuenow', '85');

    expect(screen.getByText('PAYRAKSHA does not rely on one indicator. Risk increases when multiple contextual signals appear together.')).toBeInTheDocument();
  });

  it('PLAY ALL auto-reveals steps at 700 ms intervals', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWithRouter(<SignalsConnected />);

    const playBtn = screen.getByRole('button', { name: 'PLAY ALL' });
    act(() => { playBtn.click(); });

    // initially 0 meters since we use transition, they are in the DOM but hidden. Wait, the DOM nodes are mapped for all steps.
    // So all meters are present in the DOM from the beginning.
    // Wait! In our implementation, we render all of them from the start, just with opacity-0.
    // So `screen.getAllByRole('meter')` will return all of them immediately.
    // How to effectively test playing?
    // In jsdom without css, they are all visible to the query.
    // But testing the logic: text "PAYRAKSHA does not rely on one indicator..." is only shown when activeStep === steps.length - 1.
    // We can test that.

    expect(screen.queryByText('PAYRAKSHA does not rely on one indicator. Risk increases when multiple contextual signals appear together.')).not.toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(700 * 4); });

    expect(screen.getByText('PAYRAKSHA does not rely on one indicator. Risk increases when multiple contextual signals appear together.')).toBeInTheDocument();
  });

  it('after revealing all steps scam-constellation has stars and next-move-likelihood exists', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SignalsConnected />);

    const seq = runSignalsConnected();
    const addBtn = screen.getByRole('button', { name: 'ADD NEXT SIGNAL' });

    for (let i = 0; i < seq.steps.length; i++) {
      await user.click(addBtn);
    }

    const constellation = screen.getByTestId('scam-constellation');
    const stars = constellation.querySelectorAll('[data-testid^="star-"]');
    expect(stars.length).toBeGreaterThan(0);

    expect(screen.getByTestId('next-move-likelihood')).toBeInTheDocument();
  });
});
