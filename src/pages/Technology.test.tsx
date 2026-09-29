import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import Technology from './Technology';
import { renderWithRouter } from '../test/utils';
import { FACTOR_LABELS, LEVELS } from '../engine';

describe('Technology', () => {
  it('renders architecture diagram and explainable scoring table', async () => {
    renderWithRouter(<Technology />);

    expect(screen.getByText(/Same engine, two runtimes: the Python port is checked case by case against the reference engine/i)).toBeInTheDocument();

    // Check components of formula
    expect(screen.getByText('score = baseline + Σ weight × signal value + combination bonuses, clamped to 0-100')).toBeInTheDocument();

    // Check factor labels
    for (const label of Object.values(FACTOR_LABELS)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    // Check levels
    for (const lvl of LEVELS) {
      expect(screen.getByText(lvl.label)).toBeInTheDocument();
    }

    // Check RobotExpressive text from credits
    expect(screen.getByText(/RobotExpressive/i)).toBeInTheDocument();
  });
});
