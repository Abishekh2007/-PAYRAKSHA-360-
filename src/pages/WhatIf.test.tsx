import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WhatIf from './WhatIf';
import { renderWithRouter } from '../test/utils';
import { analyzeLocal, whatIfInput, scenarioBook } from '../engine';

describe('WhatIf', () => {
  it('renders correctly and toggling all switches gives correct aria-valuenow and shows finalText', async () => {
    const user = userEvent.setup();
    renderWithRouter(<WhatIf />);

    // heading
    expect(screen.getByText('WHAT WOULD MAKE THIS PAYMENT SAFER?')).toBeInTheDocument();

    const controls = scenarioBook.sequences.whatIf.controls;

    // Check initial state
    const allIds = controls.map(c => c.id);
    const expected = analyzeLocal(whatIfInput(allIds));

    for (const c of controls) {
      const toggle = screen.getByRole('switch', { name: c.label });
      expect(toggle).not.toBeChecked();
      await user.click(toggle);
    }

    // Base and current meters
    const meters = screen.getAllByRole('meter');
    // base is [0], current is [1]
    expect(meters[1]).toHaveAttribute('aria-valuenow', expected.score.toString());

    // 'Risk context changed…' string
    expect(screen.getAllByText('Risk context changed because suspicious signals were removed.')[0]).toBeInTheDocument();
  });
});