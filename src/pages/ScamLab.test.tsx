import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderWithRouter } from '../test/utils';
import { screen, act, fireEvent } from '@testing-library/react';
import ScamLab from './ScamLab';
import { useDemoStore } from '../store/demoStore';
import { labScenarios } from '../engine';

describe('ScamLab', () => {
    afterEach(() => {
        useDemoStore.getState().resetDemo?.();
    });

    it('renders scenarios and runs analysis', async () => {
        renderWithRouter(<ScamLab />);
        const cards = screen.getAllByRole('button', { name: /^RUN IN LAB:/ });
        expect(cards.length).toBe(labScenarios().length);

        const btn = screen.getByRole('button', { name: /RUN IN LAB.*Customer Care/i }); // assuming 'customer_care_scam' has 'Customer Care' in label
        await act(async () => {
            fireEvent.click(btn);
        });

        const testid = screen.getByTestId('risk-result');
        expect(testid).toHaveAttribute('data-score', '88');
    });
});
