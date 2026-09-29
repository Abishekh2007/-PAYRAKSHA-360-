import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderWithRouter } from '../test/utils';
import { screen, act, fireEvent } from '@testing-library/react';
import LiveSimulation from './LiveSimulation';
import { useDemoStore } from '../store/demoStore';

describe('LiveSimulation', () => {
    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        useDemoStore.getState().resetDemo?.();
    });

    it('plays through to the end', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        renderWithRouter(<LiveSimulation />);

        await act(async () => {
             const runBtn = screen.getByRole('button', { name: /RUN LIVE SCAM SIMULATION/i });
             fireEvent.click(runBtn);
        });

        await act(async () => {
             vi.advanceTimersByTime(10000);
        });

        // There may be multiple elements with this text (heading + recommendation panel)
        const dontPay = screen.getAllByText(/DON'T PAY YET/i);
        expect(dontPay.length).toBeGreaterThan(0);

        const testid = screen.getByTestId('risk-result');
        expect(testid).toHaveAttribute('data-score', '92');

        const state = useDemoStore.getState();
        expect(state.current?.label).toBe('Live scam simulation');
    });

    it('skips to end', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        renderWithRouter(<LiveSimulation />);

        await act(async () => {
             const runBtn = screen.getByRole('button', { name: /RUN LIVE SCAM SIMULATION/i });
             fireEvent.click(runBtn);
        });

        await act(async () => {
             const skipBtn = screen.getByRole('button', { name: /SKIP TO END/i });
             fireEvent.click(skipBtn);
        });

        const dontPay = screen.getAllByText(/DON'T PAY YET/i);
        expect(dontPay.length).toBeGreaterThan(0);

        const state = useDemoStore.getState();
        expect(state.current?.label).toBe('Live scam simulation');
    });
});
