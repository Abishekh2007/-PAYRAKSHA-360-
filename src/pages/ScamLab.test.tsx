import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderWithRouter } from '../test/utils';
import { screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScamLab from './ScamLab';
import { useDemoStore } from '../store/demoStore';
import { labScenarios, runScenarioLocal } from '../engine';
import * as api from '../services/api';

describe('ScamLab', () => {
    afterEach(() => {
        useDemoStore.getState().resetDemo?.();
        vi.restoreAllMocks();
    });

    it('renders scenarios and runs analysis, checking data-score equals runScenarioLocal score', async () => {
        const user = userEvent.setup();
        renderWithRouter(<ScamLab />);
        const cards = screen.getAllByRole('button', { name: /^RUN IN LAB:/ });
        const scenariosList = labScenarios();
        expect(cards.length).toBe(scenariosList.length);

        for (const s of scenariosList) {
            const report = runScenarioLocal(s.id);
            expect(screen.getAllByText(`${report.attackChain.length} BEATS`).length).toBeGreaterThan(0);
        }

        const { getScenario } = await import('../engine');
        const legitScen = getScenario('legit_utility');
        const scamScen = getScenario('utility_scam');

        const legitRowText = screen.getByText(legitScen.labLabel || legitScen.title).closest('tr')?.textContent;
        expect(legitRowText).toMatch(/SHOULD PASS/);

        const scamRowCells = screen.getAllByRole('cell', { name: scamScen.labLabel || scamScen.title });
        const scamRow = scamRowCells[0].closest('tr');
        expect(scamRow?.textContent).toMatch(/✓ MATCH/);

        const targetScenario = scenariosList.find(s => (s.labLabel || s.title).includes('Customer Care')) || scenariosList[0];

        const btn = screen.getByRole('button', { name: new RegExp(`RUN IN LAB.*${targetScenario.labLabel || targetScenario.title}`, 'i') });
        await user.click(btn);

        const resultView = await screen.findByTestId('risk-result', {}, { timeout: 5000 });
        const expectedScore = runScenarioLocal(targetScenario.id).score;
        expect(resultView).toHaveAttribute('data-score', String(expectedScore));
    });

    it('buttons are disabled while analyzeRisk is pending', async () => {
        const user = userEvent.setup();
        let resolvePromise: (value: any) => void;
        const mockPromise = new Promise<any>((resolve) => {
            resolvePromise = resolve;
        });

        const analyzeRiskSpy = vi.spyOn(api, 'analyzeRisk').mockImplementation(() => mockPromise);

        renderWithRouter(<ScamLab />);

        const scenariosList = labScenarios();
        const targetScenario = scenariosList[0];
        const btn = screen.getByRole('button', { name: new RegExp(`RUN IN LAB: ${targetScenario.labLabel || targetScenario.title}`, 'i') });

        await user.click(btn);

        // Buttons should be disabled
        const allButtons = screen.getAllByRole('button');
        const runButtons = allButtons.filter(b => b.textContent?.includes('RUN IN LAB') || b.textContent?.includes('Analyzing...'));

        expect(runButtons.length).toBeGreaterThan(0);
        runButtons.forEach(button => {
            expect(button).toBeDisabled();
        });

        const clickedButton = screen.getByRole('button', { name: new RegExp(`RUN IN LAB: ${targetScenario.labLabel || targetScenario.title}`, 'i') });
        expect(clickedButton).toHaveTextContent('Analyzing...');

        // Resolve manually
        await act(async () => {
            resolvePromise({
                report: runScenarioLocal(targetScenario.id),
                source: 'browser',
                latencyMs: 10,
                ml: null
            });
        });

        // The buttons should be enabled again
        const reEnabledBtn = await screen.findByRole('button', { name: new RegExp(`RUN IN LAB: ${targetScenario.labLabel || targetScenario.title}`, 'i') });
        expect(reEnabledBtn).not.toBeDisabled();
        expect(reEnabledBtn).toHaveTextContent('RUN IN LAB');
    });
});
