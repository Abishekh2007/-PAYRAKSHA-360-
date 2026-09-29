import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { useDemoStore } from '../../store/demoStore';

describe('AppLayout & Navigation', () => {
  beforeEach(() => {
    act(() => {
      useDemoStore.getState().resetDemo();
    });
  });

  it('renders the app shell correctly', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div data-testid="child">child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert banner text
    expect(screen.getByText('DEMO ENVIRONMENT — NO REAL PAYMENTS')).toBeInTheDocument();

    // Assert main navigation
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toBeInTheDocument();

    // Assert primary link labels exist
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Live Protection')).toBeInTheDocument();
    expect(screen.getByText('Scan QR')).toBeInTheDocument();
    expect(screen.getByText('Analyze Message')).toBeInTheDocument();
    expect(screen.getByText('Analyze URL')).toBeInTheDocument();
    expect(screen.getByText('Payment Risk')).toBeInTheDocument();
    expect(screen.getByText('Scam Lab')).toBeInTheDocument();
    expect(screen.getByText('Threat Intelligence')).toBeInTheDocument();
    expect(screen.getAllByText('Privacy').length).toBeGreaterThan(0);

    // Assert JUDGE MODE link
    expect(screen.getAllByText('🏆 JUDGE MODE').length).toBeGreaterThan(0);
  });

  it('toggles elder mode class on document element', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const toggle = screen.getAllByRole('switch', { name: 'Elder Safety Mode' })[0];
    expect(document.documentElement.classList.contains('elder')).toBe(false);

    await user.click(toggle);
    expect(document.documentElement.classList.contains('elder')).toBe(true);
    expect(useDemoStore.getState().elderMode).toBe(true);

    await user.click(toggle);
    expect(document.documentElement.classList.contains('elder')).toBe(false);
    expect(useDemoStore.getState().elderMode).toBe(false);
  });

  it('opens More menu and shows "Scam DNA"', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const moreBtn = screen.getByRole('button', { name: /More/i });
    expect(screen.queryByText('Scam DNA')).not.toBeInTheDocument();

    await user.click(moreBtn);
    expect(screen.getByText('Scam DNA')).toBeInTheDocument();
  });

  it('toggles mobile menu aria-expanded state', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const menuBtn = screen.getByLabelText('Open menu');
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });
});
