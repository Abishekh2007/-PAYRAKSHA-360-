import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CommandPalette, { openCommandPalette } from './CommandPalette';
import { useDemoStore } from '../../store/demoStore';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="loc">{location.pathname}</div>;
}

function renderWithRouter(ui: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      {ui}
      <LocationProbe />
    </MemoryRouter>
  );
}

describe('CommandPalette', () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it('is closed by default', () => {
    renderWithRouter(<CommandPalette />);
    expect(screen.queryByRole('dialog', { name: /Command palette/i })).not.toBeInTheDocument();
  });

  it('opens on Ctrl+K and closes on Escape', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CommandPalette />);
    
    await user.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('dialog', { name: /Command palette/i })).toBeInTheDocument();
    
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Command palette/i })).not.toBeInTheDocument();
    });
  });

  it('opens on PALETTE_EVENT', async () => {
    renderWithRouter(<CommandPalette />);
    act(() => {
      openCommandPalette();
    });
    expect(await screen.findByRole('dialog', { name: /Command palette/i })).toBeInTheDocument();
  });

  it('filters commands when typing', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CommandPalette />);
    act(() => {
      openCommandPalette();
    });
    
    const input = await screen.findByRole('textbox', { name: /Search commands/i });
    await user.type(input, 'dna');
    
    expect(screen.getByText('Scam DNA')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('navigates and closes on ArrowDown + Enter', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CommandPalette />);
    act(() => {
      openCommandPalette();
    });
    
    const input = await screen.findByRole('textbox', { name: /Search commands/i });
    await user.type(input, 'dna');
    
    // Active index is 0. ArrowDown (wraps to 0 again since there is 1 result)
    await user.keyboard('{ArrowDown}{Enter}');
    
    expect(screen.getByTestId('loc')).toHaveTextContent('/dna');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Command palette/i })).not.toBeInTheDocument();
    });
  });

  it('runs demo scenario and navigates', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CommandPalette />);
    act(() => {
      openCommandPalette();
    });
    
    const input = await screen.findByRole('textbox', { name: /Search commands/i });
    await user.type(input, 'Electricity Disconnection Scam');
    
    await user.keyboard('{Enter}');
    
    expect(useDemoStore.getState().current?.label).toBe('Electricity Disconnection Scam');
    expect(screen.getByTestId('loc')).toHaveTextContent('/explain');
  });
});
