import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithRouter } from '../test/utils';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ElderMode from './ElderMode';
import { useDemoStore } from '../store/demoStore';
import { runScenarioLocal, scenarioToInput, getScenario, controlScenarios } from '../engine';
import { readFileSync } from 'fs';
import path from 'path';

describe('ElderMode', () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it('works with switch, flagship defaults and legit_utility', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithRouter(<ElderMode />);

    // Switch sets elderMode
    const toggle = screen.getByRole('switch', { name: /Elder Safety Mode/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    expect(useDemoStore.getState().elderMode).toBe(true);
    expect(screen.getByText(/ELDER MODE SETTINGS/i)).toBeInTheDocument();

    // Flagship defaults
    expect(screen.getByText('⚠️ STOP')).toBeInTheDocument();
    expect(screen.getByText("DON'T PAY YET")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'VERIFY' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CALL TRUSTED PERSON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CANCEL' })).toBeInTheDocument();

    // Record legit_utility analysis directly
    await act(async () => {
      const scenario = getScenario('legit_utility');
      useDemoStore.getState().recordAnalysis({
        label: scenario.title,
        input: scenarioToInput(scenario),
        report: runScenarioLocal('legit_utility'),
        source: 'browser',
      });
    });

    expect(screen.getByText('✅ LOOKS OK')).toBeInTheDocument();
  });

  it('does not use require and can preview scenario', async () => {
    const code = readFileSync(path.resolve(__dirname, 'ElderMode.tsx'), 'utf8');
    expect(code).not.toMatch(/require\(/);

    const user = userEvent.setup();
    renderWithRouter(<ElderMode />);

    const scenario = controlScenarios().find(s => s.id === 'legit_utility')!;
    const select = screen.getByRole('combobox', { name: /Preview scenario/i });
    await user.selectOptions(select, scenario.id);

    expect(useDemoStore.getState().current?.report.score).toBe(runScenarioLocal('legit_utility').score);
    expect(screen.getByText('✅ LOOKS OK')).toBeInTheDocument();
  });
});

