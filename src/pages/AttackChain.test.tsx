import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../test/utils';
import AttackChain from './AttackChain';
import { runScenarioLocal } from '../engine';
import { useDemoStore } from '../store/demoStore';

describe('AttackChain Page', () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it('renders default flagship scenario attack chain count', () => {
    renderWithRouter(<AttackChain />);

    expect(screen.getByTestId('attack-chain')).toBeInTheDocument();

    const report = runScenarioLocal('utility_scam');
    const activeNodes = report.attackChain.filter((n) => n.active);

    const narrativeContainer = screen.getByText('Kill Chain Analysis').nextElementSibling as HTMLElement;
    const listItems = within(narrativeContainer).getAllByRole('listitem').filter(el => el.hasAttribute('data-active'));
    expect(listItems.length).toBe(activeNodes.length);

    expect(screen.getByText(report.recommendation.title)).toBeInTheDocument();
  });
});
