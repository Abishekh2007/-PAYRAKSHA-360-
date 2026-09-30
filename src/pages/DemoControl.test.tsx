import { describe, it, expect } from 'vitest';
import { screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DemoControl from './DemoControl';
import { renderWithRouter } from '../test/utils';
import { useDemoStore } from '../store/demoStore';

describe('DemoControl', () => {
  it('loads customer_care_scam, tests links and resets demo, toggles technical view', async () => {
    const user = userEvent.setup();
    act(() => { useDemoStore.getState().resetDemo(); });
    renderWithRouter(<DemoControl />);
    
    // New SOC element assert
    expect(screen.getByText('MISSION CONTROL')).toBeInTheDocument();

    const row = screen.getByTestId('customer_care_scam');
    const loadBtn = within(row).getByRole('button', { name: 'LOAD AS CURRENT' });
    await user.click(loadBtn);

    expect(screen.getByText('Loaded. Open Explanation, Scam DNA or Attack Chain to present it.')).toBeInTheDocument();
    expect(useDemoStore.getState().current?.report.score).toBe(88);

    const resetBtn = screen.getByRole('button', { name: 'RESET DEMO' });
    await user.click(resetBtn);
    expect(screen.getByText('Demo state cleared.')).toBeInTheDocument();
    expect(useDemoStore.getState().history.length).toBe(0);
    
    const qrRow = screen.getByTestId('utility_scam');
    const link = within(qrRow).getByRole('link', { name: 'OPEN IN QR SHIELD' });
    expect(link).toHaveAttribute('href', '/qr?demo=QR001');

    const techToggle = screen.getByRole('switch', { name: 'Technical View' });
    await user.click(techToggle);
    expect(useDemoStore.getState().technicalView).toBe(true);
  });
});
