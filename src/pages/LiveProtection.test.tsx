import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderWithRouter } from '../test/utils';
import { screen, act, findByText } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LiveProtection from './LiveProtection';
import { useDemoStore } from '../store/demoStore';
import { runScenarioLocal } from '../engine';

describe('LiveProtection', () => {
    afterEach(() => {
        useDemoStore.getState().resetDemo?.();
    });

    it('renders and shows history', async () => {
        const doc = runScenarioLocal('legit_utility');
        act(() => {
            useDemoStore.getState().recordAnalysis({
                label: 'My test',
                input: {},
                report: doc,
                source: 'browser'
            });
        });

        renderWithRouter(<LiveProtection />);

        expect(screen.getByText('My test')).toBeInTheDocument();
        const link = screen.getByRole('link', { name: /RUN LIVE SCAM SIMULATION/i });
        expect(link).toHaveAttribute('href', '/simulation');
    });
});
